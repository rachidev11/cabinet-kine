'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Stethoscope,
  UserCheck,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth, UserRole, PROFILES_CONFIG } from '@/context/AuthContext';

export default function LoginPage() {
  const { profile, loginWithPin, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // If a profile is already active in localStorage, redirect directly to dashboard
  useEffect(() => {
    if (!loading && profile) {
      window.location.href = '/';
    }
  }, [profile, loading]);

  // Focus input when a role is selected
  useEffect(() => {
    if (selectedRole && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedRole]);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setPin('');
    setError(null);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setPin('');
    setError(null);
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedRole) return;

    if (pin.length !== 6) {
      setError('Veuillez entrer les 6 chiffres du code PIN.');
      return;
    }

    const res = loginWithPin(selectedRole, pin);
    if (!res.success) {
      setError(res.error || 'Code PIN incorrect.');
      setPin('');
      if (inputRef.current) inputRef.current.focus();
    } else {
      setError(null);
      setIsSuccess(true);
      // Immediate clean redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 250);
    }
  };

  const handlePinChange = (val: string) => {
    // Only numbers, max 6
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setPin(cleaned);
    setError(null);

    // Auto submit on 6th digit
    if (cleaned.length === 6 && selectedRole) {
      const res = loginWithPin(selectedRole, cleaned);
      if (!res.success) {
        setError(res.error || 'Code PIN incorrect.');
        setPin('');
        if (inputRef.current) inputRef.current.focus();
      } else {
        setError(null);
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 250);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-cyan-950 p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl mx-auto">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl shadow-black/40 p-6 sm:p-10 text-white transition-all">
          
          {/* Clinic Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/30 mb-4 border border-white/30">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Cabinet de Kinésithérapie
            </h1>
            <p className="text-teal-300 font-bold text-lg mt-1 tracking-wide">
              Hassna El-Hmaidi
            </p>
            <p className="text-slate-300/80 text-xs sm:text-sm mt-1.5 max-w-sm">
              Connexion sécurisée par Code PIN • Choisissez votre profil d&apos;accès
            </p>
          </div>

          {/* VIEW 1: Profile Selection */}
          {!selectedRole ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-xs font-semibold text-teal-200 uppercase tracking-wider text-center mb-2">
                Sélectionnez votre profil
              </div>

              {/* Profile Card 1: Hassna El-Hmaidi */}
              <button
                type="button"
                onClick={() => handleSelectRole('kine')}
                className="w-full group p-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-teal-400/60 transition-all duration-200 flex items-center gap-4 text-left shadow-lg hover:shadow-teal-500/20 active:scale-[0.99] cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white group-hover:text-teal-200 transition-colors">
                      Hassna El-Hmaidi
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-400/20 text-teal-200 border border-teal-300/30">
                      Kinésithérapeute (Propriétaire)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Accès complet (Super-Admin) : Bilan Kiné, dossiers médicaux, chiffre d&apos;affaires, statistiques et administration.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-teal-300/70 group-hover:text-teal-200 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </button>

              {/* Profile Card 2: Assistante */}
              <button
                type="button"
                onClick={() => handleSelectRole('assistante')}
                className="w-full group p-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400/60 transition-all duration-200 flex items-center gap-4 text-left shadow-lg hover:shadow-cyan-500/20 active:scale-[0.99] cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white group-hover:text-cyan-200 transition-colors">
                      Assistante Médicale
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-400/20 text-cyan-200 border border-cyan-300/30">
                      Secrétariat & Accueil
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Accès restreint : Agenda des 3 salles, fiches administratives, encaissement et impression des reçus du jour.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-cyan-300/70 group-hover:text-cyan-200 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </button>
            </div>
          ) : (
            /* VIEW 2: PIN Entry Form */
            <div className="animate-in fade-in zoom-in-95 duration-200">
              {/* Back to Profiles Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/15">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs font-semibold text-teal-200 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Changer de profil</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">
                    {PROFILES_CONFIG[selectedRole].full_name}
                  </span>
                </div>
              </div>

              {/* Profile Avatar Badge */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg border border-white/30 bg-gradient-to-tr from-teal-500 to-cyan-500 text-white">
                  {selectedRole === 'kine' ? (
                    <Stethoscope className="w-8 h-8" />
                  ) : (
                    <UserCheck className="w-8 h-8" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {PROFILES_CONFIG[selectedRole].full_name}
                </h2>
                <p className="text-xs text-teal-200 mt-0.5">
                  Veuillez saisir votre code PIN à 6 chiffres
                </p>
              </div>

              {/* PIN Form */}
              <form onSubmit={handlePinSubmit} className="space-y-5">
                {/* Hidden actual input for mobile & keyboard support */}
                <input
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  className="sr-only"
                  autoFocus
                />

                {/* 6 Digit Display Boxes */}
                <div
                  onClick={() => inputRef.current?.focus()}
                  className="flex justify-center items-center gap-2.5 sm:gap-3 py-2 cursor-pointer"
                >
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const digit = pin[idx];
                    const isCurrent = pin.length === idx;
                    return (
                      <div
                        key={idx}
                        className={`w-11 h-14 sm:w-12 sm:h-16 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all ${
                          digit
                            ? 'bg-teal-500/30 border-2 border-teal-400 text-white shadow-md shadow-teal-500/20'
                            : isCurrent
                            ? 'bg-white/15 border-2 border-white ring-4 ring-teal-400/30 text-white animate-pulse'
                            : 'bg-white/5 border border-white/20 text-slate-400'
                        }`}
                      >
                        {digit ? '•' : ''}
                      </div>
                    );
                  })}
                </div>

                {/* Numeric Virtual Keypad (for touch / mouse) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-xs mx-auto pt-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => {
                    if (k === 'C') {
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setPin('');
                            setError(null);
                            inputRef.current?.focus();
                          }}
                          className="h-12 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                        >
                          Effacer
                        </button>
                      );
                    }
                    if (k === '⌫') {
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setPin((prev) => prev.slice(0, -1));
                            setError(null);
                            inputRef.current?.focus();
                          }}
                          className="h-12 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-sm font-bold text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                        >
                          ⌫
                        </button>
                      );
                    }
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handlePinChange(pin + k)}
                        className="h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-lg font-bold text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-xs"
                      >
                        {k}
                      </button>
                    );
                  })}
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/25 border border-rose-500/50 text-rose-100 text-xs font-semibold animate-in fade-in duration-200 text-center justify-center">
                    <AlertCircle className="w-4 h-4 text-rose-300 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Banner */}
                {isSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/25 border border-emerald-500/50 text-emerald-100 text-xs font-semibold animate-in fade-in duration-200 text-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                    <span>Code validé ! Redirection vers le tableau de bord…</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs transition-all cursor-pointer"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={pin.length !== 6 || isSuccess}
                    className="flex-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-teal-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Valider le PIN</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Système interne sécurisé • Cabinet Hassna El-Hmaidi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
