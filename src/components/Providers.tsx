'use client';

import React from 'react';
import { PatientProvider } from '@/context/PatientContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <PatientProvider>{children}</PatientProvider>;
}
