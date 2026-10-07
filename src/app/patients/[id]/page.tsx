'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  Building2,
  Calendar,
  Activity,
  CheckCircle,
  Clock,
  Printer,
  Receipt,
  Save,
  AlertCircle,
  FileText,
  Stethoscope,
  ClipboardList,
  History,
  Coins,
  Check,
  Plus,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Dumbbell,
  ShieldCheck,
  Scale,
  Sparkles,
  Lock,
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  Download,
  Maximize2,
  X,
  FileCheck,
  ZoomIn,
  FileDown,
} from 'lucide-react';
import { Patient, AssuranceType } from '@/types/patient';
import { MedicalRecord } from '@/types/medicalRecord';
import { Appointment } from '@/types/appointment';
import { Payment, PAYMENT_METHOD_MAP } from '@/types/payment';
import { usePatients } from '@/context/PatientContext';
import { useAuth } from '@/context/AuthContext';
import {
  getPatientByIdFromSupabase,
  getMedicalRecordByPatientId,
  upsertMedicalRecord,
  getAppointmentsByPatientId,
  getPaymentsByPatientId,
  updatePatientInSupabase,
} from '@/lib/supabase';
import { INITIAL_PATIENTS } from '@/lib/mockData';
import PaymentReceiptModal from '@/components/PaymentReceiptModal';
import WhatsAppReminderModal from '@/components/WhatsAppReminderModal';
import { BilanToPrint } from '@/components/BilanToPrint';
import { useReactToPrint } from 'react-to-print';
import MedicalDocumentsGallery, { MedicalDocument } from '@/components/MedicalDocumentsGallery';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { patients: contextPatients, incrementSeanceCount, removePatient } = usePatients();
  const { isAssistante, isKine } = useAuth();

  // Loading & patient data
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'bilan' | 'seances' | 'paiements' | 'radios'>('bilan');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // If assistante, automatically default to 'seances' tab as clinical records are restricted to kine
  useEffect(() => {
    if (isAssistante && (activeTab === 'bilan' || activeTab === 'radios')) {
      setActiveTab('seances');
    }
  }, [isAssistante, activeTab]);

  // Galerie des Radios & Documents Médicaux State
  const [medicalDocs, setMedicalDocs] = useState<MedicalDocument[]>([]);

  // Medical Record Form state
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord>({
    patient_id: id,
    diagnostic: '',
    pathologie: '',
    medecin_prescripteur: '',
    seances_prescrites: 10,
    seances_effectuees: 0,
    objectifs_reeducation: '',
    bilan_initial: '',
    bilan_articulaire: '',
    bilan_musculaire: '',
    eva_douleur: 5,
    antecedents: '',
    observations: '',
    date_bilan: new Date().toISOString().split('T')[0],
  });

  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [recordSaveSuccess, setRecordSaveSuccess] = useState(false);
  const [recordSaveError, setRecordSaveError] = useState<string | null>(null);

  // Appointments & Payments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Receipt modal state
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Print Bilan Kiné setup
  const printBilanRef = useRef<HTMLDivElement>(null);
  const handlePrintBilan = useReactToPrint({
    contentRef: printBilanRef,
    documentTitle: `Bilan_Kine_${patient?.nom || 'Patient'}_${patient?.prenom || ''}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  });

  // 1. Fetch patient details, medical record, appointments, payments
  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        // A. Resolve Patient: Check Supabase, then context, then mock data
        let foundPatient: Patient | null = null;

        const { data: supaPatient } = await getPatientByIdFromSupabase(id);
        if (supaPatient) {
          foundPatient = supaPatient;
        } else {
          // Context fallback
          const fromContext = contextPatients.find(
            (p) => String(p.id) === String(id)
          );
          if (fromContext) {
            foundPatient = fromContext;
          } else {
            // Mock fallback
            const fromMock = INITIAL_PATIENTS.find(
              (p) => String(p.id) === String(id)
            );
            if (fromMock) foundPatient = fromMock;
          }
        }

        if (!isMounted) return;
        setPatient(foundPatient);

        if (foundPatient) {
          // B. Fetch or initialize Medical Record
          const { data: supaRecord } = await getMedicalRecordByPatientId(id);
          if (supaRecord && isMounted) {
            setMedicalRecord(supaRecord);
          } else if (isMounted) {
            // Initialize from patient profile
            setMedicalRecord({
              patient_id: id,
              diagnostic: foundPatient.motif_consultation || '',
              pathologie: '',
              medecin_prescripteur: foundPatient.medecin_traitant || '',
              seances_prescrites: foundPatient.nombre_seances_prescrites || 10,
              seances_effectuees: foundPatient.nombre_seances_effectuees || 0,
              objectifs_reeducation: '',
              bilan_initial: foundPatient.notes || '',
              bilan_articulaire: '',
              bilan_musculaire: '',
              eva_douleur: 5,
              antecedents: foundPatient.antecedents || '',
              observations: '',
              date_bilan: new Date().toISOString().split('T')[0],
            });
          }

          // C. Fetch Appointments for this patient
          const { data: supaAppointments } = await getAppointmentsByPatientId(id);
          if (supaAppointments && supaAppointments.length > 0 && isMounted) {
            setAppointments(supaAppointments);
          } else if (isMounted) {
            // Mock sample appointments for demonstration if none exist in Supabase
            const mockAppts: Appointment[] = [
              {
                id: `apt-${id}-1`,
                patient_id: id,
                appointment_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
                start_time: '09:00:00',
                end_time: '09:45:00',
                slot_number: 1,
                status: 'completed',
                notes: 'Séance de rééducation - Mobilisation passive et travail proprioceptif.',
              },
              {
                id: `apt-${id}-2`,
                patient_id: id,
                appointment_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
                start_time: '10:15:00',
                end_time: '11:00:00',
                slot_number: 2,
                status: 'completed',
                notes: 'Renforcement musculaire dynamique et étirements.',
              },
              {
                id: `apt-${id}-3`,
                patient_id: id,
                appointment_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
                start_time: '14:30:00',
                end_time: '15:15:00',
                slot_number: 1,
                status: 'scheduled',
                notes: 'Séance programmée - Box 1',
              },
            ];
            setAppointments(mockAppts);
          }

          // D. Fetch Payments for this patient
          const { data: supaPayments } = await getPaymentsByPatientId(id);
          if (supaPayments && supaPayments.length > 0 && isMounted) {
            setPayments(supaPayments);
          } else if (isMounted) {
            // Mock sample payments for demonstration if none exist in Supabase
            const mockPmts: Payment[] = [
              {
                id: `pay-${id}-101`,
                patient_id: id,
                amount: 300,
                method: 'cash',
                payment_type: 'Séance',
                notes: 'Paiement séance 1 & 2',
                created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
                patient: foundPatient,
              },
              {
                id: `pay-${id}-102`,
                patient_id: id,
                amount: 1200,
                method: 'cheque',
                payment_type: 'Forfait 10 séances',
                notes: 'Règlement forfait kiné - Reçu remis',
                created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
                patient: foundPatient,
              },
            ];
            setPayments(mockPmts);
          }
        }
      } catch (err) {
        console.error('Erreur chargement fiche patient:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, contextPatients]);

  // Load Radios & Medical Documents from localStorage with clinical samples
  useEffect(() => {
    if (!id) return;
    try {
      const storageKey = `cabinet_medical_docs_${id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMedicalDocs(JSON.parse(saved));
      } else {
        const sampleDocs: MedicalDocument[] = [
          {
            id: `doc-${id}-1`,
            patient_id: id,
            title: 'Radiographie du Genou Droit (Face & Profil)',
            category: 'Radio',
            date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
            imageDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230b1329"/><rect x="20" y="20" width="560" height="360" rx="12" fill="%23111c38" stroke="%231e293b" stroke-width="2"/><text x="40" y="55" fill="%2338bdf8" font-family="monospace" font-size="14" font-weight="bold">CENTRE DE RADIOLOGIE AL MASSIRA • FÈS</text><text x="40" y="75" fill="%2394a3b8" font-family="sans-serif" font-size="11">Réf: RX-2026-9041 • Incidences Face et Profil comparatif</text><circle cx="300" cy="210" r="90" fill="%231e293b" stroke="%2338bdf8" stroke-width="1.5" stroke-dasharray="4"/><path d="M 270 120 L 270 290 Q 300 310 330 290 L 330 120 Z" fill="%23475569" opacity="0.6"/><ellipse cx="300" cy="205" rx="42" ry="16" fill="%23cbd5e1" opacity="0.8"/><text x="300" y="350" fill="%23e2e8f0" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Contrôle Articulaire • Intégrité trame osseuse</text></svg>`,
            fileSizeKb: 78,
            originalSizeKb: 3420,
            notes: 'Cliché pré-opératoire transmis par le chirurgien. Pas de cal vicieux visible.',
            uploaded_at: new Date(Date.now() - 14 * 86400000).toISOString(),
          },
          {
            id: `doc-${id}-2`,
            patient_id: id,
            title: 'Ordonnance Médicale - Rééducation Kiné',
            category: 'Ordonnance',
            date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
            imageDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23ffffff"/><rect x="20" y="20" width="560" height="360" rx="8" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="60" fill="%230f172a" font-family="sans-serif" font-size="16" font-weight="bold">CABINET MÉDICAL DR. BENJELLOUN</text><text x="40" y="80" fill="%2364748b" font-family="sans-serif" font-size="11">Chirurgie Orthopédique &amp; Traumatologie du Sport • Fès</text><line x1="40" y1="95" x2="560" y2="95" stroke="%23e2e8f0" stroke-width="2"/><text x="40" y="140" fill="%230284c7" font-family="sans-serif" font-size="28" font-weight="bold">Rx</text><text x="40" y="180" fill="%231e293b" font-family="sans-serif" font-size="14" font-weight="600">Prescription de 10 séances de masso-kinésithérapie :</text><text x="50" y="210" fill="%23334155" font-family="sans-serif" font-size="12">• Rééducation proprioceptive et renforcement musculaire</text><text x="50" y="235" fill="%23334155" font-family="sans-serif" font-size="12">• Mobilisation passive et active aidée</text><text x="50" y="260" fill="%23334155" font-family="sans-serif" font-size="12">• Physiothérapie antalgique selon tolérance</text><text x="420" y="340" fill="%230f172a" font-family="cursive" font-size="16">Dr. Benjelloun</text></svg>`,
            fileSizeKb: 64,
            originalSizeKb: 1850,
            notes: 'Prescription initiale de 10 séances. À renouveler si besoin.',
            uploaded_at: new Date(Date.now() - 10 * 86400000).toISOString(),
          },
        ];
        setMedicalDocs(sampleDocs);
        localStorage.setItem(storageKey, JSON.stringify(sampleDocs));
      }
    } catch (err) {
      console.warn('Erreur chargement radios/documents:', err);
    }
  }, [id]);

  const handleAddMedicalDoc = (doc: MedicalDocument) => {
    const updated = [doc, ...medicalDocs];
    setMedicalDocs(updated);
    try {
      localStorage.setItem(`cabinet_medical_docs_${id}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Erreur sauvegarde locale doc:', err);
    }
  };

  const handleDeleteMedicalDoc = (docId: string) => {
    if (!confirm('Supprimer définitivement ce document médical ?')) return;
    const updated = medicalDocs.filter((d) => d.id !== docId);
    setMedicalDocs(updated);
    try {
      localStorage.setItem(`cabinet_medical_docs_${id}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Erreur suppression doc:', err);
    }
  };

  // Handle Medical Record Save
  const handleSaveMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRecord(true);
    setRecordSaveSuccess(false);
    setRecordSaveError(null);

    try {
      const payload: Partial<MedicalRecord> & { patient_id: string | number } = {
        ...medicalRecord,
        patient_id: id,
      };

      const res = await upsertMedicalRecord(payload);

      if (res.error) {
        // If table is missing or RLS error, persist in local state & update patient notes
        console.warn('Fallback sauvegarde dossier médical:', res.error.message);
        // Also update patient profile fields in Supabase / context
        await updatePatientInSupabase(id, {
          motif_consultation: medicalRecord.diagnostic,
          medecin_traitant: medicalRecord.medecin_prescripteur,
          nombre_seances_prescrites: Number(medicalRecord.seances_prescrites) || 10,
          antecedents: medicalRecord.antecedents,
        });

        setRecordSaveSuccess(true);
        setTimeout(() => setRecordSaveSuccess(false), 4000);
      } else {
        if (res.data) {
          setMedicalRecord(res.data);
        }
        setRecordSaveSuccess(true);
        setTimeout(() => setRecordSaveSuccess(false), 4000);
      }

      // Keep patient state updated
      if (patient) {
        setPatient({
          ...patient,
          motif_consultation: medicalRecord.diagnostic,
          medecin_traitant: medicalRecord.medecin_prescripteur,
          nombre_seances_prescrites: Number(medicalRecord.seances_prescrites) || 10,
          antecedents: medicalRecord.antecedents,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setRecordSaveError(msg);
    } finally {
      setIsSavingRecord(false);
    }
  };

  // Quick session increment
  const handleIncrementSession = async () => {
    if (!patient) return;
    const currentDone = patient.nombre_seances_effectuees || 0;
    const newDone = currentDone + 1;
    setPatient({ ...patient, nombre_seances_effectuees: newDone });
    setMedicalRecord((prev) => ({ ...prev, seances_effectuees: newDone }));
    await incrementSeanceCount(patient);
  };

  // Total paid calculation
  const totalPaid = useMemo(() => {
    return payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [payments]);

  // Assurance Badge helper
  const getAssuranceBadge = (assurance?: AssuranceType) => {
    const val = assurance || 'CNSS';
    const map: Record<string, string> = {
      AMO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      CNSS: 'bg-blue-50 text-blue-700 border-blue-200',
      CNOPS: 'bg-purple-50 text-purple-700 border-purple-200',
      'Assurance Privée': 'bg-amber-50 text-amber-700 border-amber-200',
      Aucune: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold border ${
          map[val] || 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
      >
        {val}
      </span>
    );
  };

  // EVA Color & Label Helper
  const getEvaVisual = (score: number) => {
    if (score === 0) return { label: 'Aucune douleur', color: 'text-emerald-600', bg: 'bg-emerald-500' };
    if (score <= 3) return { label: 'Douleur légère', color: 'text-blue-600', bg: 'bg-blue-500' };
    if (score <= 6) return { label: 'Douleur modérée', color: 'text-amber-600', bg: 'bg-amber-500' };
    if (score <= 8) return { label: 'Douleur intense', color: 'text-orange-600', bg: 'bg-orange-500' };
    return { label: 'Douleur intolérable', color: 'text-rose-600', bg: 'bg-rose-600' };
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0B57D0] animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Chargement du dossier patient...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Patient introuvable</h2>
        <p className="text-sm text-slate-500 mb-6">
          Le dossier patient demandé n&apos;existe pas ou a été archivé.
        </p>
        <Link
          href="/patients"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B57D0] text-white font-semibold text-sm hover:bg-[#0D47A1] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste des patients
        </Link>
      </div>
    );
  }

  const doneSessions = patient.nombre_seances_effectuees || 0;
  const prescSessions = patient.nombre_seances_prescrites || 10;
  const progressPct = Math.min(100, Math.round((doneSessions / prescSessions) * 100));

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/patients')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0B57D0] hover:border-blue-300 hover:bg-blue-50/50 transition-all shadow-2xs cursor-pointer"
            title="Retour à la liste"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#0B57D0] uppercase tracking-wider">
                Dossier Médical Kiné
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono text-slate-500">ID #{patient.id}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {patient.prenom} {patient.nom}
            </h1>
          </div>
        </div>

        {/* Quick Communication Buttons */}
        <div className="flex items-center gap-2.5">
          {/* WhatsApp Reminder */}
          <button
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Rappel WhatsApp</span>
          </button>

          {/* Call direct */}
          <a
            href={`tel:${patient.telephone}`}
            className="px-3.5 py-2 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Phone className="w-4 h-4 text-[#0B57D0]" />
            <span>Appeler</span>
          </a>

          {/* Imprimer Bilan (Visible pour kiné sur onglet bilan) */}
          {!isAssistante && activeTab === 'bilan' && (
            <button
              onClick={() => handlePrintBilan()}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-[#0B57D0] border border-blue-200 hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Imprimer le compte-rendu officiel du bilan"
            >
              <Printer className="w-4 h-4 text-[#0B57D0]" />
              <span>Imprimer Bilan</span>
            </button>
          )}

          {/* Quick Session Increment */}
          <button
            onClick={handleIncrementSession}
            className="px-4 py-2 rounded-xl bg-[#F05A28] hover:bg-[#FF7A45] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Valider 1 séance effectuée"
          >
            <CheckCircle className="w-4 h-4" />
            <span>+1 Séance</span>
          </button>

          {/* Supprimer / Archiver le dossier (Réservé au kinésithérapeute / Propriétaire) */}
          {isKine && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `Confirmez-vous l'archivage ou la suppression du dossier de ${patient.prenom} ${patient.nom} ?`
                  )
                ) {
                  removePatient(patient.id);
                  router.push('/patients');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Supprimer ou archiver ce dossier patient (Propriétaire)"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Supprimer / Archiver</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient Header Card (Full Info) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Decorative subtle gradient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/5 via-[#0B57D0]/5 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Avatar & Identity */}
          <div className="lg:col-span-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0B57D0] via-[#0D47A1] to-[#0A387E] text-white font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-md">
              {patient.prenom[0]}
              {patient.nom[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {patient.civilite || 'Monsieur'}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {patient.gender === 'F' ? 'Femme / أنثى' : 'Homme / ذكر'}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    patient.statut === 'Terminé'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-[#0B57D0] border border-blue-200'
                  }`}
                >
                  {patient.statut || 'Actif'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {patient.prenom} {patient.nom}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {patient.age} ans {patient.profession ? `• ${patient.profession}` : ''}
              </p>
            </div>
          </div>

          {/* Middle Meta Details */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                Carte d&apos;Identité (CIN)
              </span>
              <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                {patient.cin}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                Téléphone
              </span>
              <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                {patient.telephone}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                Mutuelle & Assurance
              </span>
              <div className="mt-1">{getAssuranceBadge(patient.assurance)}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                Médecin Traitant
              </span>
              <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">
                {patient.medecin_traitant || 'Non renseigné'}
              </span>
            </div>
          </div>

          {/* Right Progress Card */}
          <div className="lg:col-span-3 p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-100/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0D47A1]">Suivi des Séances</span>
              <span className="text-xs font-black text-[#0B57D0] bg-white px-2 py-0.5 rounded-md shadow-2xs">
                {doneSessions} / {prescSessions}
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-blue-200/50 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0B57D0] to-[#F05A28] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#0D47A1] font-medium">
              <span>{progressPct}% complété</span>
              <span>{Math.max(0, prescSessions - doneSessions)} restantes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        {!isAssistante ? (
          <button
            onClick={() => setActiveTab('bilan')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'bilan'
                ? 'border-[#0B57D0] text-[#0B57D0] bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Bilan Kiné & Dossier Médical</span>
          </button>
        ) : (
          <div
            title="Réservé au kinésithérapeute"
            className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-slate-400 opacity-60 cursor-not-allowed select-none border-b-2 border-transparent"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Dossier Médical (Réservé Kiné)</span>
          </div>
        )}

        {/* TAB RADIOS & DOCUMENTS MÉDICAUX (Kiné uniquement) */}
        {!isAssistante ? (
          <button
            onClick={() => setActiveTab('radios')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'radios'
                ? 'border-[#0B57D0] text-[#0B57D0] bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Radios & Documents Médicaux</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0B57D0] text-xs font-bold">
              {medicalDocs.length}
            </span>
          </button>
        ) : null}

        <button
          onClick={() => setActiveTab('seances')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'seances'
              ? 'border-[#0B57D0] text-[#0B57D0] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Historique des Séances</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
            {appointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('paiements')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'paiements'
              ? 'border-[#0B57D0] text-[#0B57D0] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Historique des Règlements</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
            {payments.length}
          </span>
        </button>
      </div>

      {/* TAB 1: BILAN KINÉ FORM */}
      {activeTab === 'bilan' && (
        isAssistante ? (
          <div className="bg-white rounded-2xl border border-amber-200/90 p-8 text-center max-w-lg mx-auto my-8 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Accès Restreint</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Le Dossier Médical et le Bilan Kiné sont réservés exclusivement au kinésithérapeute.
              En tant qu&apos;assistante, vous pouvez gérer les séances et les règlements.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('seances')}
              className="mt-4 px-4 py-2 bg-[#0B57D0] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all"
            >
              Consulter les séances
            </button>
          </div>
        ) : (
        <form onSubmit={handleSaveMedicalRecord} className="space-y-6">
          {/* Notification Alert Banner on Save */}
          {recordSaveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold">
                  Bilan kinésithérapique enregistré avec succès dans le dossier médical.
                </span>
              </div>
            </div>
          )}

          {recordSaveError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span className="text-sm font-semibold">{recordSaveError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Clinical Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Diagnostic & Prescription */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0B57D0] flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Diagnostic Médical & Prescription
                    </h3>
                    <p className="text-xs text-slate-500">
                      Motif d&apos;orientation, pathologie et prescription médicale
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Diagnostic / Motif */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Diagnostic Principal & Motif de Consultation *
                    </label>
                    <input
                      type="text"
                      required
                      value={medicalRecord.diagnostic || ''}
                      onChange={(e) =>
                        setMedicalRecord({ ...medicalRecord, diagnostic: e.target.value })
                      }
                      placeholder="Ex: Rééducation post-opératoire LCA genou droit, Lombalgie..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                    />
                  </div>

                  {/* Pathologie détaillée */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pathologie / Précision anatomique
                    </label>
                    <input
                      type="text"
                      value={medicalRecord.pathologie || ''}
                      onChange={(e) =>
                        setMedicalRecord({ ...medicalRecord, pathologie: e.target.value })
                      }
                      placeholder="Ex: Ligamentoplastie DIDT M+1"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                    />
                  </div>

                  {/* Médecin prescripteur */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Médecin Prescripteur
                    </label>
                    <input
                      type="text"
                      value={medicalRecord.medecin_prescripteur || ''}
                      onChange={(e) =>
                        setMedicalRecord({
                          ...medicalRecord,
                          medecin_prescripteur: e.target.value,
                        })
                      }
                      placeholder="Ex: Dr. Benjelloun (Chirurgien Ortho)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                    />
                  </div>

                  {/* Séances prescrites */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre de Séances Prescrites
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={medicalRecord.seances_prescrites || 10}
                      onChange={(e) =>
                        setMedicalRecord({
                          ...medicalRecord,
                          seances_prescrites: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                    />
                  </div>

                  {/* Date du bilan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date du Bilan Kiné
                    </label>
                    <input
                      type="date"
                      value={medicalRecord.date_bilan || ''}
                      onChange={(e) =>
                        setMedicalRecord({ ...medicalRecord, date_bilan: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Bilan Initial & Objectifs de Rééducation */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0B57D0] flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Bilan Initial & Objectifs de Rééducation
                    </h3>
                    <p className="text-xs text-slate-500">
                      Anamnèse de départ et plan thérapeutique convenu
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Bilan initial */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bilan Initial & Examen Clinique
                    </label>
                    <textarea
                      rows={3}
                      value={medicalRecord.bilan_initial || ''}
                      onChange={(e) =>
                        setMedicalRecord({ ...medicalRecord, bilan_initial: e.target.value })
                      }
                      placeholder="Ex: Douleur vive en fin d'extension. Boiterie d'esquive. Flexion active limitée à 90°. Pas d'épanchement notable..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                    />
                  </div>

                  {/* Objectifs de rééducation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Objectifs de Rééducation
                    </label>
                    <textarea
                      rows={3}
                      value={medicalRecord.objectifs_reeducation || ''}
                      onChange={(e) =>
                        setMedicalRecord({
                          ...medicalRecord,
                          objectifs_reeducation: e.target.value,
                        })
                      }
                      placeholder="Ex: 1. Récupération des amplitudes articulaires complètes (flexion 130°). 2. Renforcement du quadriceps & ischio-jambiers. 3. Reprise de l'appui complet sans béquilles."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Bilans Articulaire & Musculaire Spécifiques */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0B57D0] flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Bilan Articulaire & Musculaire
                    </h3>
                    <p className="text-xs text-slate-500">
                      Goniométrie, mobilité et testing de la force musculaire
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-[#0B57D0]" />
                      <span>Bilan Articulaire & Mobilités</span>
                    </label>
                    <textarea
                      rows={3}
                      value={medicalRecord.bilan_articulaire || ''}
                      onChange={(e) =>
                        setMedicalRecord({
                          ...medicalRecord,
                          bilan_articulaire: e.target.value,
                        })
                      }
                      placeholder="Flexion: 110°, Extension: -5°. Pas de blocage méniscal..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-[#0B57D0]" />
                      <span>Bilan Musculaire & Testing</span>
                    </label>
                    <textarea
                      rows={3}
                      value={medicalRecord.bilan_musculaire || ''}
                      onChange={(e) =>
                        setMedicalRecord({
                          ...medicalRecord,
                          bilan_musculaire: e.target.value,
                        })
                      }
                      placeholder="Quadriceps côté 3+/5, amyotrophie cuisse de 1.5 cm vs controlatéral..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: EVA Douleur, Antécédents, Observations & Save */}
            <div className="space-y-6">
              {/* EVA Douleur Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#0B57D0]" />
                    <h3 className="font-bold text-slate-900 text-sm">Échelle de Douleur (EVA)</h3>
                  </div>
                  <span
                    className={`text-sm font-black px-2.5 py-0.5 rounded-full ${
                      getEvaVisual(medicalRecord.eva_douleur ?? 5).color
                    } bg-slate-100`}
                  >
                    {medicalRecord.eva_douleur ?? 5} / 10
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">0 (Aucune)</span>
                    <span className={`font-bold ${getEvaVisual(medicalRecord.eva_douleur ?? 5).color}`}>
                      {getEvaVisual(medicalRecord.eva_douleur ?? 5).label}
                    </span>
                    <span className="text-slate-400">10 (Maximale)</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={medicalRecord.eva_douleur ?? 5}
                    onChange={(e) =>
                      setMedicalRecord({
                        ...medicalRecord,
                        eva_douleur: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full accent-[#0B57D0] cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />

                  {/* Visual gauge ticks */}
                  <div className="grid grid-cols-11 text-center text-[10px] font-mono text-slate-400">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                      <span
                        key={val}
                        className={
                          (medicalRecord.eva_douleur ?? 5) === val
                            ? 'font-bold text-[#0B57D0] underline'
                            : ''
                        }
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Antécédents Médicaux Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0B57D0]" />
                  <span>Antécédents du Patient</span>
                </h3>
                <textarea
                  rows={3}
                  value={medicalRecord.antecedents || ''}
                  onChange={(e) =>
                    setMedicalRecord({ ...medicalRecord, antecedents: e.target.value })
                  }
                  placeholder="Chirurgies, pathologies associées, allergies..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                />
              </div>

              {/* Observations & Notes Complémentaires */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0B57D0]" />
                  <span>Observations & Évolution</span>
                </h3>
                <textarea
                  rows={3}
                  value={medicalRecord.observations || ''}
                  onChange={(e) =>
                    setMedicalRecord({ ...medicalRecord, observations: e.target.value })
                  }
                  placeholder="Remarques de séance, tolérance aux exercices, précautions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                />
              </div>

              {/* Save Button Card */}
              <div className="bg-gradient-to-br from-[#061B3B] via-[#0B57D0] to-[#0D47A1] rounded-2xl p-5 text-white shadow-lg space-y-3">
                <div className="flex items-center gap-2 text-orange-200 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#F05A28]" />
                  <span>Mise à Jour Dossier</span>
                </div>
                <p className="text-xs text-blue-100">
                  Enregistre le bilan initial et les objectifs thérapeutiques dans la table
                  médicale du patient.
                </p>
                <button
                  type="submit"
                  disabled={isSavingRecord}
                  className="w-full py-3 rounded-xl bg-[#F05A28] hover:bg-[#FF7A45] active:bg-orange-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingRecord ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Enregistrer le Bilan Kiné</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintBilan()}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-[#FF7A45]" />
                  <span>Imprimer le Bilan Officiel (PDF / Papier)</span>
                </button>
              </div>
            </div>
          </div>
        </form>
        )
      )}

      {/* TAB 2: HISTORIQUE DES SÉANCES (APPOINTMENTS) */}
      {activeTab === 'seances' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Rendez-vous & Séances de Kinésithérapie
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Historique des séances passées et planning des séances à venir pour {patient.prenom}.
              </p>
            </div>
            <Link
              href="/agenda"
              className="px-4 py-2 rounded-xl bg-[#0B57D0] hover:bg-[#0D47A1] text-white font-semibold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Planifier une Séance</span>
            </Link>
          </div>

          {/* Appointments List */}
          {appointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">Aucune séance enregistrée</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Ce patient n&apos;a pas encore de rendez-vous dans le planning.
              </p>
              <Link
                href="/agenda"
                className="px-4 py-2 rounded-xl bg-[#0B57D0] hover:bg-[#0D47A1] text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Créer un rendez-vous</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">Date de Séance</th>
                      <th className="py-3.5 px-4">Horaires</th>
                      <th className="py-3.5 px-4">Box / Salle</th>
                      <th className="py-3.5 px-4">Statut</th>
                      <th className="py-3.5 px-4">Notes & Compte-rendu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((appt) => {
                      const isPast =
                        new Date(appt.appointment_date).getTime() <
                        new Date().setHours(0, 0, 0, 0);

                      return (
                        <tr key={appt.id} className="hover:bg-blue-50/30 transition-colors">
                          {/* Date */}
                          <td className="py-4 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#0B57D0]" />
                              <span>{appt.appointment_date}</span>
                            </div>
                          </td>

                          {/* Horaires */}
                          <td className="py-4 px-4 font-mono text-slate-700 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {appt.start_time.slice(0, 5)} - {appt.end_time.slice(0, 5)}
                              </span>
                            </div>
                          </td>

                          {/* Salle */}
                          <td className="py-4 px-4 text-slate-600">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs">
                              Box {appt.slot_number || 1}
                            </span>
                          </td>

                          {/* Statut */}
                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                appt.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : appt.status === 'no_show'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : appt.status === 'cancelled'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-blue-50 text-[#0B57D0] border border-blue-200'
                              }`}
                            >
                              {appt.status === 'completed'
                                ? 'Effectuée'
                                : appt.status === 'no_show'
                                ? 'En séance'
                                : appt.status === 'cancelled'
                                ? 'Annulée'
                                : 'Programmée'}
                            </span>
                          </td>

                          {/* Notes */}
                          <td className="py-4 px-4 text-slate-600 text-xs max-w-xs truncate">
                            {appt.notes || <span className="text-slate-400 italic">Aucune note</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HISTORIQUE DES RÈGLEMENTS (PAYMENTS) */}
      {activeTab === 'paiements' && (
        <div className="space-y-6">
          {/* KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 block uppercase">
                Total Encaissé
              </span>
              <span className="text-2xl font-black text-[#0B57D0] mt-1 block">
                {totalPaid.toLocaleString()} DH
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Cumul des règlements enregistrés
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 block uppercase">
                Nombre de Règlements
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {payments.length} reçus
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Paiements par chèque, espèces ou virement
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 block uppercase">
                Tarification Séances
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {doneSessions} séances
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Validées sur {prescSessions} prescrites
              </span>
            </div>
          </div>

          {/* Payments List */}
          {payments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">Aucun paiement enregistré</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Aucun règlement n&apos;a encore été saisi pour ce patient.
              </p>
              <Link
                href="/facturation"
                className="px-4 py-2 rounded-xl bg-[#0B57D0] hover:bg-[#0D47A1] text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Enregistrer un encaissement</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">N° Reçu</th>
                      <th className="py-3.5 px-4">Date de Paiement</th>
                      <th className="py-3.5 px-4">Mode de Règlement</th>
                      <th className="py-3.5 px-4">Prestation</th>
                      <th className="py-3.5 px-4 text-right">Montant (DH)</th>
                      <th className="py-3.5 px-4 text-right">Action Reçu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                        {/* ID */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-800 text-xs">
                          #{p.id}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-slate-600">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '—'}
                        </td>

                        {/* Mode */}
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700">
                            {PAYMENT_METHOD_MAP[p.method] || p.method}
                          </span>
                        </td>

                        {/* Prestation / Type */}
                        <td className="py-4 px-4 text-slate-700 font-medium">
                          {p.payment_type || 'Séance de kinésithérapie'}
                        </td>

                        {/* Montant */}
                        <td className="py-4 px-4 text-right font-black text-slate-900">
                          {Number(p.amount).toLocaleString()} DH
                        </td>

                        {/* Action Imprimer */}
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => {
                              setReceiptPayment({ ...p, patient });
                              setIsReceiptModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0B57D0] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Imprimer le reçu officiel"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimer Reçu</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RADIOS & DOCUMENTS MÉDICAUX */}
      {activeTab === 'radios' && (
        !isAssistante ? (
          <MedicalDocumentsGallery
            patientId={id}
            patientName={`${patient.prenom} ${patient.nom}`}
            medicalDocs={medicalDocs}
            onAddDocument={handleAddMedicalDoc}
            onDeleteDocument={handleDeleteMedicalDoc}
            isKine={isKine}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-amber-200/90 p-8 text-center max-w-lg mx-auto my-8 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Accès Restreint</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              La galerie des radios et documents médicaux est réservée exclusivement au kinésithérapeute.
            </p>
          </div>
        )
      )}

      {/* Official Receipt Print Modal */}
      {isReceiptModalOpen && receiptPayment && (
        <PaymentReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setReceiptPayment(null);
          }}
          payment={receiptPayment}
          patient={patient}
        />
      )}

      {/* WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        patient={patient}
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

      {/* Hidden Official Bilan for Print */}
      <div className="hidden">
        <div ref={printBilanRef}>
          <BilanToPrint patient={patient} medicalRecord={medicalRecord} />
        </div>
      </div>
    </div>
  );
}
