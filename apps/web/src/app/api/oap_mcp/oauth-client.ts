import {
  OAuthClientProvider
} from '@modelcontextprotocol/sdk/client/auth.js';

// import open from 'open';

import type {
  OAuthClientMetadata,
  OAuthClientInformation,
  OAuthTokens,
  OAuthClientInformationFull
} from '@modelcontextprotocol/sdk/shared/auth.js';

// Create a simple localStorage polyfill for Node.js environment
class NodeStorage implements Storage {
  private data: Record<string, string> = {};

  get length(): number {
      return Object.keys(this.data).length;
  }

  clear(): void {
      this.data = {};
  }

  getItem(key: string): string | null {
      return key in this.data ? this.data[key] : null;
  }

  key(index: number): string | null {
      return Object.keys(this.data)[index] || null;
  }

  removeItem(key: string): void {
      delete this.data[key];
  }

  setItem(key: string, value: string): void {
      this.data[key] = value;
  }
}

// Determine if we're in a browser or Node.js environment
const isNodeEnv = typeof window === 'undefined' || typeof localStorage === 'undefined';
const storageImplementation = isNodeEnv ? new NodeStorage() : localStorage;

/**
* An implementation of OAuthClientProvider that works with standard OAuth 2.0 servers.
* This implementation uses localStorage for persisting tokens and client information.
*/
export class PublicOAuthClient implements OAuthClientProvider {
  private storage: Storage;
  private readonly clientMetadataValue: OAuthClientMetadata;
  private readonly redirectUrlValue: string | URL;
  private readonly storageKeyPrefix: string;
  private readonly clientId: string;

  /**
   * Creates a new PublicOAuthClient
   *
   * @param client_id The OAuth client ID
   * @param clientMetadata The OAuth client metadata
   * @param redirectUrl The URL to redirect to after authorization
   * @param storageKeyPrefix Prefix for localStorage keys (default: 'mcp_oauth_')
   * @param storage Storage implementation (default: storageImplementation)
   */
  constructor(
      clientMetadata: OAuthClientMetadata,
      client_id: string,
      redirectUrl: string | URL,
      storageKeyPrefix = 'mcp_oauth_',
      storage = storageImplementation
  ) {
      this.clientId = client_id;
      this.clientMetadataValue = clientMetadata;
      this.redirectUrlValue = redirectUrl;
      this.storageKeyPrefix = storageKeyPrefix;
      this.storage = storage;
  }

  /**
   * The URL to redirect the user agent to after authorization.
   */
  get redirectUrl(): string | URL {
      return this.redirectUrlValue;
  }

  /**
   * Metadata about this OAuth client.
   */
  get clientMetadata(): OAuthClientMetadata {
      return this.clientMetadataValue;
  }

  /**
   * Loads information about this OAuth client from storage
   */
  clientInformation(): OAuthClientInformation | undefined {
      const clientInfoStr = this.storage.getItem(`${this.storageKeyPrefix}client_info`);
      if (!clientInfoStr) {
          // Return basic client information with client_id if nothing in storage
          return {
              client_id: this.clientId
          };
      }

      try {
          return JSON.parse(clientInfoStr) as OAuthClientInformation;
      } catch (e) {
          console.error('Failed to parse client information', e);
          return undefined;
      }
  }

  /**
   * Saves client information to storage
   */
  saveClientInformation(clientInformation: OAuthClientInformationFull): void {
      this.storage.setItem(
          `${this.storageKeyPrefix}client_info`,
          JSON.stringify(clientInformation)
      );
  }

  /**
   * Loads any existing OAuth tokens for the current session
   */
  tokens(): OAuthTokens | undefined {
      const tokensStr = this.storage.getItem(`${this.storageKeyPrefix}tokens`);
      if (!tokensStr) {
          return undefined;
      }

      try {
          return JSON.parse(tokensStr) as OAuthTokens;
      } catch (e) {
          console.error('Failed to parse tokens', e);
          return undefined;
      }
  }

  /**
   * Stores new OAuth tokens for the current session
   */
  saveTokens(tokens: OAuthTokens): void {
      this.storage.setItem(
          `${this.storageKeyPrefix}tokens`,
          JSON.stringify(tokens)
      );
  }

  /**
   * Redirects the user agent to the given authorization URL
   */
  redirectToAuthorization(authorizationUrl: URL): void {
      // TODO: Update MCP TS SDK to add state
      // TODO: Verify state in callback
      const state = crypto.randomUUID();
      authorizationUrl.searchParams.set('state', state);

      const authUrlString = authorizationUrl.toString();

      if (typeof window !== 'undefined') {
          window.location.href = authUrlString;
      } else {
          console.log(`Opening URL: ${authUrlString}`);
          open(authUrlString);
      }
  }

  /**
   * Saves a PKCE code verifier for the current session
   */
  saveCodeVerifier(codeVerifier: string): void {
      console.log("hit saveCodeVerifier");
      this.storage.setItem(`${this.storageKeyPrefix}code_verifier`, codeVerifier);
  }

  /**
   * Loads the PKCE code verifier for the current session
   */
  codeVerifier(): string {
      console.log("hit codeVerifier");
      const verifier = this.storage.getItem(`${this.storageKeyPrefix}code_verifier`);
      if (!verifier) {
          throw new Error('No code verifier found in storage');
      }
      return verifier;
  }

  /**
   * Clears all OAuth-related data from storage
   */
  clearAuth(): void {
      this.storage.removeItem(`${this.storageKeyPrefix}tokens`);
      this.storage.removeItem(`${this.storageKeyPrefix}code_verifier`);
  }
}

/**
* Example usage:
*
* ```typescript
* import { PublicOAuthClient } from './OAuthClient';
* import { auth } from '@modelcontextprotocol/sdk';
*
* // Create client metadata
* const clientMetadata: OAuthClientMetadata = {
*   client_name: 'My Application',
*   redirect_uris: ['https://myapp.com/callback'],
*   scope: 'openid profile email',
* };
*
* // Create the OAuth client
* const oauthClient = new PublicOAuthClient(
*   'my-client-id',
*   clientMetadata,
*   'https://myapp.com/callback'
* );
*
* // Function to initiate the OAuth flow
* async function startOAuthFlow(serverUrl: string) {
*   try {
*     const result = await auth(oauthClient, { serverUrl });
*
*     if (result === 'AUTHORIZED') {
*       // User is authorized, tokens are available
*       const tokens = await oauthClient.tokens();
*       console.log('Authorized with tokens:', tokens);
*     } else if (result === 'REDIRECT') {
*       // User has been redirected to authorization server
*       console.log('User redirected to authorization server');
*     }
*   } catch (error) {
*     console.error('Authorization failed:', error);
*   }
* }
*
* // Handle the OAuth callback
* function handleOAuthCallback() {
*   const urlParams = new URLSearchParams(window.location.search);
*   const code = urlParams.get('code');
*
*   if (code) {
*     // Complete the OAuth flow with the authorization code
*     auth(oauthClient, {
*       serverUrl: 'https://oauth-server.example.com',
*       authorizationCode: code
*     }).then(result => {
*       if (result === 'AUTHORIZED') {
*         console.log('Successfully completed OAuth flow');
*       }
*     });
*   }
* }
* ```
*/