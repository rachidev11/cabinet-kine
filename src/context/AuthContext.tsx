'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ─── Types & Configuration ──────────────────────────────────────────────────

export type UserRole = 'kine' | 'assistante';

export interface UserProfile {
  id: string;
  name: string;
  full_name: string;
  role: UserRole;
  email: string;
  isOwner: boolean;
}

export const PIN_CODES: Record<UserRole, string> = {
  kine: '239021',
  assistante: '000000',
};

export const PROFILES_CONFIG: Record<UserRole, UserProfile> = {
  kine: {
    id: 'kine-hassna',
    name: 'Hassna El-Hmaidi',
    full_name: 'Hassna El-Hmaidi',
    role: 'kine',
    email: 'hassna.elhmaidi@cabinet-kine.ma',
    isOwner: true,
  },
  assistante: {
    id: 'assistante-cabinet',
    name: 'Assistante Médicale',
    full_name: 'Assistante Médicale',
    role: 'assistante',
    email: 'assistante@cabinet-kine.ma',
    isOwner: false,
  },
};

const STORAGE_KEY = 'cabinet_auth_profile';

function getInitialProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && (parsed.role === 'kine' || parsed.role === 'assistante')) {
        return {
          id: parsed.id || (parsed.role === 'kine' ? 'kine-hassna' : 'assistante-cabinet'),
          name: parsed.name || parsed.full_name || (parsed.role === 'kine' ? 'Hassna El-Hmaidi' : 'Assistante Médicale'),
          full_name: parsed.full_name || parsed.name || (parsed.role === 'kine' ? 'Hassna El-Hmaidi' : 'Assistante Médicale'),
          role: parsed.role,
          email: parsed.email || '',
          isOwner: parsed.role === 'kine' ? true : Boolean(parsed.isOwner),
        };
      }
    }
  } catch (err) {
    console.warn('Erreur lecture session locale:', err);
  }
  return null;
}

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
  isOwner: boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount and sync state
  useEffect(() => {
    const current = getInitialProfile();
    if (current) {
      setProfile(current);
    }
    setLoading(false);
  }, []);

  // Login with PIN
  const loginWithPin = useCallback((roleKey: UserRole, pin: string): { success: boolean; error?: string } => {
    const expectedPin = PIN_CODES[roleKey];
    if (pin.trim() !== expectedPin) {
      return { success: false, error: 'Code PIN incorrect. Veuillez réessayer.' };
    }

    const config = PROFILES_CONFIG[roleKey];
    const selectedProfile: UserProfile = {
      id: config.id,
      name: config.name,
      full_name: config.full_name,
      role: roleKey,
      email: config.email,
      isOwner: roleKey === 'kine',
    };

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

  const isKine = profile?.role === 'kine' || profile?.isOwner === true;
  const isOwner = Boolean(profile?.isOwner || profile?.role === 'kine');
  const isAssistante = profile?.role === 'assistante' && !isKine;

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
        isOwner,
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
