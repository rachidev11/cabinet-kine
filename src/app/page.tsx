'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { usePatients } from '@/context/PatientContext';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Activity,
  CalendarCheck,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  RefreshCw,
  DoorOpen,
  Calendar,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';
import Link from 'next/link';
import PatientDetailsModal from '@/components/PatientDetailsModal';
import AddPatientModal from '@/components/AddPatientModal';
import { Patient } from '@/types/patient';

interface JoinedPatient {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  civilite?: string;
}

interface AppointmentWithPatient {
  id: string;
  patient_id: string;
  date: string;
  heure_debut: string;
  heure_fin?: string;
  box: number;
  type_seance: string;
  statut: string;
  notes?: string | null;
  patients?: JoinedPatient | null;
}

interface AssuranceStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
}

export default function DashboardPage() {
  const { createPatient, removePatient, incrementSeanceCount, refreshPatients } = usePatients();
  const { profile } = useAuth();

  // Selected patient for modal details
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Real-time Dashboard States from Supabase
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Metrics
  const [totalPatientsCount, setTotalPatientsCount] = useState<number>(0);
  const [todayAppointmentsCount, setTodayAppointmentsCount] = useState<number>(0);
  const [completedAppointmentsCount, setCompletedAppointmentsCount] = useState<number>(0);
  const [activePatientsCount, setActivePatientsCount] = useState<number>(0);

  // Appointments of today
  const [todayAppointments, setTodayAppointments] = useState<AppointmentWithPatient[]>([]);

  // 5 Recent Patients
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);

  // Assurance distribution stats
  const [assuranceStats, setAssuranceStats] = useState<AssuranceStat[]>([]);

  // Helper to get formatted today date YYYY-MM-DD
  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch real-time data from Supabase
  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    setErrorMsg(null);

    const todayDate = getTodayDateString();

    try {
      // 1. Fetch all patients (to compute total count, active count, and assurance distribution)
      // 2. Fetch recent 5 patients ordered by created_at DESC
      // 3. Fetch today's appointments ordered by heure_debut ASC
      // 4. Count appointments for today
      // 5. Count completed appointments ('Terminé')
      const [
        allPatientsRes,
        recentPatientsRes,
        todayAptsRes,
        todayCountRes,
        completedCountRes,
      ] = await Promise.all([
        supabase.from('patients').select('id, assurance, statut'),
        supabase
          .from('patients')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('appointments')
          .select('*, patients(id, nom, prenom, telephone, civilite)')
          .eq('date', todayDate)
          .order('heure_debut', { ascending: true }),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('date', todayDate),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'Terminé'),
      ]);

      // Check for errors
      if (allPatientsRes.error) {
        console.warn('Erreur patients:', allPatientsRes.error);
      }
      if (todayAptsRes.error) {
        console.warn('Erreur appointments:', todayAptsRes.error);
      }

      // --- Total Patients & Actifs ---
      const allPatients = allPatientsRes.data || [];
      const totalCount = allPatients.length;
      setTotalPatientsCount(totalCount);

      const activeCount = allPatients.filter(
        (p) => p.statut === 'Actif' || !p.statut
      ).length;
      setActivePatientsCount(activeCount);

      // --- Répartition des Assurances (CNSS, AMO, CNOPS, Privée, Aucune) ---
      const categories = [
        { name: 'CNSS', color: 'from-teal-500 to-teal-600', bgColor: 'bg-teal-500' },
        { name: 'AMO', color: 'from-cyan-500 to-cyan-600', bgColor: 'bg-cyan-500' },
        { name: 'CNOPS', color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-500' },
        { name: 'Privée', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-500' },
        { name: 'Aucune', color: 'from-slate-400 to-slate-500', bgColor: 'bg-slate-400' },
      ];

      const counts: Record<string, number> = {
        CNSS: 0,
        AMO: 0,
        CNOPS: 0,
        'Privée': 0,
        Aucune: 0,
      };

      allPatients.forEach((p) => {
        const rawAssurance = (p.assurance || '').trim();
        if (rawAssurance === 'CNSS') {
          counts.CNSS++;
        } else if (rawAssurance === 'AMO') {
          counts.AMO++;
        } else if (rawAssurance === 'CNOPS') {
          counts.CNOPS++;
        } else if (
          rawAssurance.toLowerCase().includes('priv') ||
          rawAssurance === 'Assurance Privée' ||
          rawAssurance === 'Privée'
        ) {
          counts['Privée']++;
        } else {
          counts.Aucune++;
        }
      });

      const calculatedAssuranceStats: AssuranceStat[] = categories.map((cat) => {
        const count = counts[cat.name] || 0;
        const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
        return {
          name: cat.name,
          count,
          percentage,
          color: cat.color,
          bgColor: cat.bgColor,
        };
      });
      setAssuranceStats(calculatedAssuranceStats);

      // --- 5 Derniers Patients Créés ---
      if (recentPatientsRes.data) {
        setRecentPatients(recentPatientsRes.data as Patient[]);
      }

      // --- Séances d'aujourd'hui (Liste & Compte) ---
      const aptList = (todayAptsRes.data as AppointmentWithPatient[]) || [];
      setTodayAppointments(aptList);
      setTodayAppointmentsCount(todayCountRes.count ?? aptList.length);

      // --- Séances Réalisées (Statut 'Terminé') ---
      setCompletedAppointmentsCount(completedCountRes.count ?? 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des données.';
      setErrorMsg(msg);
      console.error('fetchDashboardData error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle adding patient and refreshing data
  const handlePatientAdded = async (newPatientData: any) => {
    const success = await createPatient(newPatientData);
    if (success) {
      await fetchDashboardData(true);
    }
  };

  // Helper for status badge styling
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Terminé':
        return {
          label: 'Terminé',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dot: 'bg-emerald-500',
        };
      case 'En séance':
      case 'En cours':
        return {
          label: 'En séance',
          className: 'bg-amber-50 text-amber-700 border-amber-200/80',
          dot: 'bg-amber-500 animate-pulse',
        };
      case 'Annulé':
        return {
          label: 'Annulé',
          className: 'bg-rose-50 text-rose-700 border-rose-200/80',
          dot: 'bg-rose-500',
        };
      case 'Planifié':
      default:
        return {
          label: 'Planifié',
          className: 'bg-teal-50 text-teal-700 border-teal-200/80',
          dot: 'bg-teal-500',
        };
    }
  };

  // Helper for Room Badge
  const getBoxBadge = (boxNum: number) => {
    switch (boxNum) {
      case 1:
        return {
          name: 'Salle 1',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 2:
        return {
          name: 'Salle 2',
          className: 'bg-teal-50 text-teal-700 border-teal-200',
        };
      case 3:
      default:
        return {
          name: 'Salle 3',
          className: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 text-white p-6 sm:p-8 shadow-xl shadow-teal-900/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 -mb-10 w-48 h-48 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-teal-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cabinet de Kinésithérapie Hassna El-Hmaidi • Données en direct</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bonjour{profile ? ` ${profile.full_name.split(' ')[0]}` : ''}, bienvenue sur votre tableau de bord !
            </h1>
            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
              Consultez vos statistiques en temps réel, vos séances planifiées aujourd&apos;hui et vos derniers dossiers patients connectés à Supabase.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchDashboardData()}
              disabled={isRefreshing}
              className="px-3.5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-white text-teal-800 hover:bg-teal-50 font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span>Nouveau Patient</span>
            </button>

            <Link
              href="/agenda"
              className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm border border-white/20 transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Ouvrir l&apos;Agenda</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => fetchDashboardData()}
            className="text-xs font-bold text-rose-700 underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Patients */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Patients
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <div className="mt-3 space-y-2 animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-20" />
              <div className="h-3 bg-slate-100 rounded w-32" />
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{totalPatientsCount}</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  {activePatientsCount} actifs
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Dossiers enregistrés en base Supabase</p>
            </>
          )}
        </div>

        {/* Card 2: Séances d'aujourd'hui */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Séances d&apos;aujourd&apos;hui
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <div className="mt-3 space-y-2 animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-20" />
              <div className="h-3 bg-slate-100 rounded w-32" />
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {todayAppointmentsCount}
                </span>
                <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200/60">
                  Aujourd&apos;hui
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Sur les 3 Salles thérapeutiques</p>
            </>
          )}
        </div>

        {/* Card 3: Séances Réalisées */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Séances Réalisées
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <div className="mt-3 space-y-2 animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-20" />
              <div className="h-3 bg-slate-100 rounded w-32" />
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {completedAppointmentsCount}
                </span>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
                  Statut &apos;Terminé&apos;
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Séances validées au cabinet</p>
            </>
          )}
        </div>

        {/* Card 4: Patients en Traitement */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Dossiers Actifs
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <div className="mt-3 space-y-2 animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-20" />
              <div className="h-3 bg-slate-100 rounded w-32" />
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {activePatientsCount}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  En cours
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Patients en protocole de soins</p>
            </>
          )}
        </div>
      </div>

      {/* Main Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Patients Récents (5 derniers créés) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                Dossiers Patients Récents
              </h2>
              <p className="text-xs text-slate-500">
                Les 5 derniers patients créés (triés par date d&apos;inscription récente)
              </p>
            </div>

            <Link
              href="/patients"
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 group"
            >
              <span>Tous les patients ({totalPatientsCount})</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Loading or Table */}
          {loading ? (
            <div className="space-y-3 py-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl w-full" />
              ))}
            </div>
          ) : recentPatients.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm">Aucun patient enregistré pour le moment.</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition"
              >
                Créer un premier patient
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 sm:mx-0">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Patient</th>
                    <th className="py-3 px-4 font-semibold hidden sm:table-cell">CIN & Tél</th>
                    <th className="py-3 px-4 font-semibold hidden md:table-cell">Assurance</th>
                    <th className="py-3 px-4 font-semibold">Séances</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPatients.map((patient) => {
                    const done = patient.nombre_seances_effectuees || 0;
                    const total = patient.nombre_seances_prescrites || 10;
                    const pct = Math.min(100, Math.round((done / total) * 100));

                    return (
                      <tr
                        key={patient.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        {/* Name & Age */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {patient.prenom ? patient.prenom[0].toUpperCase() : 'P'}
                              {patient.nom ? patient.nom[0].toUpperCase() : ''}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                {patient.civilite && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                    {patient.civilite === 'Monsieur'
                                      ? 'M.'
                                      : patient.civilite === 'Madame'
                                      ? 'Mme'
                                      : 'Mlle'}
                                  </span>
                                )}
                                <p className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                                  {patient.prenom} {patient.nom}
                                </p>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {patient.age ? `${patient.age} ans • ` : ''}
                                {patient.motif_consultation || 'Kinésithérapie générale'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* CIN & Phone */}
                        <td className="py-3.5 px-4 hidden sm:table-cell">
                          <span className="font-mono text-xs font-semibold text-slate-700 block">
                            {patient.cin || '---'}
                          </span>
                          <span className="text-xs text-slate-500">{patient.telephone || '---'}</span>
                        </td>

                        {/* Assurance */}
                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                            {patient.assurance || 'Aucune'}
                          </span>
                        </td>

                        {/* Sessions progress */}
                        <td className="py-3.5 px-4 min-w-[120px]">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                            <span>
                              {done}/{total}
                            </span>
                            <span className="text-[10px] text-slate-400">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(patient);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 transition-colors cursor-pointer"
                          >
                            Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Séances du Jour & Répartition des Assurances */}
        <div className="space-y-6">
          {/* Planning: Séances du Jour */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Séances du Jour
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                  {todayAppointments.length} rdv
                </span>
                <Link
                  href="/agenda"
                  className="text-xs font-medium text-teal-600 hover:text-teal-800"
                  title="Voir l'agenda complet"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 py-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl w-full" />
                ))}
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                <CalendarCheck className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Aucune séance planifiée pour aujourd&apos;hui.</p>
                <Link
                  href="/agenda"
                  className="inline-block mt-1 text-xs font-bold text-teal-600 hover:underline"
                >
                  Ajouter un rendez-vous
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {todayAppointments.map((apt) => {
                  const statusInfo = getStatusBadge(apt.statut);
                  const boxInfo = getBoxBadge(apt.box);
                  const patientName = apt.patients
                    ? `${apt.patients.nom} ${apt.patients.prenom}`
                    : 'Patient non spécifié';
                  const civilite = apt.patients?.civilite
                    ? apt.patients.civilite === 'Monsieur'
                      ? 'M. '
                      : apt.patients.civilite === 'Madame'
                      ? 'Mme '
                      : 'Mlle '
                    : '';
                  const timeFormatted = apt.heure_debut ? apt.heure_debut.slice(0, 5) : '--:--';

                  return (
                    <div
                      key={apt.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 hover:border-slate-300 transition-all flex items-start gap-3"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${statusInfo.dot}`} />
                      <div className="flex-1 min-w-0">
                        {/* Header line: Name & Time */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {civilite}{patientName}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                            {timeFormatted}
                          </span>
                        </div>

                        {/* Session Type */}
                        <p className="text-xs text-slate-600 truncate mt-0.5">
                          {apt.type_seance || 'Kinésithérapie générale'}
                        </p>

                        {/* Badges: Room / Salle & Status */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${boxInfo.className}`}
                          >
                            <DoorOpen className="w-3 h-3" />
                            {boxInfo.name}
                          </span>

                          <span
                            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Répartition des Assurances */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Répartition des Assurances
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                {totalPatientsCount} {totalPatientsCount > 1 ? 'patients' : 'patient'}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 py-2 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-6 bg-slate-100 rounded w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {assuranceStats.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">{item.name}</span>
                      <span className="font-bold text-slate-900">
                        {item.count}{' '}
                        <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        isOpen={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        onIncrementSeance={async (p) => {
          await incrementSeanceCount(p);
          await fetchDashboardData(true);
        }}
        onDelete={async (id) => {
          await removePatient(id);
          setSelectedPatient(null);
          await fetchDashboardData(true);
        }}
      />

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPatientAdded={handlePatientAdded}
      />
    </div>
  );
}
