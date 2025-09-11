"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SupabaseAuthProvider } from "@/lib/auth/supabase";
import {
  AuthProvider as CustomAuthProvider,
  Session,
  User,
  AuthCredentials,
  AuthError,
} from "@/lib/auth/types";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: AuthCredentials) => Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }>;
  signUp: (credentials: AuthCredentials) => Promise<{
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
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateUser: (attributes: Partial<User>) => Promise<{
    user: User | null;
    error: AuthError | null;
  }>;
}

// Create default authentication provider (Supabase in this case)
const authProvider = new SupabaseAuthProvider({
  redirectUrl:
    typeof window !== "undefined" ? window.location.origin : undefined,
});

// Create auth context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({
  children,
  customAuthProvider,
}: {
  children: React.ReactNode;
  customAuthProvider?: CustomAuthProvider;
}) {
  // Use the provided auth provider or default to Supabase
  const provider = customAuthProvider || authProvider;

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the current session
        const currentSession = await provider.getSession();
        setSession(currentSession);

        // If we have a session, get the user
        if (currentSession?.user) {
          setUser(currentSession.user);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [provider]);

  // Set up auth state change listener
  useEffect(() => {
    const { unsubscribe } = provider.onAuthStateChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
    });

    return () => {
      unsubscribe();
    };
  }, [provider]);

  const value = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session?.user,
    signIn: provider.signIn.bind(provider),
    signUp: provider.signUp.bind(provider),
    signInWithGoogle: provider.signInWithGoogle.bind(provider),
    signOut: provider.signOut.bind(provider),
    resetPassword: provider.resetPassword.bind(provider),
    updatePassword: provider.updatePassword.bind(provider),
    updateUser: provider.updateUser.bind(provider),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
}
