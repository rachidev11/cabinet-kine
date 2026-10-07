'use client';

import React, { useState, useMemo } from 'react';
import { X, MessageSquare, Send, Globe, Check, Calendar, Clock, User, ExternalLink } from 'lucide-react';
import { Patient } from '@/types/patient';
import { Appointment } from '@/types/appointment';
import {
  formatPhoneForWhatsApp,
  isPatientFemale,
  buildWhatsAppReminderMessage,
  formatDateForWhatsApp,
} from '@/lib/whatsapp';
import { useLanguage } from '@/context/LanguageContext';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  appointment?: Appointment | null;
  defaultDate?: string;
  defaultTime?: string;
}

export default function WhatsAppReminderModal({
  isOpen,
  onClose,
  patient,
  appointment,
  defaultDate,
  defaultTime,
}: WhatsAppReminderModalProps) {
  const { language: currentAppLang } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<'fr' | 'ar'>(currentAppLang === 'ar' ? 'ar' : 'fr');

  // Initial date & time
  const initialDate = appointment?.appointment_date || appointment?.date || defaultDate || new Date().toISOString().split('T')[0];
  const initialTime = appointment?.start_time?.slice(0, 5) || appointment?.heure_debut?.slice(0, 5) || defaultTime || '10:00';

  const [date, setDate] = useState<string>(initialDate);
  const [time, setTime] = useState<string>(initialTime);

  const isFemale = isPatientFemale(patient);
  const cleanPhone = formatPhoneForWhatsApp(patient.telephone || '');

  // Build the message dynamically
  const message = useMemo(() => {
    return buildWhatsAppReminderMessage({
      patient,
      date,
      time,
      lang: selectedLang,
    });
  }, [patient, date, time, selectedLang]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!cleanPhone) {
      alert(selectedLang === 'ar' ? 'رقم الهاتف غير متوفر لهذا المريض' : 'Aucun numéro de téléphone valide');
      return;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8"
        dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {selectedLang === 'ar' ? 'تذكير بالموعد عبر واتساب' : 'Rappel de rendez-vous WhatsApp'}
              </h2>
              <p className="text-xs text-emerald-100">
                {selectedLang === 'ar' ? 'مركز نسيم المسيرة • رسالة تذكير مخصصة' : 'Centre Nassim Al Massira • Message personnalisé'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Patient Card & Gender Badge */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                {patient.prenom[0]}
                {patient.nom[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {patient.civilite ? `${patient.civilite} ` : ''}{patient.prenom} {patient.nom}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {patient.telephone || 'Sans téléphone'}
                </p>
              </div>
            </div>

            {/* Gender Badge indicator */}
            <div className="text-right rtl:text-left">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                isFemale
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                <User className="w-3 h-3" />
                <span>
                  {isFemale
                    ? (selectedLang === 'ar' ? 'أنثى (سيدتي / Mme)' : 'Femme (Mme / أنثى)')
                    : (selectedLang === 'ar' ? 'ذكر (سيدي / M.)' : 'Homme (M. / ذكر)')
                  }
                </span>
              </span>
            </div>
          </div>

          {/* 1. Language Selector Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{selectedLang === 'ar' ? 'اختر لغة الرسالة' : 'Choisir la langue du message'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedLang('fr')}
                className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedLang === 'fr'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🇫🇷 Français</span>
                {selectedLang === 'fr' && <Check className="w-4 h-4 text-emerald-600" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedLang('ar')}
                className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedLang === 'ar'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🇲🇦 العربية</span>
                {selectedLang === 'ar' && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            </div>
          </div>

          {/* 2. Date & Time adjustment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{selectedLang === 'ar' ? 'تاريخ الموعد' : 'Date de la séance'}</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{selectedLang === 'ar' ? 'توقيت الحصة' : 'Heure de la séance'}</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* 3. Message Live Preview (WhatsApp Bubble) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              {selectedLang === 'ar' ? 'معاينة نص الرسالة' : 'Aperçu du message WhatsApp'}
            </label>
            <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-slate-200 text-slate-900 shadow-inner">
              <div className="p-3.5 rounded-xl bg-white shadow-xs border border-slate-100/80 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {message}
                <div className="text-[10px] text-slate-400 text-right rtl:text-left mt-2 flex items-center justify-end rtl:justify-start gap-1 font-mono">
                  <span>{time}</span>
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {selectedLang === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>

            <button
              type="button"
              onClick={handleSend}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>
                {selectedLang === 'ar' ? 'فتح وإرسال عبر واتساب' : 'Envoyer sur WhatsApp'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
