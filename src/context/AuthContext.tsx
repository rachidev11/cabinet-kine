'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ─── Types & Configuration ──────────────────────────────────────────────────

export type UserRole = 'kine' | 'assistante';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
}

export const PIN_CODES: Record<UserRole, string> = {
  kine: '239021',
  assistante: '000000',
};

export const PROFILES_CONFIG: Record<UserRole, UserProfile> = {
  kine: {
    id: 'kine-hassna',
    full_name: 'Hassna El-Hmaidi',
    role: 'kine',
    email: 'hassna.elhmaidi@cabinet-kine.ma',
  },
  assistante: {
    id: 'assistante-cabinet',
    full_name: 'Assistante du Cabinet',
    role: 'assistante',
    email: 'assistante@cabinet-kine.ma',
  },
};

const STORAGE_KEY = 'cabinet_auth_profile';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithPin: (roleKey: UserRole, pin: string) => { success: boolean; error?: string };
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
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

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.role === 'kine' || parsed.role === 'assistante')) {
          setProfile(parsed);
        }
      }
    } catch (err) {
      console.warn('Erreur lecture session locale:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login with PIN
  const loginWithPin = useCallback((roleKey: UserRole, pin: string): { success: boolean; error?: string } => {
    const expectedPin = PIN_CODES[roleKey];
    if (pin.trim() !== expectedPin) {
      return { success: false, error: 'Code PIN incorrect. Veuillez réessayer.' };
    }

    const selectedProfile = PROFILES_CONFIG[roleKey];
    setProfile(selectedProfile);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedProfile));
    } catch (err) {
      console.warn('localStorage save error:', err);
    }

    return { success: true };
  }, []);

  // Supabase fallback login (if used)
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erreur de connexion' };
    }
  };

  // Sign out / Switch user
  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('localStorage clear error:', err);
    }
    setProfile(null);
    setUser(null);
    setSession(null);
  }, []);

  const isKine = profile?.role === 'kine';
  const isAssistante = profile?.role === 'assistante';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        loginWithPin,
        signIn,
        signOut,
        isKine,
        isAssistante,
      }}
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
