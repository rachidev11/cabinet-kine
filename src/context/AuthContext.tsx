'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type UserRole = 'kine' | 'assistante';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Shorthand role helpers */
  isKine: boolean;
  isAssistante: boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the profile from `profiles` table for a given user id
  const fetchProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Erreur lors de la récupération du profil:', error.message);
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name ?? email,
          role: (data.role as UserRole) ?? 'assistante',
          email,
        });
      } else {
        // No profile row yet – fall back to email-derived display name
        setProfile({
          id: userId,
          full_name: email.split('@')[0],
          role: 'assistante',
          email,
        });
      }
    } catch (err) {
      console.warn('fetchProfile exception:', err);
    }
  }, []);

  // Bootstrap: restore existing session on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (existingSession?.user) {
        setSession(existingSession);
        setUser(existingSession.user);
        await fetchProfile(existingSession.user.id, existingSession.user.email ?? '');
      }

      setLoading(false);
    };

    init();

    // Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id, newSession.user.email ?? '');
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ── Sign-in ─────────────────────────────────────────────────────────────

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setLoading(false);
        // Translate common Supabase auth errors to French
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Email ou mot de passe incorrect.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Veuillez confirmer votre email avant de vous connecter.' };
        }
        return { error: error.message };
      }

      // onAuthStateChange will handle state update + profile fetch
      return { error: null };
    } catch (err) {
      setLoading(false);
      return { error: err instanceof Error ? err.message : 'Erreur de connexion.' };
    }
  };

  // ── Sign-out ─────────────────────────────────────────────────────────────

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const isKine = profile?.role === 'kine';
  const isAssistante = profile?.role === 'assistante';

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signIn, signOut, isKine, isAssistante }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
