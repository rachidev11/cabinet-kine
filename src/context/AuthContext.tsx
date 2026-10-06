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

export const DEFAULT_KINE_PROFILE: UserProfile = {
  id: 'kine-hassna-default',
  full_name: 'Hassna El-Hmaidi',
  role: 'kine',
  email: 'hassna.elhmaidi@cabinet-kine.ma',
};

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(DEFAULT_KINE_PROFILE);
  const [loading, setLoading] = useState(false);

  // Fetch the profile from `profiles` table for a given user id (non-blocking with timeout)
  const fetchProfile = useCallback(async (userId: string, email: string) => {
    try {
      // 3-second timeout protection so profile query never hangs the interface
      const profilePromise = supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'Timeout profil' } }), 3000)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.warn('Note sur le profil (utilisation fallback):', error.message);
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name || email.split('@')[0] || 'Utilisateur',
          role: (data.role as UserRole) || 'assistante',
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
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (existingSession?.user) {
          setSession(existingSession);
          setUser(existingSession.user);
          // Set initial profile immediately so UI is unblocked
          setProfile({
            id: existingSession.user.id,
            full_name: existingSession.user.email?.split('@')[0] ?? 'Utilisateur',
            role: 'assistante',
            email: existingSession.user.email ?? '',
          });
          // Asynchronous non-blocking fetch from profiles table
          fetchProfile(existingSession.user.id, existingSession.user.email ?? '');
        }
      } catch (err) {
        console.warn('Session init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Immediately set fallback profile if none exists
          setProfile((prev) => prev ?? {
            id: newSession.user.id,
            full_name: newSession.user.email?.split('@')[0] ?? 'Utilisateur',
            role: 'assistante',
            email: newSession.user.email ?? '',
          });
          // Asynchronously enrich from profiles table in the background
          fetchProfile(newSession.user.id, newSession.user.email ?? '');
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

      setLoading(false);
      return { error: null };
    } catch (err) {
      setLoading(false);
      return { error: err instanceof Error ? err.message : 'Erreur de connexion.' };
    }
  };

  // ── Sign-out ─────────────────────────────────────────────────────────────

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    setProfile(DEFAULT_KINE_PROFILE);
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
