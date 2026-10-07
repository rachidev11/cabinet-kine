import { Patient } from './patient';

export type DbAppointmentStatus = 'scheduled' | 'no_show' | 'completed' | 'cancelled';

export type FrenchAppointmentStatus = 'Planifié' | 'En séance' | 'Terminé' | 'Annulé';

export interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm:ss or HH:mm
  end_time: string; // HH:mm:ss or HH:mm
  slot_number: number; // 1 | 2 | 3 (Salle 1, Salle 2, Salle 3)
  status: DbAppointmentStatus;
  notes?: string | null;
  created_at?: string;
  patient?: Patient;
  // Aliases for agenda & schema compatibility
  date?: string;
  heure_debut?: string;
  heure_fin?: string;
  box?: number;
  patients?: Patient;
}

export interface NewAppointmentInput {
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  slot_number: number;
  status?: DbAppointmentStatus;
  notes?: string | null;
}

export const TIME_SLOTS = [
  // Matin (09:00 - 13:00)
  { start: '09:00', end: '10:00', label: '09:00 - 10:00', period: 'Matin' },
  { start: '10:00', end: '11:00', label: '10:00 - 11:00', period: 'Matin' },
  { start: '11:00', end: '12:00', label: '11:00 - 12:00', period: 'Matin' },
  { start: '12:00', end: '13:00', label: '12:00 - 13:00', period: 'Matin' },
  // Après-midi (15:00 - 20:00)
  { start: '15:00', end: '16:00', label: '15:00 - 16:00', period: 'Après-midi' },
  { start: '16:00', end: '17:00', label: '16:00 - 17:00', period: 'Après-midi' },
  { start: '17:00', end: '18:00', label: '17:00 - 18:00', period: 'Après-midi' },
  { start: '18:00', end: '19:00', label: '18:00 - 19:00', period: 'Après-midi' },
  { start: '19:00', end: '20:00', label: '19:00 - 20:00', period: 'Après-midi' },
] as const;

export const BOX_LIST = [
  { id: 1, name: 'Salle 1', desc: 'Table & Électrothérapie', color: 'blue' },
  { id: 2, name: 'Salle 2', desc: 'Table & Ultrasons / Chaleur', color: 'sky' },
  { id: 3, name: 'Salle 3', desc: 'Plateau Rééducation & Marche', color: 'indigo' },
] as const;

// Alias for room list
export const ROOM_LIST = BOX_LIST;

// Conversion between Postgres enum and French display labels
export const STATUS_MAP: Record<DbAppointmentStatus, { label: FrenchAppointmentStatus; badge: string; border: string }> = {
  scheduled: {
    label: 'Planifié',
    badge: 'bg-blue-50 text-[#0B57D0] border-blue-200',
    border: 'border-l-[#0B57D0]',
  },
  no_show: {
    label: 'En séance',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    border: 'border-l-amber-500',
  },
  completed: {
    label: 'Terminé',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-l-emerald-500',
  },
  cancelled: {
    label: 'Annulé',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    border: 'border-l-rose-500',
  },
};

export const FRENCH_TO_DB_STATUS: Record<FrenchAppointmentStatus, DbAppointmentStatus> = {
  'Planifié': 'scheduled',
  'En séance': 'no_show',
  'Terminé': 'completed',
  'Annulé': 'cancelled',
};
