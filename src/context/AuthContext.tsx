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

export const DEFAULT_HASSNA_PROFILE: UserProfile = {
  id: 'hassna-kine',
  name: 'Hassna El-Hmaidi',
  full_name: 'Hassna El-Hmaidi',
  role: 'kine',
  email: 'hassna.elhmaidi@cabinet-kine.ma',
  isOwner: true,
  permissions: ['all'],
};

function getInitialProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawUser = localStorage.getItem('currentUser') || localStorage.getItem(STORAGE_KEY);
    if (!rawUser) return null;

    const parsed = JSON.parse(rawUser);
    if (!parsed || typeof parsed !== 'object') return null;

    const role: UserRole = parsed.role === 'assistante' ? 'assistante' : 'kine';
    const isOwner: boolean = role === 'kine' || Boolean(parsed.isOwner);
    const name: string = parsed.name || (role === 'kine' ? 'Hassna El-Hmaidi' : 'Assistante');

    return {
      id: role === 'kine' ? 'hassna-kine' : 'assistante-cabinet',
      name,
      full_name: name,
      role,
      email: role === 'kine' ? 'hassna.elhmaidi@cabinet-kine.ma' : 'assistante@cabinet-kine.ma',
      isOwner,
      permissions: role === 'kine' ? ['all'] : ['reception'],
    };
  } catch (err) {
    console.warn('Erreur lecture session locale:', err);
    return null;
  }
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

  // Restore session from localStorage on mount
  useEffect(() => {
    const current = getInitialProfile();
    setProfile(current);
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
        localStorage.setItem(
          'currentUser',
          JSON.stringify({
            role: 'kine',
            name: 'Hassna El-Hmaidi',
            isOwner: true,
          })
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(hassnaUser));
      } catch (err) {
        console.warn('localStorage save error:', err);
      }

      return { success: true };
    }

    if (trimmed !== '000000') {
      return { success: false, error: 'Code PIN incorrect pour l\'assistante (Code: 000000).' };
    }

    const assistantUser = {
      id: 'assistante-cabinet',
      name: 'Assistante',
      full_name: 'Assistante',
      role: 'assistante' as const,
      isOwner: false,
      permissions: ['reception'],
      email: 'assistante@cabinet-kine.ma',
    };

    setProfile(assistantUser);

    try {
      localStorage.setItem(
        'currentUser',
        JSON.stringify({
          role: 'assistante',
          name: 'Assistante',
          isOwner: false,
        })
      );
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

  // Role permissions
  const isKine = Boolean(
    profile && (profile.role === 'kine' || profile.isOwner === true || profile.name?.includes('Hassna'))
  );
  const isOwner = Boolean(
    profile && (profile.isOwner === true || profile.role === 'kine' || profile.name?.includes('Hassna'))
  );
  const isAssistante = Boolean(
    profile && profile.role === 'assistante' && !isKine
  );

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
