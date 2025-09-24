export interface User {
  id: string;
  email: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  avatarUrl?: string | null;
  metadata?: Record<string, any>;
}

export interface Session {
  user: User | null;
  accessToken: string | null;
  refreshToken?: string | null;
  expiresAt?: number;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface AuthProviderOptions {
  redirectUrl?: string;
  shouldPersistSession?: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
  metadata?: Record<string, any>;
}

export interface AuthStateChangeCallback {
  (session: Session | null): void;
}

export interface AuthProvider {
  // Core authentication methods
  signUp: (credentials: AuthCredentials) => Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }>;

  signIn: (credentials: AuthCredentials) => Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }>;

  signInWithGoogle: () => Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }>;

  signOut: () => Promise<{ error: AuthError | null }>;

  // Session management
  getSession: () => Promise<Session | null>;
  refreshSession: () => Promise<Session | null>;

  // User operations
  getCurrentUser: () => Promise<User | null>;
  updateUser: (attributes: Partial<User>) => Promise<{
    user: User | null;
    error: AuthError | null;
  }>;

  // Password management
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;

  // Event listeners
  onAuthStateChange: (callback: AuthStateChangeCallback) => {
    unsubscribe: () => void;
  };
}
