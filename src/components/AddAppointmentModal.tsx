'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bed,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Patient } from '@/types/patient';
import { TIME_SLOTS, BOX_LIST, NewAppointmentInput, Appointment } from '@/types/appointment';
import { addAppointmentToSupabase } from '@/lib/supabase';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  existingAppointments: Appointment[];
  initialDate?: string;
  initialTime?: string;
  initialSlotNumber?: number;
  onAppointmentCreated: (newApt: Appointment) => void;
}

export default function AddAppointmentModal({
  isOpen,
  onClose,
  patients,
  existingAppointments,
  initialDate,
  initialTime,
  initialSlotNumber,
  onAppointmentCreated,
}: AddAppointmentModalProps) {
  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  const [date, setDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [timeSlotIndex, setTimeSlotIndex] = useState<number>(0);
  const [slotNumber, setSlotNumber] = useState<number>(initialSlotNumber || 1);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialDate) setDate(initialDate);
      if (initialSlotNumber) setSlotNumber(initialSlotNumber);

      if (initialTime) {
        const idx = TIME_SLOTS.findIndex((s) => s.start === initialTime.slice(0, 5));
        if (idx !== -1) setTimeSlotIndex(idx);
      }
      setErrorMsg(null);
    }
  }, [isOpen, initialDate, initialTime, initialSlotNumber]);

  // Filter patients in combobox
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 20);
    const q = patientSearch.toLowerCase().trim();
    return patients.filter(
      (p) =>
        p.nom.toLowerCase().includes(q) ||
        p.prenom.toLowerCase().includes(q) ||
        p.telephone.toLowerCase().includes(q) ||
        p.cin.toLowerCase().includes(q)
    );
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(
    () => patients.find((p) => String(p.id) === String(selectedPatientId)),
    [patients, selectedPatientId]
  );

  // Check if target slot is already occupied
  const currentTimeSlot = TIME_SLOTS[timeSlotIndex];
  const isOccupied = useMemo(() => {
    if (!currentTimeSlot) return false;
    return existingAppointments.some(
      (apt) =>
        apt.appointment_date === date &&
        apt.start_time.slice(0, 5) === currentTimeSlot.start &&
        Number(apt.slot_number) === Number(slotNumber) &&
        apt.status !== 'cancelled'
    );
  }, [existingAppointments, date, currentTimeSlot, slotNumber]);

  if (!isOpen) return null;

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedPatientId) {
      setErrorMsg('Veuillez sélectionner un patient dans la liste.');
      return;
    }

    if (isOccupied) {
      setErrorMsg(
        `La Salle ${slotNumber} est déjà réservée pour le créneau ${currentTimeSlot.label} à cette date.`
      );
      return;
    }

    // Check if Sunday
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0) {
      setErrorMsg('Le cabinet est fermé le dimanche. Veuillez choisir du lundi au samedi.');
      return;
    }

    setLoading(true);

    try {
      const payload: NewAppointmentInput = {
        patient_id: selectedPatientId,
        appointment_date: date,
        start_time: currentTimeSlot.start,
        end_time: currentTimeSlot.end,
        slot_number: Number(slotNumber),
        status: 'scheduled',
      };

      const res = await addAppointmentToSupabase(payload);

      if (res.data) {
        // Direct success from Supabase
        const created = {
          ...res.data,
          patient: selectedPatient,
        };
        onAppointmentCreated(created);
        handleResetAndClose();
      } else if (res.error) {
        if (res.error.isRlsError) {
          // Optimistic local appointment in case of RLS restriction
          const fallbackApt: Appointment = {
            id: `temp-apt-${Date.now()}`,
            patient_id: selectedPatientId,
            appointment_date: date,
            start_time: currentTimeSlot.start,
            end_time: currentTimeSlot.end,
            slot_number: Number(slotNumber),
            status: 'scheduled',
            created_at: new Date().toISOString(),
            patient: selectedPatient,
          };
          onAppointmentCreated(fallbackApt);
          handleResetAndClose();
        } else {
          setErrorMsg(res.error.message || 'Erreur lors de la réservation.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSelectedPatientId('');
    setPatientSearch('');
    setIsPatientDropdownOpen(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-cyan-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Nouveau Rendez-vous</h2>
              <p className="text-xs text-teal-100">Planification d&apos;une séance de kinésithérapie</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Patient Selector (Searchable Combobox) */}
          <div className="space-y-1 relative">
            <label className="block text-xs font-semibold text-slate-700">
              Sélectionner le Patient <span className="text-rose-500">*</span>
            </label>

            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-teal-200 bg-teal-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
                    {selectedPatient.prenom[0]}
                    {selectedPatient.nom[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedPatient.prenom} {selectedPatient.nom}
                    </p>
                    <p className="text-xs text-slate-500">
                      CIN: {selectedPatient.cin} • Tél: {selectedPatient.telephone}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientId('');
                    setIsPatientDropdownOpen(true);
                  }}
                  className="text-xs text-teal-700 hover:text-teal-900 font-semibold p-1 hover:bg-teal-100 rounded-lg cursor-pointer"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par Nom, Prénom, Tél, CIN..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setIsPatientDropdownOpen(true);
                    }}
                    onFocus={() => setIsPatientDropdownOpen(true)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                  <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>

                {isPatientDropdownOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                    {filteredPatients.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        Aucun patient correspondant trouvé.
                      </div>
                    ) : (
                      filteredPatients.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatientId(String(p.id));
                            setIsPatientDropdownOpen(false);
                            setPatientSearch('');
                          }}
                          className="p-2.5 hover:bg-teal-50/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <p className="font-bold text-slate-900">
                              {p.prenom} {p.nom}
                            </p>
                            <p className="text-slate-500">
                              CIN: {p.cin} • Tél: {p.telephone}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {p.assurance}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Date Selection */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Date du Rendez-vous <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
            {new Date(date).getDay() === 0 && (
              <p className="text-[11px] text-amber-600 font-medium">
                ⚠️ Attention : Le cabinet est fermé le dimanche.
              </p>
            )}
          </div>

          {/* 3. Time Slot (Créneau Horaire) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Créneau Horaire (1 heure) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Matin (09:00 - 13:00) & Après-midi (15:00 - 20:00)
              </div>
              <select
                value={timeSlotIndex}
                onChange={(e) => setTimeSlotIndex(Number(e.target.value))}
                className="col-span-2 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                {TIME_SLOTS.map((slot, idx) => (
                  <option key={slot.label} value={idx}>
                    {slot.label} ({slot.period})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Salle Selection (3 Treatment Rooms) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Salle de Traitement <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {BOX_LIST.map((box) => {
                const isSelected = slotNumber === box.id;
                // Check if this specific box is occupied for the selected time
                const boxOccupied = existingAppointments.some(
                  (apt) =>
                    apt.appointment_date === date &&
                    apt.start_time.slice(0, 5) === currentTimeSlot?.start &&
                    Number(apt.slot_number) === box.id &&
                    apt.status !== 'cancelled'
                );

                return (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => setSlotNumber(box.id)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-2xs font-bold'
                        : boxOccupied
                        ? 'border-slate-200 bg-slate-100/70 text-slate-400 opacity-60'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <Bed className={`w-5 h-5 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold">{box.name}</span>
                    <span className="text-[10px] text-slate-400 truncate w-full">
                      {boxOccupied ? 'Occupé' : 'Libre'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {isOccupied && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              ⚠️ Cette Salle est déjà réservée sur ce créneau. Veuillez sélectionner une autre Salle ou changer d&apos;heure.
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleResetAndClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading || isOccupied || !selectedPatientId}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer le Rendez-vous</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
