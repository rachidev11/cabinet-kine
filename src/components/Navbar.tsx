'use client';

import React from 'react';
import { Menu, Plus, Database, RefreshCw, LogOut, UserCircle2, Stethoscope, UserCheck, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import type { UserProfile } from '@/context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenAddPatient: () => void;
  onOpenSqlModal: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  supabaseConnected?: boolean;
  profile: UserProfile | null;
}

function getRoleLabel(profile: UserProfile | null): string {
  if (!profile) return '';
  if (profile.role === 'kine') return 'Kinésithérapeute';
  if (profile.role === 'assistante') return 'Assistante';
  return profile.role;
}

export default function Navbar({
  onToggleSidebar,
  onOpenAddPatient,
  onOpenSqlModal,
  onRefresh,
  isRefreshing = false,
  supabaseConnected = true,
  profile,
}: NavbarProps) {
  const { signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  // Format current date with active locale
  const todayFormatted = new Intl.DateTimeFormat(language === 'ar' ? 'ar-MA' : 'fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  // Capitalize first letter of day
  const dateCapitalized = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  const handleSignOut = () => {
    signOut();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Left: Mobile hamburger & Clinic title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Ouvrir le menu"
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shadow-xs flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{t('clinicName')}</span>
              <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0B57D0] border border-blue-200">
                {t('kineName')}
              </span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">{dateCapitalized}</p>
          </div>
        </div>
      </div>

      {/* Right: Language Switcher, Status Pill, User info & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sélecteur de langue discret et rapide (FR / AR) */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200" dir="ltr">
          <button
            onClick={() => setLanguage('fr')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              language === 'fr'
                ? 'bg-white text-[#0B57D0] shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Passer en Français"
          >
            FR
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer font-arabic ${
              language === 'ar'
                ? 'bg-[#0B57D0] text-white shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="التحويل إلى العربية"
          >
            AR
          </button>
        </div>

        {/* Supabase Status Pill */}
        <button
          onClick={onOpenSqlModal}
          title="Cliquez pour voir la configuration Supabase"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden lg:inline">Supabase :</span>
          <span className="font-semibold">{t('connected')}</span>
        </button>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title={t('refresh')}
            className="p-2 text-slate-500 hover:text-[#0B57D0] rounded-xl hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0B57D0]' : ''}`} />
          </button>
        )}

        {/* Logged-in user display with exact role badges */}
        {profile && (
          <div className="hidden sm:flex items-center gap-2 px-2 border-x border-slate-200">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs flex-shrink-0 ${
              profile.role === 'kine'
                ? 'bg-gradient-to-tr from-[#0B57D0] to-[#0D47A1]'
                : 'bg-gradient-to-tr from-[#F05A28] to-[#FF7A45]'
            }`}>
              {profile.role === 'kine' ? <Stethoscope className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="hidden md:block">
              {profile.role === 'kine' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0B57D0] border border-blue-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#0B57D0] animate-pulse" />
                  {t('kineName')} — {t('kineRole')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#F05A28] border border-orange-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#F05A28] animate-pulse" />
                  {t('assistantRole')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Primary Add Patient Button */}
        <button
          onClick={onOpenAddPatient}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B57D0] hover:bg-[#0D47A1] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('addPatient')}</span>
        </button>

        {/* Bouton visible Changer de profil / Déconnexion */}
        <button
          onClick={handleSignOut}
          title={t('changeProfile')}
          aria-label={t('changeProfile')}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all cursor-pointer shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{t('changeProfile')}</span>
        </button>
      </div>
    </header>
  );
}
