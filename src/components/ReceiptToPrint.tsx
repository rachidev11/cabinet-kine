'use client';

import React, { forwardRef } from 'react';
import {
  Building2,
  Phone,
  MapPin,
  CreditCard,
  User,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Payment } from '@/types/payment';
import { Patient } from '@/types/patient';

interface ReceiptToPrintProps {
  payment: Payment;
  patient?: Patient | null;
}

/**
 * Convert numerical amounts into French written words for official Moroccan insurance receipts.
 */
function numberToFrenchWords(n: number): string {
  if (n === 0) return 'zéro';
  const units = [
    '',
    'un',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
    'onze',
    'douze',
    'treize',
    'quatorze',
    'quinze',
    'seize',
    'dix-sept',
    'dix-huit',
    'dix-neuf',
  ];
  const tens = [
    '',
    '',
    'vingt',
    'trente',
    'quarante',
    'cinquante',
    'soixante',
    'soixante',
    'quatre-vingt',
    'quatre-vingt',
  ];

  const convertGroup = (val: number): string => {
    let res = '';
    const h = Math.floor(val / 100);
    const rem = val % 100;
    if (h > 0) {
      if (h === 1) res += 'cent ';
      else res += units[h] + (rem === 0 ? ' cents ' : ' cent ');
    }
    if (rem > 0) {
      if (rem < 20) {
        res += units[rem];
      } else {
        const t = Math.floor(rem / 10);
        const u = rem % 10;
        if (t === 7) {
          res += 'soixante-' + (u === 1 ? 'et-onze' : units[10 + u]);
        } else if (t === 9) {
          res += 'quatre-vingt-' + units[10 + u];
        } else {
          res +=
            tens[t] +
            (u === 1 ? '-et-un' : u > 0 ? '-' + units[u] : t === 8 ? 's' : '');
        }
      }
    }
    return res.trim();
  };

  const integerPart = Math.floor(Math.abs(n));
  const decimalPart = Math.round((Math.abs(n) - integerPart) * 100);

  let result = '';
  if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000);
    const rest = integerPart % 1000;
    if (thousands === 1) {
      result += 'mille ';
    } else {
      result += convertGroup(thousands) + ' mille ';
    }
    if (rest > 0) {
      result += convertGroup(rest) + ' ';
    }
  } else {
    result += convertGroup(integerPart) + ' ';
  }

  result = result.trim() + ' Dirhams';
  if (decimalPart > 0) {
    result += ' et ' + convertGroup(decimalPart) + ' centimes';
  }
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export const ReceiptToPrint = forwardRef<HTMLDivElement, ReceiptToPrintProps>(
  function ReceiptToPrint({ payment, patient }, ref) {
    // Resolve patient details
    const currentPatient = patient || payment.patient;
    const civilite = currentPatient?.civilite || 'Monsieur';
    const patientNom = currentPatient?.nom || '—';
    const patientPrenom = currentPatient?.prenom || '';
    const patientCin = currentPatient?.cin || 'Non renseigné';
    const patientAssurance = currentPatient?.assurance || 'CNSS';
    const patientTelephone = currentPatient?.telephone || '—';

    // Format payment details
    const paymentDate = payment.created_at
      ? new Date(payment.created_at)
      : new Date();

    const formattedDate = paymentDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const formattedTime = paymentDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Extract receipt number
    const rawId = String(payment.id);
    const cleanId =
      rawId.replace(/\D/g, '').slice(-4) || rawId.slice(0, 4).toUpperCase();
    const receiptNumber = `REC-${paymentDate.getFullYear()}-${cleanId.padStart(4, '0')}`;

    // Method label
    const methodMap: Record<string, string> = {
      cash: 'Espèces',
      cheque: 'Chèque',
      check: 'Chèque',
      card: 'Carte Bancaire',
      transfer: 'Virement Bancaire',
    };
    const paymentMethodLabel = methodMap[payment.method] || payment.method;

    // Sessions count
    let sessionsCount = 1;
    if (payment.sessions_covered && payment.sessions_covered > 0) {
      sessionsCount = payment.sessions_covered;
    } else if (payment.payment_type) {
      const matched = payment.payment_type.match(/\d+/);
      if (matched) {
        sessionsCount = parseInt(matched[0], 10);
      }
    }

    // Currency formatting
    const amountDH = payment.amount || 0;
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountDH);

    const amountInWords = numberToFrenchWords(amountDH);

    return (
      <div
        ref={ref}
        id="print-receipt"
        style={{
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
          pageBreakAfter: 'avoid',
          breakAfter: 'avoid',
          boxSizing: 'border-box',
          width: '100%',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        className="receipt-print-container p-6 bg-white text-slate-800 text-xs"
      >
        {/* 1. EN-TÊTE DU CABINET */}
        <div className="border-b-2 border-teal-600 pb-3 mb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-base font-black tracking-tight text-slate-900 uppercase leading-snug">
                    Cabinet de Kinésithérapie Hassna El-Hmaidi
                  </h1>
                  <p className="text-[11px] font-semibold text-teal-700 tracking-wide uppercase">
                    Kinésithérapie • Rééducation Fonctionnelle • Physiothérapie
                  </p>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-600 space-y-0.5">
                <p className="flex items-center gap-1.5 leading-tight">
                  <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span>45 Boulevard Zerktouni, Résidence Al Manar, 2ème étage, Casablanca</span>
                </p>
                <p className="flex items-center gap-1.5 leading-tight">
                  <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span>Tél : +212 5 22 40 50 60 / +212 6 61 23 45 67</span>
                </p>
                <p className="text-[10px] text-slate-400 pt-0.5 leading-tight">
                  N° INPE : 108429381 • Patente : 34820194 • IF : 4829104
                </p>
              </div>
            </div>

            {/* Right Badge: Reçu de Paiement */}
            <div className="text-right flex flex-col items-end justify-between">
              <div className="inline-block bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg text-teal-800 text-right">
                <span className="text-[9px] font-bold uppercase tracking-wider block text-teal-600 leading-tight">
                  Document Officiel
                </span>
                <span className="text-xs font-extrabold tracking-tight leading-tight">
                  Reçu de Paiement & Honoraires
                </span>
              </div>

              <div className="mt-1.5 text-[11px] text-slate-600 space-y-0.5 text-right">
                <p className="leading-tight">
                  <span className="font-semibold text-slate-500">N° Reçu : </span>
                  <span className="font-mono font-bold text-slate-900">{receiptNumber}</span>
                </p>
                <p className="leading-tight">
                  <span className="font-semibold text-slate-500">Date : </span>
                  <span className="font-medium text-slate-900">{formattedDate}</span>
                  <span className="text-slate-400 text-[10px] ml-1">({formattedTime})</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. INFORMATIONS PATIENT & PRESTATION */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Patient Box */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
            <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-slate-200">
              <User className="w-3.5 h-3.5 text-teal-700" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Informations du Patient
              </h3>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500 font-medium">Nom complet :</span>
                <span className="font-bold text-slate-900 text-xs">
                  {civilite} {patientPrenom} {patientNom}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Civilité :</span>
                <span className="font-semibold text-slate-800">{civilite}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">N° CIN :</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                  {patientCin}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Assurance / Mutuelle :</span>
                <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-[11px]">
                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                  {patientAssurance}
                </span>
              </div>
              {patientTelephone && patientTelephone !== '—' && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Téléphone :</span>
                  <span className="text-slate-700 font-mono text-[11px]">{patientTelephone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Prestation Details */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-slate-200">
                <FileText className="w-3.5 h-3.5 text-teal-700" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Détails de la Prestation
                </h3>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500 font-medium">Praticien :</span>
                  <span className="font-semibold text-slate-900">Mme Hassna El-Hmaidi (Kinésithérapeute D.E.)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Type d&apos;acte :</span>
                  <span className="text-slate-800 font-medium">Rééducation Fonctionnelle</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Statut du règlement :</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Acquitté
                  </span>
                </div>
              </div>
            </div>

            {payment.notes && (
              <div className="mt-1 pt-1 border-t border-slate-200 text-[10px] text-slate-500 italic">
                <span className="font-medium text-slate-700 not-italic">Note : </span>
                {payment.notes}
              </div>
            )}
          </div>
        </div>

        {/* 3. DÉTAILS DU RÈGLEMENT (TABLEAU) */}
        <div className="mb-2.5 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="text-left px-3 py-1.5">Désignation des Prestations</th>
                <th className="text-center px-3 py-1.5">Séances Couvertes</th>
                <th className="text-center px-3 py-1.5">Mode de Paiement</th>
                <th className="text-right px-3 py-1.5">Montant Réglé (DH)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-white">
                <td className="px-3 py-1.5">
                  <p className="font-bold text-slate-900 text-xs leading-tight">
                    Séance(s) de rééducation kinésithérapique
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Soins et réadaptation fonctionnelle selon prescription médicale
                  </p>
                </td>
                <td className="px-3 py-1.5 text-center">
                  <span className="inline-block px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200 text-xs">
                    {sessionsCount} séance{sessionsCount > 1 ? 's' : ''}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-center">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs">
                    <CreditCard className="w-3 h-3 text-slate-500" />
                    {paymentMethodLabel}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right font-extrabold text-slate-900 text-xs sm:text-sm">
                  {formattedAmount} DH
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300">
                <td colSpan={3} className="px-3 py-1.5 text-right font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Montant Total Réglé :
                </td>
                <td className="px-3 py-1.5 text-right">
                  <span className="text-sm font-black text-teal-800">
                    {formattedAmount} DH
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Montant en toutes lettres */}
        <div className="mb-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="font-semibold text-slate-600">Arrêté le présent reçu à la somme de : </span>
          <span className="font-bold text-slate-900 italic underline decoration-teal-500 decoration-1 underline-offset-4">
            {amountInWords}
          </span>
          <span className="font-medium text-slate-500"> ({formattedAmount} DH TTC)</span>
        </div>

        {/* 4. PIED DE PAGE : ATTESTATION & CACHET / SIGNATURE */}
        <div className="mt-2.5 pt-2 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-3 items-end">
            {/* Attestation légale */}
            <div className="space-y-1 text-[10px] text-slate-500 leading-tight">
              <p className="font-semibold text-slate-700">
                Attestation de paiement d&apos;honoraires :
              </p>
              <p>
                Reçu certifié sincère et conforme, délivré à l&apos;assuré(e) pour servir et valoir ce que de droit,
                notamment auprès des organismes d&apos;assurance maladie et de prévoyance
                (CNSS, AMO, CNOPS, Assurances privées).
              </p>
              <p className="text-[9px] text-slate-400 pt-0.5">
                Fait à Casablanca, le {formattedDate}
              </p>
            </div>

            {/* Espace Signature & Cachet */}
            <div className="text-right flex flex-col items-end">
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Signature & Cachet du Praticien
              </p>
              <div className="w-48 h-20 border border-dashed border-slate-300 rounded-lg bg-slate-50/50 flex flex-col items-center justify-center p-2 relative">
                <span className="text-[10px] text-slate-400 font-medium">
                  Cadre réservé au cachet
                </span>
                <span className="text-[9px] text-slate-400 italic">
                  et à la signature
                </span>
                <div className="absolute bottom-1 right-2 text-[8px] text-slate-300 font-mono">
                  Cabinet Hassna El-Hmaidi
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document footnote */}
        <div className="mt-2 pt-1.5 border-t border-slate-100 text-center text-[9px] text-slate-400 flex items-center justify-between">
          <span>Cabinet de Kinésithérapie Hassna El-Hmaidi • Casablanca</span>
          <span>Reçu N° {receiptNumber} • Page 1/1</span>
        </div>
      </div>
    );
  }
);
