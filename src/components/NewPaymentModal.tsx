'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Banknote,
  Receipt,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { Patient } from '@/types/patient';
import { Payment, PaymentMethod, NewPaymentInput } from '@/types/payment';
import { addPaymentToSupabase } from '@/lib/supabase';

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  initialPatientId?: string;
  onPaymentAdded: (createdPayment?: Payment) => void;
  onPrintRequested?: (payment: Payment) => void;
}

export default function NewPaymentModal({
  isOpen,
  onClose,
  patients,
  initialPatientId,
  onPaymentAdded,
  onPrintRequested,
}: NewPaymentModalProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [sessionRate, setSessionRate] = useState<string>('150');
  const [sessionsCovered, setSessionsCovered] = useState<string>('1');
  const [amount, setAmount] = useState<string>('150');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [createdPayment, setCreatedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  // Recalculate amount when sessionRate or sessionsCovered changes if user hasn't typed custom
  const handleRateOrSessionsChange = (newRate: string, newSessions: string) => {
    setSessionRate(newRate);
    setSessionsCovered(newSessions);
    const r = parseFloat(newRate) || 0;
    const s = parseInt(newSessions, 10) || 1;
    setAmount(String(r * s));
  };

  const filteredPatients = patients.filter((p) => {
    const q = patientSearch.toLowerCase();
    return (
      p.nom.toLowerCase().includes(q) ||
      p.prenom.toLowerCase().includes(q) ||
      p.telephone.includes(q) ||
      p.cin.toLowerCase().includes(q)
    );
  });

  const selectedPatient = patients.find((p) => String(p.id) === selectedPatientId);

  // Expected total & Remaining to pay
  const rateNum = parseFloat(sessionRate) || 0;
  const sessionsNum = parseInt(sessionsCovered, 10) || 1;
  const totalCost = rateNum * sessionsNum;
  const paidNum = parseFloat(amount) || 0;
  const resteAPayer = Math.max(0, totalCost - paidNum);

  const resetForm = () => {
    if (!initialPatientId) setSelectedPatientId('');
    setSessionRate('150');
    setSessionsCovered('1');
    setAmount('150');
    setMethod('cash');
    setNotes('');
    setPatientSearch('');
    setFeedback(null);
    setCreatedPayment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatientId) {
      setFeedback({ type: 'error', msg: 'Veuillez sélectionner un patient.' });
      return;
    }

    if (isNaN(paidNum) || paidNum <= 0) {
      setFeedback({ type: 'error', msg: 'Veuillez saisir un montant payé valide.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const fullNotes = resteAPayer > 0
      ? `${notes ? `${notes} • ` : ''}Tarif séance: ${sessionRate} DH. Reste dû: ${resteAPayer} DH.`
      : (notes || null);

    const payload: NewPaymentInput = {
      patient_id: selectedPatientId,
      amount: paidNum,
      method,
      payment_type: `${sessionsCovered} séance${sessionsNum > 1 ? 's' : ''} (${sessionRate} DH/s)`,
      notes: fullNotes,
    };

    const res = await addPaymentToSupabase(payload);

    if (res.error) {
      setFeedback({ type: 'error', msg: res.error.message });
      setSubmitting(false);
    } else {
      const paymentWithPatient: Payment = {
        ...res.data!,
        patient: selectedPatient,
      };
      setCreatedPayment(paymentWithPatient);
      setFeedback({
        type: 'success',
        msg: `Règlement de ${paidNum} DH enregistré avec succès !`,
      });
      onPaymentAdded(paymentWithPatient);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          resetForm();
          onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-[#0B57D0] via-[#0D47A1] to-[#0A387E] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Receipt className="w-5 h-5 text-[#FF7A45]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Encaisser une Séance / Forfait</h2>
              <p className="text-xs text-blue-100">
                Saisie du tarif, montant réglé & reste à payer
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>

        {/* If payment was just completed, show direct print action banner */}
        {createdPayment ? (
          <div className="p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Paiement Enregistré !</h3>
              <p className="text-xs text-slate-500 mt-1">
                Le reçu N° #{createdPayment.id} pour {selectedPatient?.prenom} {selectedPatient?.nom} est prêt.
              </p>
              {resteAPayer > 0 ? (
                <div className="mt-3 inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                  Reste à payer : {resteAPayer} DH
                </div>
              ) : (
                <div className="mt-3 inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  Prestation Soldée • 0 DH restant
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Fermer
              </button>
              {onPrintRequested && (
                <button
                  type="button"
                  onClick={() => {
                    onPrintRequested(createdPayment);
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0B57D0] hover:bg-[#0D47A1] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-700/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Imprimer le reçu patient</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
            {/* 1. Patient Selection (if not locked to initialPatientId) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Patient <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  disabled={Boolean(initialPatientId)}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm text-left transition-all ${
                    initialPatientId
                      ? 'bg-slate-100 border-slate-200 text-slate-900 cursor-default'
                      : 'bg-white border-slate-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] cursor-pointer'
                  }`}
                >
                  <span className={selectedPatient ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                    {selectedPatient
                      ? `${selectedPatient.prenom} ${selectedPatient.nom} (${selectedPatient.cin})`
                      : 'Rechercher ou sélectionner un patient...'}
                  </span>
                  {!initialPatientId && <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isDropdownOpen && !initialPatientId && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl max-h-56 overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Rechercher par nom, CIN, tél..."
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-50">
                      {filteredPatients.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-slate-400 text-center">
                          Aucun patient trouvé
                        </p>
                      ) : (
                        filteredPatients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatientId(String(p.id));
                              setIsDropdownOpen(false);
                              setPatientSearch('');
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer ${
                              String(p.id) === selectedPatientId ? 'bg-blue-50 text-[#0B57D0] font-bold' : 'text-slate-700'
                            }`}
                          >
                            <span className="font-semibold">
                              {p.prenom} {p.nom}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">{p.cin}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Tarification de la Séance & Nombre */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tarif séance (DH) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={sessionRate}
                    onChange={(e) => handleRateOrSessionsChange(e.target.value, sessionsCovered)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                    required
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                    DH
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre de séances
                </label>
                <select
                  value={sessionsCovered}
                  onChange={(e) => handleRateOrSessionsChange(sessionRate, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                >
                  {[1, 2, 3, 4, 5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} séance{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Montant Réglé Aujourd'hui & Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Montant payé (DH) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-emerald-300 bg-emerald-50/20 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-700">
                    DH
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mode de règlement
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                >
                  <option value="cash">💵 Espèces</option>
                  <option value="cheque">📝 Chèque</option>
                  <option value="card">💳 Carte</option>
                  <option value="transfer">🏦 Virement</option>
                </select>
              </div>
            </div>

            {/* 4. Encart Dynamique : Calcul & Reste à Payer Individuel */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>Total prestation ({sessionsCovered} séance{sessionsNum > 1 ? 's' : ''} à {sessionRate} DH) :</span>
                <span className="font-bold text-slate-900">{totalCost} DH</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Montant encaissé ce jour :</span>
                <span className="font-bold text-emerald-700">{paidNum} DH</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-slate-800">
                  <Calculator className="w-3.5 h-3.5 text-[#0B57D0]" />
                  Reste à payer :
                </span>
                {resteAPayer === 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                    0 DH • Soldé
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-300">
                    {resteAPayer} DH dû
                  </span>
                )}
              </div>
            </div>

            {/* 5. Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Commentaires / Référence reçu <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ex: Règlement séance 3, Chèque N°..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
              />
            </div>

            {/* Feedback alert */}
            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.msg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedPatientId || paidNum <= 0}
                className="px-5 py-2.5 bg-gradient-to-r from-[#0B57D0] to-[#0D47A1] hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-700/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                )}
                <span>Valider le règlement</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
