'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Patient, NewPatientInput } from '@/types/patient';
import {
  getPatientsFromSupabase,
  addPatientToSupabase,
  updatePatientInSupabase,
  deletePatientFromSupabase,
} from '@/lib/supabase';
import { INITIAL_PATIENTS } from '@/lib/mockData';
import { ToastMessage, ToastType } from '@/components/Toast';

interface PatientContextType {
  patients: Patient[];
  loading: boolean;
  isRefreshing: boolean;
  toasts: ToastMessage[];
  supabaseError: string | null;
  addToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;
  refreshPatients: () => Promise<void>;
  createPatient: (data: NewPatientInput) => Promise<boolean>;
  modifyPatient: (id: string | number, updates: Partial<Patient>) => Promise<boolean>;
  removePatient: (id: string | number) => Promise<boolean>;
  incrementSeanceCount: (patient: Patient) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch patients from Supabase
  const refreshPatients = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await getPatientsFromSupabase();

      if (res.data && res.data.length > 0) {
        setPatients(res.data);
        setSupabaseError(null);
      } else if (res.data && res.data.length === 0) {
        // Table exists in Supabase, but is empty.
        // We check local storage or keep initial patients
        const local = localStorage.getItem('kine_local_patients');
        if (local) {
          try {
            setPatients(JSON.parse(local));
          } catch {
            setPatients(INITIAL_PATIENTS);
          }
        } else {
          setPatients(INITIAL_PATIENTS);
        }
        setSupabaseError(null);
      } else if (res.error) {
        setSupabaseError(res.error.message);
        // Fallback to local storage or initial patients
        const local = localStorage.getItem('kine_local_patients');
        if (local) {
          try {
            setPatients(JSON.parse(local));
          } catch {
            setPatients(INITIAL_PATIENTS);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      setSupabaseError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshPatients();
  }, [refreshPatients]);

  // Create new patient
  const createPatient = async (data: NewPatientInput): Promise<boolean> => {
    try {
      const res = await addPatientToSupabase(data);

      if (res.data) {
        // Direct Supabase success!
        const savedPatient = res.data;
        setPatients((prev) => [savedPatient, ...prev]);
        addToast('success', 'Patient enregistré avec succès', `${savedPatient.prenom} ${savedPatient.nom} a été ajouté à Supabase.`);
        return true;
      } else {
        // Supabase error (e.g. RLS policy or offline)
        // Store in local session so patient is not lost
        const fallbackPatient: Patient = {
          id: `pat-${Date.now()}`,
          ...data,
          nom: data.nom.toUpperCase().trim(),
          prenom: data.prenom.trim(),
          cin: data.cin.toUpperCase().trim(),
          telephone: data.telephone.trim(),
          created_at: new Date().toISOString(),
        };

        setPatients((prev) => {
          const updated = [fallbackPatient, ...prev];
          try {
            localStorage.setItem('kine_local_patients', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        if (res.error?.isRlsError) {
          addToast(
            'info',
            'Patient enregistré en mémoire locale',
            'Supabase a bloqué l\'écriture car la politique RLS doit être activée. Consultez le guide SQL.'
          );
        } else {
          addToast('success', 'Patient ajouté à la liste', `${fallbackPatient.prenom} ${fallbackPatient.nom} a été enregistré.`);
        }
        return true;
      }
    } catch {
      addToast('error', 'Erreur de connexion', 'Impossible de contacter le serveur.');
      return false;
    }
  };

  // Modify patient
  const modifyPatient = async (id: string | number, updates: Partial<Patient>): Promise<boolean> => {
    try {
      await updatePatientInSupabase(id, updates);
      setPatients((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
      );
      addToast('success', 'Dossier mis à jour', 'Les modifications ont été prises en compte.');
      return true;
    } catch {
      addToast('error', 'Erreur', 'Impossible de modifier le dossier.');
      return false;
    }
  };

  // Delete patient
  const removePatient = async (id: string | number): Promise<boolean> => {
    try {
      await deletePatientFromSupabase(id);
      setPatients((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        try {
          localStorage.setItem('kine_local_patients', JSON.stringify(updated));
        } catch {}
        return updated;
      });
      addToast('info', 'Patient supprimé', 'Le dossier a été retiré de la liste.');
      return true;
    } catch {
      addToast('error', 'Erreur', 'Impossible de supprimer le patient.');
      return false;
    }
  };

  // Increment session count
  const incrementSeanceCount = async (patient: Patient) => {
    const current = patient.nombre_seances_effectuees || 0;
    const total = patient.nombre_seances_prescrites || 10;
    const nextCount = current + 1;
    const isCompleted = nextCount >= total;

    await modifyPatient(patient.id, {
      nombre_seances_effectuees: nextCount,
      statut: isCompleted ? 'Terminé' : patient.statut || 'Actif',
    });

    addToast(
      'success',
      'Séance validée (+1)',
      `${patient.prenom} ${patient.nom} : ${nextCount}/${total} séances effectuées.`
    );
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        loading,
        isRefreshing,
        toasts,
        supabaseError,
        addToast,
        removeToast,
        refreshPatients,
        createPatient,
        modifyPatient,
        removePatient,
        incrementSeanceCount,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}
