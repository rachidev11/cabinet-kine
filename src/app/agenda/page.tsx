'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { INITIAL_PATIENTS } from '@/lib/mockData';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Patient {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  civilite?: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  box: number;
  type_seance: string;
  statut: string;
  patients?: Patient;
}

const CRENEAUX = [
  '09:00', '10:00', '11:00', '12:00', // الصباح
  '15:00', '16:00', '17:00', '18:00', '19:00' // المساء
];

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ heure: string; box: number } | null>(null);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [typeSeance, setTypeSeance] = useState('Kinésithérapie générale');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  async function fetchPatients() {
    try {
      const { data, error } = await supabase.from('patients').select('id, nom, prenom, telephone, civilite');
      if (data && data.length > 0) {
        setPatients(data);
      } else {
        // Fallback to initial demo patients
        setPatients(
          INITIAL_PATIENTS.map((p) => ({
            id: String(p.id),
            nom: p.nom,
            prenom: p.prenom,
            telephone: p.telephone,
            civilite: p.civilite,
          }))
        );
      }
    } catch {
      setPatients(
        INITIAL_PATIENTS.map((p) => ({
          id: String(p.id),
          nom: p.nom,
          prenom: p.prenom,
          telephone: p.telephone,
          civilite: p.civilite,
        }))
      );
    }
  }

  async function fetchAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patients(id, nom, prenom, telephone, civilite)')
      .eq('date', selectedDate);

    if (data) setAppointments(data);
  }

  function handleOpenBooking(heure: string, box: number) {
    setSelectedSlot({ heure, box });
    setIsModalOpen(true);
  }

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !selectedPatientId) return;

    const [hourStr, minuteStr] = selectedSlot.heure.split(':');
    const heureDebut = `${hourStr.padStart(2, '0')}:${minuteStr.padStart(2, '0')}:00`;
    const nextHour = (Number(hourStr) + 1).toString().padStart(2, '0');
    const heureFin = `${nextHour}:00:00`;

    const { error } = await supabase.from('appointments').insert([
      {
        patient_id: selectedPatientId,
        date: selectedDate,
        heure_debut: heureDebut,
        heure_fin: heureFin,
        box: selectedSlot.box,
        type_seance: typeSeance,
        statut: 'Planifié'
      }
    ]);

    if (error) {
      console.error('Failed to create appointment:', error);
      alert('Erreur lors de la création du rendez-vous. Veuillez réessayer.');
      return;
    }

    setIsModalOpen(false);
    setSelectedPatientId('');
    setSelectedSlot(null);
    fetchAppointments();
  }

  async function updateStatus(id: string, newStatus: string) {
    await supabase.from('appointments').update({ statut: newStatus }).eq('id', id);
    fetchAppointments();
  }

  function sendWhatsAppReminder(rdv: Appointment) {
    const patient = rdv.patients;
    if (!patient || !patient.telephone) return;

    let phone = patient.telephone.replace(/\s+/g, '').replace(/^0/, '212');

    // Personnalisation selon la Civilité :
    // Si Monsieur -> Bonjour M. [Nom]
    // Si Madame -> Bonjour Mme [Nom]
    // Si Mademoiselle -> Bonjour Mlle [Nom]
    let civilitePrefix = 'M./Mme';
    if (patient.civilite === 'Monsieur') {
      civilitePrefix = 'M.';
    } else if (patient.civilite === 'Madame') {
      civilitePrefix = 'Mme';
    } else if (patient.civilite === 'Mademoiselle') {
      civilitePrefix = 'Mlle';
    }

    const heure = rdv.heure_debut.substring(0, 5);
    const message = encodeURIComponent(
      `Bonjour ${civilitePrefix} ${patient.nom},\nNous vous rappelons votre séance de kinésithérapie prévue le ${rdv.date} à ${heure} en Salle ${rdv.box}.\nCentre de Kinésithérapie Nassim Al Massira (Hassna El-Hmaidi) vous remercie de confirmer votre présence.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planning & Agenda des Séances</h1>
          <p className="text-slate-500 text-sm">Centre de Kinésithérapie Nassim Al Massira • Gestion des créneaux & 3 Salles</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2 font-medium text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-[#0B57D0]"
          />
        </div>
      </div>

      {/* Grid: 3 Salles */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <div className="min-w-[750px]">
          {/* Header Row */}
          <div className="grid grid-cols-4 bg-slate-100/70 border-b border-slate-200 text-sm font-semibold text-slate-700">
            <div className="p-4 border-r border-slate-200 text-center">Horaire</div>
            <div className="p-4 border-r border-slate-200 text-center text-[#0B57D0] font-bold">Salle 1 (Table & Électrothérapie)</div>
            <div className="p-4 border-r border-slate-200 text-center text-[#0D47A1] font-bold">Salle 2 (Table & Physiothérapie)</div>
            <div className="p-4 text-center text-[#F05A28] font-bold">Salle 3 (Plateau Rééducation & Marche)</div>
          </div>

          {/* Time Slots Rows */}
          {CRENEAUX.map((heure) => {
            return (
              <div key={heure} className="grid grid-cols-4 border-b border-slate-100 text-sm hover:bg-slate-50/50">
                <div className="p-4 border-r border-slate-200 font-semibold text-slate-600 flex items-center justify-center gap-2 bg-slate-50/30">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {heure}
                </div>

                {[1, 2, 3].map((boxNum) => {
                  const rdv = appointments.find(
                    (a) => a.heure_debut.startsWith(heure) && a.box === boxNum
                  );

                  return (
                    <div key={boxNum} className="p-2 border-r border-slate-200 last:border-r-0 min-h-[90px] flex flex-col justify-center">
                      {rdv ? (
                        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex flex-col justify-between h-full shadow-2xs">
                          <div>
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span>{rdv.patients?.nom} {rdv.patients?.prenom}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-[#F05A28] font-bold">
                                {rdv.statut}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{rdv.type_seance}</p>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-blue-100">
                            <select
                              value={rdv.statut}
                              onChange={(e) => updateStatus(rdv.id, e.target.value)}
                              className="text-[11px] bg-white border border-blue-300 rounded px-1.5 py-0.5 outline-none font-medium"
                            >
                              <option value="Planifié">Planifié</option>
                              <option value="En séance">En séance</option>
                              <option value="Terminé">Terminé</option>
                              <option value="Annulé">Annulé</option>
                            </select>

                            <button
                              onClick={() => sendWhatsAppReminder(rdv)}
                              title="Envoyer rappel WhatsApp"
                              className="text-[#0B57D0] hover:text-[#0D47A1] bg-white p-1 rounded-md shadow-2xs border border-blue-200"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenBooking(heure, boxNum)}
                          className="w-full h-full border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-1.5 text-slate-400 hover:text-[#0B57D0] hover:border-[#0B57D0] hover:bg-blue-50/30 transition py-4 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-xs font-medium">Libre</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Nouveau Rendez-vous */}
      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Nouveau Rendez-vous</h2>
            <p className="text-xs text-slate-500 mb-4">
              Créneau: <span className="font-semibold text-emerald-600">{selectedSlot.heure}</span> | Emplacement: <span className="font-semibold text-emerald-600">Salle {selectedSlot.box}</span>
            </p>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sélectionner le Patient</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Choisir un patient --</option>
                  {patients.map((p) => {
                    const prefix = p.civilite === 'Monsieur' ? 'M. ' : p.civilite === 'Madame' ? 'Mme ' : p.civilite === 'Mademoiselle' ? 'Mlle ' : '';
                    return (
                      <option key={p.id} value={p.id}>
                        {prefix}{p.nom} {p.prenom} ({p.telephone || 'Sans tél'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type de séance / Motif</label>
                <input
                  type="text"
                  value={typeSeance}
                  onChange={(e) => setTypeSeance(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B57D0]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B57D0] hover:bg-[#0D47A1] text-white text-sm font-semibold transition shadow-sm cursor-pointer"
                >
                  Confirmer le rendez-vous
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}