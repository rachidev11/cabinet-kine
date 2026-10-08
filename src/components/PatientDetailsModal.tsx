'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  User,
  Phone,
  CreditCard,
  Calendar,
  Briefcase,
  MapPin,
  Stethoscope,
  Shield,
  Activity,
  MessageSquare,
  FileCheck,
  CheckCircle,
  Clock,
  Trash2,
  Lock,
} from 'lucide-react';
import { Patient } from '@/types/patient';
import { useAuth } from '@/context/AuthContext';
import WhatsAppReminderModal from '@/components/WhatsAppReminderModal';

interface PatientDetailsModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string | number) => void;
  onIncrementSeance?: (patient: Patient) => void;
}

export default function PatientDetailsModal({
  patient,
  isOpen,
  onClose,
  onDelete,
  onIncrementSeance,
}: PatientDetailsModalProps) {
  const { isKine } = useAuth();
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  if (!isOpen || !patient) return null;

  const total = patient.nombre_seances_prescrites || 10;
  const done = patient.nombre_seances_effectuees || 0;
  const percent = Math.min(100, Math.round((done / total) * 100));

  // Format telephone for WhatsApp (Moroccan 212)
  const cleanPhone = patient.telephone.replace(/\s+/g, '').replace(/^0/, '212');

  const getAssuranceColor = (assurance: string) => {
    switch (assurance) {
      case 'AMO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CNSS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CNOPS':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Assurance Privée':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header with Avatar and Basic Info */}
        <div className="bg-gradient-to-r from-[#0B57D0] via-[#0D47A1] to-[#0A387E] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl font-bold border border-white/20 shadow-inner">
              {patient.prenom[0]}
              {patient.nom[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  {patient.civilite ? `${patient.civilite} ` : ''}{patient.prenom} {patient.nom}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 border border-white/20 font-medium">
                  {patient.statut || 'Actif'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 border border-white/20 font-medium">
                  {patient.gender === 'F' ? 'Femme / أنثى' : 'Homme / ذكر'}
                </span>
              </div>
              <p className="text-sm text-blue-100/90 mt-0.5 flex items-center gap-3">
                <span>{patient.age} ans</span>
                <span>•</span>
                <span>CIN : {patient.cin}</span>
                {patient.profession && (
                  <>
                    <span>•</span>
                    <span>{patient.profession}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Communication Actions */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`tel:${patient.telephone}`}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-colors"
            >
              <Phone className="w-4 h-4 text-[#0B57D0]" />
              <span>Appeler ({patient.telephone})</span>
            </a>

            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Rappel WhatsApp</span>
            </button>
          </div>

          {/* Session Progress Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#0B57D0]" />
                Progression des séances de kinésithérapie
              </span>
              <span className="text-xs font-bold text-[#0B57D0]">
                {done} / {total} séances ({percent}%)
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0B57D0] to-[#F05A28] rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>

            {onIncrementSeance && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => onIncrementSeance(patient)}
                  className="text-xs font-medium text-[#0B57D0] hover:text-[#0D47A1] bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:bg-blue-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-[#0B57D0]" />
                  Valider une séance effectuée (+1)
                </button>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            {/* Assurance */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Assurance / Mutuelle
              </span>
              <span
                className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getAssuranceColor(
                  patient.assurance
                )}`}
              >
                {patient.assurance}
              </span>
            </div>

            {/* Médecin traitant */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Médecin prescripteur
              </span>
              <p className="font-semibold text-slate-800">
                {patient.medecin_traitant || 'Non spécifié'}
              </p>
            </div>

            {/* Motif de consultation */}
            <div className="sm:col-span-2 p-3 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Motif de consultation & Diagnostic
              </span>
              <p className="font-semibold text-slate-800">
                {patient.motif_consultation || 'Rééducation fonctionnelle générale'}
              </p>
            </div>

            {/* Antécédents */}
            <div className="sm:col-span-2 p-3 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Antécédents Médicaux & Chirurgicaux
              </span>
              <p className="text-slate-700">
                {patient.antecedents || 'Aucun antécédent particulier renseigné.'}
              </p>
            </div>

            {/* Adresse */}
            <div className="sm:col-span-2 p-3 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Adresse
              </span>
              <p className="text-slate-700">{patient.adresse || 'Fès'}</p>
            </div>

            {/* Observations & Bilan Kinésithérapique - Toujours visible */}
            {patient.notes && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-[11px] font-semibold text-[#0B57D0] block mb-1">
                  Observations & Bilan Kinésithérapique
                </span>
                <p className="text-slate-700">{patient.notes}</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/patients/${patient.id}?tab=bilan`}
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0B57D0] to-[#0D47A1] text-white hover:brightness-110 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Stethoscope className="w-3.5 h-3.5 text-sky-200" />
                <span>Ouvrir Bilan Kiné</span>
              </Link>

              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm(`Êtes-vous sûr de vouloir supprimer le dossier de ${patient.prenom} ${patient.nom} ?`)) {
                      onDelete(patient.id);
                      onClose();
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1.5 p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Supprimer le dossier</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fermer la fiche
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        patient={patient}
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />
    </div>
  );
}
