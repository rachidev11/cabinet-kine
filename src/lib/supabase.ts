import { createClient } from '@supabase/supabase-js';
import { Patient, NewPatientInput } from '@/types/patient';
import { Appointment, NewAppointmentInput, DbAppointmentStatus } from '@/types/appointment';
import { Payment, NewPaymentInput } from '@/types/payment';
import { MedicalRecord, NewMedicalRecordInput } from '@/types/medicalRecord';

// Sanitize URL: Remove /rest/v1 or trailing slashes if present
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fbfbzsererucogvqmozy.supabase.co';
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_bYhozgDk0ABZWJLJvYe1fg_m5cHiB5K';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: string;
    isRlsError?: boolean;
  } | null;
}

/**
 * Fetch all patients from Supabase 'patients' table.
 */
export async function getPatientsFromSupabase(): Promise<SupabaseResponse<Patient[]>> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erreur Supabase lors de la récupération des patients:', error);
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          isRlsError: error.code === '42501' || error.message.includes('row-level security'),
        },
      };
    }

    return { data: (data as Patient[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    return {
      data: null,
      error: { message },
    };
  }
}

/**
 * Insert a new patient into Supabase 'patients' table.
 */
export async function addPatientToSupabase(patient: NewPatientInput): Promise<SupabaseResponse<Patient>> {
  try {
    const payload = {
      ...patient,
      civilite: patient.civilite || 'Monsieur',
      created_at: new Date().toISOString(),
      statut: patient.statut || 'Actif',
      nombre_seances_effectuees: patient.nombre_seances_effectuees || 0,
      nombre_seances_prescrites: patient.nombre_seances_prescrites || 10,
    };

    const { data, error } = await supabase
      .from('patients')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Erreur Supabase lors de l\'ajout du patient:', error);
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          isRlsError: error.code === '42501' || error.message.includes('row-level security'),
        },
      };
    }

    return { data: data as Patient, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    return {
      data: null,
      error: { message },
    };
  }
}

/**
 * Update an existing patient in Supabase.
 */
export async function updatePatientInSupabase(
  id: string | number,
  updates: Partial<Patient>
): Promise<SupabaseResponse<Patient>> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          isRlsError: error.code === '42501',
        },
      };
    }

    return { data: data as Patient, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { data: null, error: { message } };
  }
}

/**
 * Delete a patient from Supabase.
 */
export async function deletePatientFromSupabase(id: string | number): Promise<SupabaseResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          isRlsError: error.code === '42501',
        },
      };
    }

    return { data: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { data: null, error: { message } };
  }
}

// =====================================================================
// APPOINTMENTS (RDV) OPERATIONS
// =====================================================================

/**
 * Fetch appointments, optionally filtered by date (YYYY-MM-DD), with joined patient details.
 */
export async function getAppointmentsFromSupabase(dateString?: string): Promise<SupabaseResponse<Appointment[]>> {
  try {
    let query = supabase
      .from('appointments')
      .select('*, patient:patients(*)');

    if (dateString) {
      query = query.eq('appointment_date', dateString);
    }

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) {
      console.warn('Erreur Supabase lors de la récupération des rendez-vous:', error);
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          isRlsError: error.code === '42501',
        },
      };
    }

    return { data: (data as Appointment[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    return { data: null, error: { message } };
  }
}

/**
 * Insert a new appointment into Supabase 'appointments' table.
 */
export async function addAppointmentToSupabase(
  appointment: NewAppointmentInput
): Promise<SupabaseResponse<Appointment>> {
  try {
    const payload = {
      patient_id: appointment.patient_id,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time.length === 5 ? `${appointment.start_time}:00` : appointment.start_time,
      end_time: appointment.end_time.length === 5 ? `${appointment.end_time}:00` : appointment.end_time,
      slot_number: appointment.slot_number,
      status: appointment.status || 'scheduled',
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert([payload])
      .select('*, patient:patients(*)')
      .single();

    if (error) {
      console.warn('Erreur Supabase lors de la création du rendez-vous:', error);
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          isRlsError: error.code === '42501',
        },
      };
    }

    return { data: data as Appointment, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    return { data: null, error: { message } };
  }
}

/**
 * Update the status of an appointment in Supabase.
 */
export async function updateAppointmentStatusInSupabase(
  id: string,
  status: DbAppointmentStatus
): Promise<SupabaseResponse<Appointment>> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select('*, patient:patients(*)')
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          isRlsError: error.code === '42501',
        },
      };
    }

    return { data: data as Appointment, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    return { data: null, error: { message } };
  }
}

/**
 * Delete an appointment from Supabase.
 */
export async function deleteAppointmentFromSupabase(id: string): Promise<SupabaseResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          isRlsError: error.code === '42501',
        },
      };
    }

    return { data: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { data: null, error: { message } };
  }
}

// =====================================================================
// PAYMENTS (PAIEMENTS) OPERATIONS
// =====================================================================

/**
 * Fetch all payments from Supabase with joined patient details.
 */
export async function getPaymentsFromSupabase(): Promise<SupabaseResponse<Payment[]>> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, patient:patients(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erreur Supabase lors de la récupération des paiements:', error);
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          isRlsError: error.code === '42501',
        },
      };
    }

    return { data: (data as Payment[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    return { data: null, error: { message } };
  }
}

/**
 * Insert a new payment into Supabase 'payments' table.
 */
export async function addPaymentToSupabase(payment: NewPaymentInput): Promise<SupabaseResponse<Payment>> {
  try {
    const payload: Record<string, unknown> = {
      patient_id: payment.patient_id,
      amount: payment.amount,
      method: payment.method,
    };

    // Only include optional fields if they have values
    if (payment.payment_type) payload.payment_type = payment.payment_type;
    if (payment.notes) payload.notes = payment.notes;

    const { data, error } = await supabase
      .from('payments')
      .insert([payload])
      .select('*, patient:patients(*)')
      .single();

    if (error) {
      console.warn('Erreur Supabase lors de l\'ajout du paiement:', error);
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          isRlsError: error.code === '42501',
        },
      };
    }

    return { data: data as Payment, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    return { data: null, error: { message } };
  }
}

/**
 * Get payment KPI data: monthly total, daily total, total sessions paid.
 */
export async function getPaymentKpis(): Promise<{
  totalMois: number;
  totalAujourdhui: number;
  totalSeancesReglees: number;
}> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  // Fetch all payments for this month
  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount, created_at')
    .gte('created_at', `${firstDayOfMonth}T00:00:00`)
    .order('created_at', { ascending: false });

  let totalMois = 0;
  let totalAujourdhui = 0;
  let totalSeancesReglees = 0;

  if (monthPayments) {
    totalSeancesReglees = monthPayments.length;
    for (const p of monthPayments) {
      totalMois += Number(p.amount) || 0;
      if (p.created_at && p.created_at.startsWith(todayStr)) {
        totalAujourdhui += Number(p.amount) || 0;
      }
    }
  }

  return { totalMois, totalAujourdhui, totalSeancesReglees };
}

// =====================================================================
// PATIENT DOSSIER & MEDICAL RECORD OPERATIONS
// =====================================================================

/**
 * Fetch a single patient by ID.
 */
export async function getPatientByIdFromSupabase(id: string | number): Promise<SupabaseResponse<Patient>> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          isRlsError: error.code === '42501',
        },
      };
    }

    return { data: data as Patient | null, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    return { data: null, error: { message } };
  }
}

/**
 * Fetch medical record (bilan kiné) for a given patient ID.
 */
export async function getMedicalRecordByPatientId(
  patientId: string | number
): Promise<SupabaseResponse<MedicalRecord | null>> {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          isRlsError: error.code === '42501',
        },
      };
    }

    return { data: (data as MedicalRecord) || null, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    return { data: null, error: { message } };
  }
}

/**
 * Upsert (create or update) medical record (bilan kiné) for a patient.
 */
export async function upsertMedicalRecord(
  record: Partial<MedicalRecord> & { patient_id: string | number }
): Promise<SupabaseResponse<MedicalRecord>> {
  try {
    const payload = {
      ...record,
      updated_at: new Date().toISOString(),
    };

    if (record.id) {
      const { data, error } = await supabase
        .from('medical_records')
        .update(payload)
        .eq('id', record.id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as MedicalRecord, error: null };
    }

    // Check if one already exists for this patient
    const { data: existing } = await supabase
      .from('medical_records')
      .select('id')
      .eq('patient_id', record.patient_id)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('medical_records')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as MedicalRecord, error: null };
    } else {
      const { data, error } = await supabase
        .from('medical_records')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return { data: data as MedicalRecord, error: null };
    }
  } catch (err: unknown) {
    const errorObj = err as { message?: string; code?: string };
    const message = errorObj?.message || (err instanceof Error ? err.message : 'Erreur inconnue');
    return {
      data: null,
      error: {
        message,
        code: errorObj?.code,
        isRlsError: errorObj?.code === '42501' || message.includes('row-level security'),
      },
    };
  }
}

/**
 * Fetch appointments for a specific patient.
 */
export async function getAppointmentsByPatientId(
  patientId: string | number
): Promise<SupabaseResponse<Appointment[]>> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*)')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          isRlsError: error.code === '42501',
        },
      };
    }

    return { data: (data as Appointment[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    return { data: null, error: { message } };
  }
}

/**
 * Fetch payments for a specific patient.
 */
export async function getPaymentsByPatientId(
  patientId: string | number
): Promise<SupabaseResponse<Payment[]>> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, patient:patients(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          isRlsError: error.code === '42501',
        },
      };
    }

    return { data: (data as Payment[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    return { data: null, error: { message } };
  }
}
