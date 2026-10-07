'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import AddPatientModal from '@/components/AddPatientModal';
import SqlSetupModal from '@/components/SqlSetupModal';
import ToastContainer from '@/components/Toast';
import { usePatients } from '@/context/PatientContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { LayoutDashboard, Users, PlusCircle, Loader2 } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const {
    patients,
    toasts,
    removeToast,
    refreshPatients,
    isRefreshing,
    createPatient,
  } = usePatients();

  const { profile, loading: authLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !profile && pathname !== '/login') {
      router.replace('/login');
    }
  }, [mounted, authLoading, profile, pathname, router]);

  // Render /login page directly without application shell
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Client mounting skeleton / neutral container to prevent SSR-Client hydration mismatch
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#0B57D0] animate-spin" />
      </div>
    );
  }

  // Guard against flash of content before redirecting to /login
  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex print:bg-white print:block">
      {/* Sidebar for Desktop & Drawer for Mobile */}
      <div className="print:hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenAddPatient={() => setIsAddPatientOpen(true)}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
          patientCount={patients.length}
          profile={profile}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 rtl:lg:pl-0 rtl:lg:pr-72 print:pl-0 print:pr-0 print:block transition-all">
        {/* Top Navbar */}
        <div className="print:hidden">
          <Navbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onOpenAddPatient={() => setIsAddPatientOpen(true)}
            onOpenSqlModal={() => setIsSqlModalOpen(true)}
            onRefresh={refreshPatients}
            isRefreshing={isRefreshing}
            supabaseConnected={true}
            profile={profile}
          />
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12 print:p-0 print:m-0 print:max-w-none print:w-full">
          {children}
        </main>

        {/* Mobile Touch Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 flex items-center justify-around lg:hidden shadow-lg print:hidden">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold p-1.5 transition-colors ${
              pathname === '/' ? 'text-[#0B57D0]' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>{t('dashboard')}</span>
          </Link>

          {/* Quick Add Patient Floating Center Button */}
          <button
            onClick={() => setIsAddPatientOpen(true)}
            className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-[#0B57D0] to-[#0D47A1] text-white shadow-lg shadow-blue-600/30 cursor-pointer active:scale-90 transition-transform"
            aria-label={t('addPatient')}
          >
            <PlusCircle className="w-7 h-7" />
          </button>

          <Link
            href="/patients"
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold p-1.5 transition-colors relative ${
              pathname === '/patients' ? 'text-[#0B57D0]' : 'text-slate-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>{t('patients')}</span>
            {patients.length > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[#F05A28] text-white text-[9px] flex items-center justify-center font-bold">
                {patients.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Global Modals */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientAdded={async (newPatient) => {
          await createPatient(newPatient);
        }}
        onOpenSqlModal={() => {
          setIsAddPatientOpen(false);
          setIsSqlModalOpen(true);
        }}
      />

      <SqlSetupModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      {/* Global Toasts */}
      <div className="print:hidden">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    </div>
  );
}
