'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Search,
  Users,
  ChevronRight,
  ClipboardList,
  Sparkles,
  Activity,
  Calendar,
  FileText,
  Plus,
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  Phone,
  Image as ImageIcon,
  Lock,
} from 'lucide-react';
import { usePatients } from '@/context/PatientContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import AddPatientModal from '@/components/AddPatientModal';

export default function BilanKinePage() {
  const router = useRouter();
  const { isKine, isOwner, profile, isAssistante } = useAuth();

  const isHassnaOrKine = Boolean(
    !isAssistante &&
    (isKine ||
      isOwner ||
      profile?.role === 'kine' ||
      profile?.isOwner === true ||
      profile?.name?.includes('Hassna'))
  );

  useEffect(() => {
    if (profile && !isHassnaOrKine) {
      router.replace('/');
    }
  }, [isHassnaOrKine, profile, router]);

  const { patients, loading, createPatient } = usePatients();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  if (!isHassnaOrKine) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Accès Réservé au Praticien</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md">
          Cette section clinique est strictement réservée à Mme Hassna El-Hmaidi. Redirection vers le tableau de bord...
        </p>
      </div>
    );
  }

  // Filtered patients
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter((p) =>
      p.nom.toLowerCase().includes(q) ||
      p.prenom.toLowerCase().includes(q) ||
      p.cin.toLowerCase().includes(q) ||
      (p.motif_consultation && p.motif_consultation.toLowerCase().includes(q))
    );
  }, [patients, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#0B57D0] via-[#0D47A1] to-[#0A387E] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-white/5 rounded-full -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-sky-100">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A45]" />
              <span>Espace Clinique Kinésithérapie — Accès Total</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bilans Kinésithérapiques & Dossiers Médicaux
            </h1>
            <p className="text-sm text-blue-100 leading-relaxed">
              Consultez, rédigez et imprimez les bilans initiaux, bilans articulaires & musculaires,
              échelles EVA de douleur et comptes-rendus cliniques en 1 clic pour chaque patient.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setIsAddPatientOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white text-[#0B57D0] hover:bg-blue-50 font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#F05A28]" />
              <span>Nouveau Patient</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/15 text-white">
          <div>
            <span className="text-xs text-blue-200 font-medium block">Total Patients</span>
            <span className="text-2xl font-black">{patients.length}</span>
          </div>
          <div>
            <span className="text-xs text-blue-200 font-medium block">Bilans Accessibles</span>
            <span className="text-2xl font-black">{patients.length}</span>
          </div>
          <div>
            <span className="text-xs text-blue-200 font-medium block">Séances Totales</span>
            <span className="text-2xl font-black">
              {patients.reduce((acc, p) => acc + (p.nombre_seances_effectuees || 0), 0)}
            </span>
          </div>
          <div>
            <span className="text-xs text-blue-200 font-medium block">Accès Praticienne</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 inline-block mt-1">
              Hassna El-Hmaidi
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par patient, CIN, motif clinique..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/30 focus:border-[#0B57D0]"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold px-2">
          {filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''} répertorié{filteredPatients.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid of Patients with Direct 1-Click Bilan Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPatients.map((patient) => {
          const done = patient.nombre_seances_effectuees || 0;
          const total = patient.nombre_seances_prescrites || 10;
          const pct = Math.min(100, Math.round((done / total) * 100));

          return (
            <div
              key={patient.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0B57D0] to-[#0D47A1] text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                      {patient.prenom[0]}
                      {patient.nom[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-[#0B57D0] transition-colors">
                        {patient.prenom} {patient.nom}
                      </h3>
                      <p className="text-xs text-slate-500">
                        CIN : <span className="font-mono font-semibold text-slate-700">{patient.cin}</span> • {patient.age} ans
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#0B57D0] border border-blue-200">
                    {patient.assurance || 'Général'}
                  </span>
                </div>

                {/* Pathologie / Motif clinique */}
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs text-slate-700">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-0.5">
                    Motif Clinique & Diagnostic
                  </span>
                  <p className="font-semibold text-slate-800 line-clamp-2">
                    {patient.motif_consultation || 'Bilan kinésithérapique & rééducation'}
                  </p>
                </div>

                {/* Progression des séances */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Séances : {done} / {total}</span>
                    <span className="text-[#0B57D0] font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0B57D0] to-[#F05A28] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                {/* GROS BOUTON BLEU DIRECT : Accéder au Bilan Kiné de ce patient */}
                <Link
                  href={`/patients/${patient.id}?tab=bilan`}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0B57D0] via-[#0D47A1] to-[#0A387E] hover:brightness-110 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-600/25 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Stethoscope className="w-4 h-4 text-sky-200" />
                  <span>Accéder au Bilan Kiné de ce patient</span>
                  <ChevronRight className="w-4 h-4 text-sky-300 rtl:rotate-180" />
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/patients/${patient.id}?tab=radios`}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-sky-200"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Radios & Docs</span>
                  </Link>

                  <Link
                    href={`/patients/${patient.id}`}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span>Dossier Complet</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPatients.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0B57D0] flex items-center justify-center mx-auto">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Aucun patient trouvé</h3>
          <p className="text-xs text-slate-500">
            Aucun résultat ne correspond à votre recherche &quot;{searchQuery}&quot;.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Réinitialiser la recherche
          </button>
        </div>
      )}

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientAdded={async (newPatient) => {
          await createPatient(newPatient);
        }}
      />
    </div>
  );
}
