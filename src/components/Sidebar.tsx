'use client';

import React from 'react';
import { Calendar, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClipboardList,
  Activity,
  Database,
  PhoneCall,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddPatient: () => void;
  onOpenSqlModal: () => void;
  patientCount?: number;
}

export default function Sidebar({
  isOpen,
  onClose,
  onOpenAddPatient,
  onOpenSqlModal,
  patientCount = 0,
}: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Tableau de bord',
      href: '/',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Gestion des Patients',
      href: '/patients',
      icon: Users,
      badge: patientCount > 0 ? patientCount.toString() : null,
    },
    {
      name: 'Planning & Agenda',
      href: '/agenda',
      icon: Calendar,
    },
    {
      name: 'Facturation & Règlements',
      href: '/facturation',
      icon: CreditCard,
    },
  ];

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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Clinic Brand Header */}
        <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight">KinéSanté</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 font-medium">PRO</span>
              </div>
              <p className="text-xs text-teal-100/90 font-medium">Cabinet de Kinésithérapie</p>
            </div>
          </div>
        </div>

        {/* Quick Add Patient Button */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
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
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive
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
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isActive
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

        {/* Clinic info & Practitioner profile */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                NK
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Nassim Kinésithérapie</p>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-teal-600" />
                Kinésithérapeute D.E.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
