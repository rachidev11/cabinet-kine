import { Patient } from './patient';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'cheque' | 'check';

export type FrenchPaymentMethod = 'Espèces' | 'Carte' | 'Virement' | 'Chèque';

export interface Payment {
  id: string;
  patient_id: number | string;
  appointment_id?: string | null;
  amount: number;
  payment_type?: string | null;
  method: PaymentMethod;
  received_by?: string | null;
  sessions_covered?: number | null;
  notes?: string | null;
  created_at?: string;
  // Joined data
  patient?: Patient;
}

export interface NewPaymentInput {
  patient_id: number | string;
  amount: number;
  method: PaymentMethod;
  payment_type?: string | null;
  sessions_covered?: number | null;
  notes?: string | null;
}

export const PAYMENT_METHOD_MAP: Record<PaymentMethod, FrenchPaymentMethod> = {
  cash: 'Espèces',
  card: 'Carte',
  transfer: 'Virement',
  cheque: 'Chèque',
  check: 'Chèque',
};

export const FRENCH_TO_DB_PAYMENT_METHOD: Record<FrenchPaymentMethod, PaymentMethod> = {
  'Espèces': 'cash',
  'Carte': 'card',
  'Virement': 'transfer',
  'Chèque': 'cheque',
};
