'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Bed,
  CheckCircle2,
  Trash2,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Shield,
  Activity,
} from 'lucide-react';
import { Appointment, DbAppointmentStatus, STATUS_MAP } from '@/types/appointment';
import { generateWhatsAppReminderUrl } from '@/lib/whatsapp';

interface AppointmentActionModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: DbAppointmentStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function AppointmentActionModal({
  appointment,
  isOpen,
  onClose,
  onStatusChange,
  onDelete,
}: AppointmentActionModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient;
  const currentStatusConfig = STATUS_MAP[appointment.status] || STATUS_MAP.scheduled;

  // WhatsApp reminder URL
  const whatsAppUrl = generateWhatsAppReminderUrl(appointment);

  const handleSetStatus = async (status: DbAppointmentStatus) => {
    setUpdating(true);
    try {
      await onStatusChange(appointment.id, status);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Détails du Rendez-vous</h2>
              <p className="text-xs text-teal-100">Salle {appointment.slot_number} • {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {/* Patient Card */}
          {patient ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {patient.prenom[0]}
                  {patient.nom[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {patient.prenom} {patient.nom}
                  </h3>
                  <p className="text-xs text-slate-500">
                    CIN: {patient.cin} • {patient.age} ans
                  </p>
                  {patient.motif_consultation && (
                    <p className="text-[11px] text-teal-700 font-medium truncate max-w-[200px] mt-0.5">
                      {patient.motif_consultation}
                    </p>
                  )}
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700 shrink-0">
                {patient.assurance}
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
              Patient ID : <span className="font-mono text-xs">{appointment.patient_id}</span>
            </div>
          )}

          {/* Time & Box info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                Horaire
              </span>
              <p className="font-bold text-slate-900">
                {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
              </p>
              <p className="text-[11px] text-slate-500">{appointment.appointment_date}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-teal-600" />
                Emplacement
              </span>
              <p className="font-bold text-slate-900">Salle {appointment.slot_number}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${currentStatusConfig.badge}`}>
                {currentStatusConfig.label}
              </span>
            </div>
          </div>

          {/* 1-Click WhatsApp Reminder Button */}
          {patient?.telephone && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Envoyer confirmation WhatsApp (1-Clic)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          )}

          {/* Change Status Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Changer le Statut de la Séance
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={updating}
                onClick={() => handleSetStatus('scheduled')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  appointment.status === 'scheduled'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Planifié
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={() => handleSetStatus('no_show')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  appointment.status === 'no_show'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                En séance
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={() => handleSetStatus('completed')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  appointment.status === 'completed'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Terminé
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={() => handleSetStatus('cancelled')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  appointment.status === 'cancelled'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Annulé
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={async () => {
                if (confirm('Voulez-vous supprimer ce rendez-vous ?')) {
                  await onDelete(appointment.id);
                  onClose();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer le rdv</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
