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
 * Determines whether the patient is female based on gender column or civilité fallback.
 */
export function isPatientFemale(patient: Patient): boolean {
  if (patient.gender === 'F') return true;
  if (patient.gender === 'M') return false;
  return patient.civilite === 'Madame' || patient.civilite === 'Mademoiselle';
}

/**
 * Formats a date string for WhatsApp message in French or Arabic.
 */
export function formatDateForWhatsApp(dateStr?: string, lang: 'fr' | 'ar' = 'fr'): string {
  if (!dateStr) {
    const today = new Date();
    return lang === 'ar'
      ? new Intl.DateTimeFormat('ar-MA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(today)
      : new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(today);
  }

  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    if (lang === 'ar') {
      return new Intl.DateTimeFormat('ar-MA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(dateObj);
    } else {
      const formatted = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(dateObj);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
  } catch {
    return dateStr;
  }
}

export interface BuildWhatsAppReminderParams {
  patient: Patient;
  date?: string;
  time?: string;
  lang?: 'fr' | 'ar';
}

/**
 * Builds the exact polite WhatsApp reminder message according to the patient's gender and selected language.
 */
export function buildWhatsAppReminderMessage({
  patient,
  date,
  time = '10:00',
  lang = 'fr',
}: BuildWhatsAppReminderParams): string {
  const isFemale = isPatientFemale(patient);
  const formattedDate = formatDateForWhatsApp(date, lang);
  const cleanTime = time.slice(0, 5);
  const displayName = patient.nom ? patient.nom.trim() : patient.prenom;

  if (lang === 'ar') {
    if (isFemale) {
      return `السلام عليكم سيدتي ${displayName}، نذكركم بموعد حصتكم للترويض الطبي يوم ${formattedDate} على الساعة ${cleanTime} بمركز نسيم المسيرة للترويض الطبي.\n\nالمرجو تأكيد حضوركم. شكرًا لكم.`;
    } else {
      return `السلام عليكم سيدي ${displayName}، نذكركم بموعد حصتكم للترويض الطبي يوم ${formattedDate} على الساعة ${cleanTime} بمركز نسيم المسيرة للترويض الطبي.\n\nالمرجو تأكيد حضوركم. شكرًا لكم.`;
    }
  } else {
    if (isFemale) {
      return `Bonjour Mme. ${displayName}, nous vous rappelons votre séance de kinésithérapie prévue le ${formattedDate} à ${cleanTime} au Centre Nassim Al Massira.\n\nCentre de Kinésithérapie Nassim Al Massira (Hassna El-Hmaidi) vous remercie de confirmer votre présence.`;
    } else {
      return `Bonjour M. ${displayName}, nous vous rappelons votre séance de kinésithérapie prévue le ${formattedDate} à ${cleanTime} au Centre Nassim Al Massira.\n\nCentre de Kinésithérapie Nassim Al Massira (Hassna El-Hmaidi) vous remercie de confirmer votre présence.`;
    }
  }
}

/**
 * Builds the wa.me direct link with pre-encoded message.
 */
export function buildWhatsAppReminderUrl({
  patient,
  date,
  time,
  lang = 'fr',
}: BuildWhatsAppReminderParams): string {
  if (!patient || !patient.telephone) return '#';
  const cleanPhone = formatPhoneForWhatsApp(patient.telephone);
  const message = buildWhatsAppReminderMessage({ patient, date, time, lang });
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Backwards compatibility helper for existing callers.
 */
export function generateWhatsAppReminderUrl(
  appointment: Appointment,
  patientOverride?: Patient,
  lang: 'fr' | 'ar' = 'fr'
): string {
  const patient = patientOverride || appointment.patient || appointment.patients;
  if (!patient || !patient.telephone) return '#';

  const date = appointment.appointment_date || appointment.date;
  const time = appointment.start_time || appointment.heure_debut || '10:00';

  return buildWhatsAppReminderUrl({
    patient,
    date,
    time,
    lang,
  });
}
