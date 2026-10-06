'use client';

import React from 'react';
import { PatientProvider } from '@/context/PatientContext';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PatientProvider>{children}</PatientProvider>
    </AuthProvider>
  );
}
