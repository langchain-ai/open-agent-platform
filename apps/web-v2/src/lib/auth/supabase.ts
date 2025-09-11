import {
  AuthProvider,
  AuthCredentials,
  AuthError,
  Session,
  User,
  AuthStateChangeCallback,
  AuthProviderOptions,
} from "./types";
import { getSupabaseClient } from "./supabase-client";

export class SupabaseAuthProvider implements AuthProvider {
  private supabase;
  private options: AuthProviderOptions;

  constructor(options: AuthProviderOptions = {}) {
    this.supabase = getSupabaseClient();
    this.options = {
      shouldPersistSession: true,
      redirectUrl:
        typeof window !== "undefined"
          ? `${window.location.origin}/api/auth/callback`
          : undefined,
      ...options,
    };
  }

  // Helper to convert Supabase User to our User interface
  private formatUser(supabaseUser: any): User | null {
    if (!supabaseUser) return null;

    // Extract metadata from user_metadata
    const metadata = supabaseUser.user_metadata || {};

    // Determine name - prefer explicit first_name/last_name from our app
    // but fall back to name from Google/OAuth or email username
    const firstName =
      metadata.first_name || metadata.name?.split(" ")[0] || null;
    const lastName =
      metadata.last_name ||
      metadata.name?.split(" ").slice(1).join(" ") ||
      null;

    // Construct display name from available data
    const displayName =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : metadata.name || supabaseUser.email?.split("@")[0] || null;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      displayName,
      firstName,
      lastName,
      companyName: metadata.company_name || null,
      avatarUrl: metadata.avatar_url || null,
      metadata,
    };
  }

  // Helper to convert Supabase Session to our Session interface
  private formatSession(supabaseSession: any): Session | null {
    if (!supabaseSession) return null;

    return {
      user: this.formatUser(supabaseSession.user),
      accessToken: supabaseSession.access_token,
      refreshToken: supabaseSession.refresh_token,
      expiresAt: supabaseSession.expires_at,
    };
  }

  // Convert Supabase error to our AuthError format
  private formatError(error: any): AuthError | null {
    if (!error) return null;

    console.error("Auth error:", error);

    return {
      message: error.message || "An unknown error occurred",
      status: error.status,
      code: error.code,
    };
  }

  async signUp(credentials: AuthCredentials) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: this.options.redirectUrl,
          data: credentials.metadata || {},
        },
      });

      if (error) throw error;

      return {
        user: this.formatUser(data?.user),
        session: this.formatSession(data?.session),
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: this.formatError(error),
      };
    }
  }

  async signIn(credentials: AuthCredentials) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      return {
        user: this.formatUser(data?.user),
        session: this.formatSession(data?.session),
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: this.formatError(error),
      };
    }
  }

  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: this.options.redirectUrl,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;

      // For browser environments, handle the redirect
      if (typeof window !== "undefined" && data?.url) {
        window.location.href = data.url;
      }

      // OAuth returns data.url - handled above in browser environments
      return {
        user: null,
        session: null,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: this.formatError(error),
      };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: this.formatError(error) };
    }
  }

  async getSession() {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error) throw error;

      return this.formatSession(data.session);
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  }

  async refreshSession() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) throw error;

      return this.formatSession(data.session);
    } catch (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
  }

  async getCurrentUser() {
    try {
      const { data, error } = await this.supabase.auth.getUser();

      if (error) throw error;

      return this.formatUser(data.user);
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  async updateUser(attributes: Partial<User>) {
    try {
      // Convert our User attributes to Supabase format
      const metadata: Record<string, any> = {
        ...attributes.metadata,
      };

      // Handle specific fields for our application
      if (attributes.firstName !== undefined)
        metadata.first_name = attributes.firstName;
      if (attributes.lastName !== undefined)
        metadata.last_name = attributes.lastName;
      if (attributes.companyName !== undefined)
        metadata.company_name = attributes.companyName;
      if (attributes.avatarUrl !== undefined)
        metadata.avatar_url = attributes.avatarUrl;

      // If first and last name are provided, update the name field too
      if (attributes.firstName && attributes.lastName) {
        metadata.name = `${attributes.firstName} ${attributes.lastName}`.trim();
      } else if (attributes.displayName) {
        metadata.name = attributes.displayName;
      }

      const supabaseAttributes: any = {
        email: attributes.email,
        data: metadata,
      };

      const { data, error } =
        await this.supabase.auth.updateUser(supabaseAttributes);

      if (error) throw error;

      return {
        user: this.formatUser(data.user),
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: this.formatError(error),
      };
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${this.options.redirectUrl}/reset-password`,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: this.formatError(error) };
    }
  }

  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: this.formatError(error) };
    }
  }

  onAuthStateChange(callback: AuthStateChangeCallback) {
    const { data } = this.supabase.auth.onAuthStateChange((_event, session) => {
      callback(this.formatSession(session));
    });

    return {
      unsubscribe: () => {
        data.subscription.unsubscribe();
      },
    };
  }
}
