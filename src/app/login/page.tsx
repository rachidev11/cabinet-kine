'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { signIn, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setIsSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);

    if (signInError) {
      setError(signInError);
      setIsSubmitting(false);
    } else {
      // onAuthStateChange will update user → useEffect above will redirect
      router.replace('/');
    }
  };

  // Show nothing while we determine auth state on first load
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Glass card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-black/30 p-8 sm:p-10">
          {/* Logo & Clinic Name */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/40 mb-4">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white text-center tracking-tight leading-tight">
              Cabinet de Kinésithérapie
            </h1>
            <p className="text-teal-200 font-semibold text-center mt-1">
              Hassna El-Hmaidi
            </p>
            <p className="text-teal-300/70 text-sm text-center mt-1">
              Espace professionnel sécurisé
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email field */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-teal-100">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/70" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-teal-300/50 focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:border-teal-400/60 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-teal-100">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/70" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-teal-300/50 focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:border-teal-400/60 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-300/70 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-300" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:from-teal-600/50 disabled:to-cyan-600/50 text-white font-semibold text-sm shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connexion en cours…</span>
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-teal-400/60 mt-8">
            Accès réservé au personnel autorisé du cabinet
          </p>
        </div>

        {/* Branding footer */}
        <p className="text-center text-xs text-teal-500/50 mt-4">
          Cabinet de Kinésithérapie — Hassna El-Hmaidi © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
