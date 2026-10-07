import { Appointment } from '@/types/appointment';
import { Patient } from '@/types/patient';

/**
 * Normalizes a phone number to WhatsApp international format.
 * Moroccan numbers: '06 61 23 45 67' -> '212661234567'
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '212' + digits.substring(1);
  }
  if (!digits.startsWith('212') && digits.length === 9) {
    return '212' + digits;
  }
  return digits;
}

/**
 * Generates the professional French WhatsApp reminder message and direct wa.me link.
 */
export function generateWhatsAppReminderUrl(
  appointment: Appointment,
  patientOverride?: Patient
): string {
  const patient = patientOverride || appointment.patient;
  if (!patient || !patient.telephone) return '#';

  const cleanPhone = formatPhoneForWhatsApp(patient.telephone);

  // Format date in French: e.g. "Lundi 5 Octobre 2026"
  let dateFormatted = appointment.appointment_date;
  try {
    const [y, m, d] = appointment.appointment_date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateFormatted = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
    // Capitalize first letter
    dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
  } catch {}

  const startTime = appointment.start_time.slice(0, 5);
  const endTime = appointment.end_time.slice(0, 5);
  const roomName = `Salle ${appointment.slot_number}`;

  // Civilité prefix
  let civilitePrefix = 'M./Mme';
  if (patient.civilite === 'Monsieur') {
    civilitePrefix = 'M.';
  } else if (patient.civilite === 'Madame') {
    civilitePrefix = 'Mme';
  } else if (patient.civilite === 'Mademoiselle') {
    civilitePrefix = 'Mlle';
  }

  const message = `Bonjour ${civilitePrefix} ${patient.nom},

Nous vous rappelons votre séance de kinésithérapie prévue le ${dateFormatted} à ${startTime} en ${roomName}.
Centre de Kinésithérapie Nassim Al Massira (Hassna El-Hmaidi) vous remercie de confirmer votre présence.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

