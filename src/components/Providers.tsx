'use client';

import React from 'react';
import { PatientProvider } from '@/context/PatientContext';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PatientProvider>{children}</PatientProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
