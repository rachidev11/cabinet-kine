'use client';

import React from 'react';
import { Menu, Plus, Database, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenAddPatient: () => void;
  onOpenSqlModal: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  supabaseConnected?: boolean;
}

export default function Navbar({
  onToggleSidebar,
  onOpenAddPatient,
  onOpenSqlModal,
  onRefresh,
  isRefreshing = false,
  supabaseConnected = true,
}: NavbarProps) {
  // Format current date in French
  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  // Capitalize first letter of day
  const dateCapitalized = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

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

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Cabinet Nassim Kiné
            <span className="hidden sm:inline-block text-[11px] font-normal px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Rééducation & Kinésithérapie
            </span>
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">{dateCapitalized}</p>
        </div>
      </div>

      {/* Right: Status Pill & Quick Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Supabase Status Pill */}
        <button
          onClick={onOpenSqlModal}
          title="Cliquez pour voir la configuration Supabase"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden md:inline">Supabase :</span>
          <span className="font-semibold">Connecté</span>
        </button>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Rafraîchir les données"
            className="p-2 text-slate-500 hover:text-teal-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        )}

        {/* Primary Add Patient Button */}
        <button
          onClick={onOpenAddPatient}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Ajouter un</span> Patient
        </button>
      </div>
    </header>
  );
}
