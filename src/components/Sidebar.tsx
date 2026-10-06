'use client';

import React from 'react';
import { Calendar, CreditCard, LogOut, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Activity,
  Database,
  Sparkles,
  ChevronRight,
  Stethoscope,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddPatient: () => void;
  onOpenSqlModal: () => void;
  patientCount?: number;
  profile: UserProfile | null;
}

// ─── Role-based navigation configuration ────────────────────────────────────

/** Navigation items visible to ALL roles */
const NAV_COMMON = [
  {
    name: 'Tableau de bord',
    href: '/',
    icon: LayoutDashboard,
    badge: null as string | null,
  },
  {
    name: 'Gestion des Patients',
    href: '/patients',
    icon: Users,
    badge: null as string | null,
  },
  {
    name: 'Planning & Agenda',
    href: '/agenda',
    icon: Calendar,
    badge: null,
  },
  {
    name: 'Facturation & Règlements',
    href: '/facturation',
    icon: CreditCard,
    badge: null,
  },
];

/** Extra items reserved for the kinésithérapeute */
const NAV_KINE_ONLY = [
  {
    name: 'Dossier Médical & Bilan Kiné',
    href: '/patients', // accessed via patient detail within /patients
    icon: ClipboardList,
    badge: null,
  },
];

function getRoleLabel(profile: UserProfile | null): string {
  if (!profile) return '';
  if (profile.role === 'kine') return 'Kinésithérapeute';
  if (profile.role === 'assistante') return 'Assistante';
  return profile.role;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Sidebar({
  isOpen,
  onClose,
  onOpenAddPatient,
  onOpenSqlModal,
  patientCount = 0,
  profile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, isKine } = useAuth();

  // Build navigation based on role
  const navigation = NAV_COMMON.map((item) => ({
    ...item,
    badge: item.href === '/patients' && patientCount > 0 ? patientCount.toString() : null,
  }));

  // Kine gets Bilan Kiné section as its own entry shown (already accessible via patients)
  // We won't duplicate the patients link – instead we add an indicator in the section header

  const handleSignOut = () => {
    onClose();
    signOut();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Clinic Brand Header */}
        <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 text-white shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm leading-tight tracking-tight truncate">
                  Cabinet Kinésithérapie
                </span>
              </div>
              <p className="text-xs text-teal-100/90 font-medium truncate">Hassna El-Hmaidi</p>
            </div>
          </div>
        </div>

        {/* Quick Add Patient Button */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <button
            onClick={() => {
              onClose();
              onOpenAddPatient();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm shadow-teal-600/20 transition-all hover:shadow-md cursor-pointer active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 text-teal-200" />
            <span>Nouveau Patient</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation Principale
          </div>

          {navigation.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:text-slate-700 group-hover:bg-slate-200/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-teal-200 text-teal-900'
                        : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Kine-only section */}
          {isKine && (
            <>
              <div className="pt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Espace Clinique
              </div>
              {NAV_KINE_ONLY.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.name}
                    className="group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 bg-teal-50/50 border border-teal-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-teal-800 font-medium">Bilan Kiné (via Dossier)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-200/60 text-teal-700 font-semibold">Kiné</span>
                  </div>
                );
              })}
            </>
          )}

          <div className="pt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Outils & Séances
          </div>

          <div className="space-y-1 text-sm text-slate-500">
            <button
              onClick={() => {
                onClose();
                onOpenSqlModal();
              }}
              className="w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-700 group-hover:bg-emerald-50">
                  <Database className="w-4 h-4" />
                </div>
                <span>Connexion Supabase & SQL</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                {profile ? getInitials(profile.full_name) : <UserCircle2 className="w-5 h-5" />}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            {/* Name & Role */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {profile?.full_name ?? 'Utilisateur'}
              </p>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-teal-600 flex-shrink-0" />
                {getRoleLabel(profile)}
              </p>
            </div>

            {/* Bouton Changer d'utilisateur */}
            <button
              onClick={handleSignOut}
              title="Changer d'utilisateur / Se déconnecter"
              aria-label="Changer d'utilisateur"
              className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
