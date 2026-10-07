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
import { useLanguage } from '@/context/LanguageContext';
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
  if (profile.role === 'kine') return 'Kinésithérapeute (Propriétaire)';
  if (profile.role === 'assistante') return 'Assistante Médicale';
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
  const { t } = useLanguage();

  // Build navigation dynamically based on active language and count
  const navigation = [
    {
      name: t('dashboard'),
      href: '/',
      icon: LayoutDashboard,
      badge: null as string | null,
    },
    {
      name: t('patients'),
      href: '/patients',
      icon: Users,
      badge: patientCount > 0 ? patientCount.toString() : null,
    },
    {
      name: t('agenda'),
      href: '/agenda',
      icon: Calendar,
      badge: null as string | null,
    },
    {
      name: t('facturation'),
      href: '/facturation',
      icon: CreditCard,
      badge: null as string | null,
    },
  ];

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

      {/* Sidebar Container with full LTR/RTL support */}
      <aside
        className={`fixed top-0 bottom-0 left-0 rtl:left-auto rtl:right-0 z-50 w-72 bg-white border-r rtl:border-r-0 rtl:border-l border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
        }`}
      >
        {/* Clinic Brand Header */}
        <div className="h-20 px-4 border-b border-blue-900/20 flex items-center justify-between bg-gradient-to-r from-[#0B57D0] via-[#0D47A1] to-[#0A387E] text-white shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center border border-white/40 shadow-md flex-shrink-0">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs tracking-tight text-white block leading-tight truncate">
                {t('clinicName')}
              </span>
              <span className="text-[10px] text-[#FF7A45] font-bold block uppercase tracking-wide truncate">
                {t('clinicSub')}
              </span>
              <p className="text-[11px] text-blue-100 font-semibold truncate leading-tight">
                {t('kineName')}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Add Patient Button */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <button
            onClick={() => {
              onClose();
              onOpenAddPatient();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0B57D0] to-[#0D47A1] hover:brightness-110 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-600/25 transition-all hover:shadow-md cursor-pointer active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 text-[#F05A28]" />
            <span>{t('quickAddPatient')}</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t('mainNav')}
          </div>

          {navigation.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-[#0B57D0] font-bold shadow-2xs border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#0B57D0]'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-[#0B57D0] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 group-hover:text-slate-700 group-hover:bg-slate-200/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-orange-100 text-[#F05A28]'
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
                {t('clinicalSpace')}
              </div>
              {NAV_KINE_ONLY.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.name}
                    className="group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-blue-50/50 border border-blue-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-[#0B57D0]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[#0D47A1] font-semibold">{t('medicalRecord')}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F05A28]/15 text-[#F05A28] font-bold">Kiné</span>
                  </div>
                );
              })}
            </>
          )}

          {isKine && (
            <>
              <div className="pt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {t('supabaseDb')}
              </div>

              <div className="space-y-1 text-sm text-slate-500">
                <button
                  onClick={() => {
                    onClose();
                    onOpenSqlModal();
                  }}
                  className="w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-all text-left rtl:text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-700 group-hover:bg-emerald-50">
                      <Database className="w-4 h-4" />
                    </div>
                    <span>{t('supabaseDb')} & SQL</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
                </button>
              </div>
            </>
          )}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex-shrink-0 space-y-2">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0B57D0] to-[#0D47A1] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                {profile ? getInitials(profile.full_name) : <UserCircle2 className="w-5 h-5" />}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            {/* Name & Role */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {profile?.full_name ?? 'Utilisateur'}
              </p>
              <p className="text-[11px] text-[#0B57D0] font-semibold truncate flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-[#0B57D0] flex-shrink-0" />
                {profile?.role === 'kine' ? `${t('kineName')} — ${t('kineRole')}` : t('assistantRole')}
              </p>
            </div>
          </div>

          {/* Bouton visible Déconnexion / Changer de profil */}
          <button
            onClick={handleSignOut}
            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
