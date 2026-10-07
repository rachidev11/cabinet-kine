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
  permissions?: string[];
}

export const PIN_CODES: Record<UserRole, string> = {
  kine: '239021',
  assistante: '000000',
};

export const PROFILES_CONFIG: Record<UserRole, UserProfile> = {
  kine: {
    id: 'hassna-kine',
    name: 'Hassna El-Hmaidi',
    full_name: 'Hassna El-Hmaidi',
    role: 'kine',
    email: 'hassna.elhmaidi@cabinet-kine.ma',
    isOwner: true,
    permissions: ['all'],
  },
  assistante: {
    id: 'assistante-cabinet',
    name: 'Assistante Médicale',
    full_name: 'Assistante Médicale',
    role: 'assistante',
    email: 'assistante@cabinet-kine.ma',
    isOwner: false,
    permissions: ['reception'],
  },
};

const STORAGE_KEY = 'cabinet_auth_profile';

function getInitialProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawUser = localStorage.getItem('currentUser') || localStorage.getItem(STORAGE_KEY);
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed) {
        const isHassna = Boolean(
          parsed.role === 'kine' ||
          parsed.isOwner === true ||
          (parsed.name && parsed.name.includes('Hassna'))
        );
        return {
          id: parsed.id || (isHassna ? 'hassna-kine' : 'assistante-cabinet'),
          name: parsed.name || (isHassna ? 'Hassna El-Hmaidi' : 'Assistante Médicale'),
          full_name: parsed.full_name || parsed.name || (isHassna ? 'Hassna El-Hmaidi' : 'Assistante Médicale'),
          role: isHassna ? 'kine' : (parsed.role || 'assistante'),
          email: parsed.email || (isHassna ? 'hassna.elhmaidi@cabinet-kine.ma' : 'assistante@cabinet-kine.ma'),
          isOwner: isHassna,
          permissions: parsed.permissions || (isHassna ? ['all'] : ['reception']),
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
    const trimmed = pin.trim();

    if (trimmed === '239021' || roleKey === 'kine') {
      if (trimmed !== '239021') {
        return { success: false, error: 'Code PIN incorrect. Veuillez réessayer.' };
      }

      const hassnaUser = {
        id: 'hassna-kine',
        name: 'Hassna El-Hmaidi',
        full_name: 'Hassna El-Hmaidi',
        role: 'kine' as const,
        isOwner: true,
        permissions: ['all'],
        email: 'hassna.elhmaidi@cabinet-kine.ma',
      };

      setProfile(hassnaUser);

      try {
        localStorage.setItem('currentUser', JSON.stringify({
          id: 'hassna-kine',
          name: 'Hassna El-Hmaidi',
          role: 'kine',
          isOwner: true,
          permissions: ['all'],
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(hassnaUser));
      } catch (err) {
        console.warn('localStorage save error:', err);
      }

      return { success: true };
    }

    if (trimmed !== '000000') {
      return { success: false, error: 'Code PIN incorrect. Veuillez réessayer.' };
    }

    const assistantUser = {
      id: 'assistante-cabinet',
      name: 'Assistante Médicale',
      full_name: 'Assistante Médicale',
      role: 'assistante' as const,
      isOwner: false,
      permissions: ['reception'],
      email: 'assistante@cabinet-kine.ma',
    };

    setProfile(assistantUser);

    try {
      localStorage.setItem('currentUser', JSON.stringify({
        id: 'assistante-cabinet',
        name: 'Assistante Médicale',
        role: 'assistante',
        isOwner: false,
        permissions: ['reception'],
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assistantUser));
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
      localStorage.removeItem('currentUser');
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('localStorage clear error:', err);
    }
    setProfile(null);
    setUser(null);
    setSession(null);
  }, []);

  const isKine = Boolean(
    profile?.role === 'kine' ||
    profile?.isOwner === true ||
    (profile?.name && profile.name.includes('Hassna'))
  );
  const isOwner = Boolean(
    profile?.isOwner === true ||
    profile?.role === 'kine' ||
    (profile?.name && profile.name.includes('Hassna'))
  );
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
