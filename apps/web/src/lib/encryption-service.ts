// TODO: Replace this mock encryption with a real cryptographic library (e.g., 'crypto-js' or Node.js 'crypto' module if backend)
// and ensure proper key management. This current implementation is NOT secure and is for placeholder purposes only.
// For actual encryption, consider AES-256-GCM or similar, with keys managed via environment variables or a secret manager.

/**
 * Mock encrypts text.
 * Prepends a marker and Base64 encodes the original text.
 * @param text The text to encrypt.
 * @returns A promise that resolves to the mock-encrypted string.
 */
export async function encrypt(text: string): Promise<string> {
  if (typeof text !== 'string') {
    throw new Error('Invalid input: text must be a string.');
  }
  try {
    const base64Encoded = Buffer.from(text, 'utf8').toString('base64');
    return `mock-encrypted-${base64Encoded}`;
  } catch (error) {
    console.error("Mock encryption error:", error);
    throw new Error("Mock encryption failed.");
  }
}

/**
 * Mock decrypts text.
 * Checks for the 'mock-encrypted-' prefix, removes it, and Base64 decodes the rest.
 * @param encryptedText The text to decrypt.
 * @returns A promise that resolves to the decrypted string.
 * @throws Error if the text is not in the expected mock-encrypted format or decryption fails.
 */
export async function decrypt(encryptedText: string): Promise<string> {
  if (typeof encryptedText !== 'string') {
    throw new Error('Invalid input: encryptedText must be a string.');
  }
  const prefix = "mock-encrypted-";
  if (!encryptedText.startsWith(prefix)) {
    throw new Error("Invalid mock encrypted format: prefix missing.");
  }
  try {
    const base64Part = encryptedText.substring(prefix.length);
    if (!base64Part) {
        throw new Error("Invalid mock encrypted format: no content after prefix.");
    }
    const decryptedText = Buffer.from(base64Part, 'base64').toString('utf8');
    return decryptedText;
  } catch (error) {
    console.error("Mock decryption error:", error);
    // Check if it's a Base64 decoding error specifically
    if (error instanceof Error && (error.message.includes("Invalid base64 string") || (error as any).code === 'ERR_INVALID_URL_ENCODED_CHAR')) {
         throw new Error("Mock decryption failed: Invalid Base64 content.");
    }
    throw new Error("Mock decryption failed.");
  }
}
