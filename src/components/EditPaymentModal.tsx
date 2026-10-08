'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Receipt,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Payment, PaymentMethod } from '@/types/payment';
import { updatePaymentInSupabase, deletePaymentFromSupabase } from '@/lib/supabase';

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  onPaymentUpdated: (updated: Payment) => void;
  onPaymentDeleted?: (id: string | number) => void;
}

export default function EditPaymentModal({
  isOpen,
  onClose,
  payment,
  onPaymentUpdated,
  onPaymentDeleted,
}: EditPaymentModalProps) {
  const [amount, setAmount] = useState<string>(String(payment.amount || ''));
  const [method, setMethod] = useState<PaymentMethod>(payment.method || 'cash');
  const [paymentType, setPaymentType] = useState<string>(payment.payment_type || '1 séance');
  const [notes, setNotes] = useState<string>(payment.notes || '');
  const [paymentDate, setPaymentDate] = useState<string>(
    payment.created_at ? payment.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
  );

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (payment) {
      setAmount(String(payment.amount || ''));
      setMethod(payment.method || 'cash');
      setPaymentType(payment.payment_type || '1 séance');
      setNotes(payment.notes || '');
      setPaymentDate(
        payment.created_at ? payment.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
      );
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [payment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Veuillez saisir un montant valide supérieur à 0.');
      return;
    }

    setLoading(true);

    try {
      const updates: Partial<Payment> = {
        amount: numAmount,
        method,
        payment_type: paymentType,
        notes: notes || null,
        created_at: `${paymentDate}T12:00:00.000Z`,
      };

      const res = await updatePaymentInSupabase(payment.id, updates);

      if (res.error) {
        setErrorMsg(res.error.message);
      } else {
        const updated: Payment = res.data || {
          ...payment,
          ...updates,
        };
        setSuccessMsg('Règlement rectifié avec succès !');
        onPaymentUpdated(updated);
        setTimeout(() => {
          onClose();
        }, 900);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de mise à jour';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Confirmez-vous la suppression de ce règlement passé ? Cette action est irréversible.')) {
      return;
    }

    setDeleting(true);
    setErrorMsg(null);

    try {
      const res = await deletePaymentFromSupabase(payment.id);
      if (res.error) {
        setErrorMsg(res.error.message);
      } else {
        if (onPaymentDeleted) {
          onPaymentDeleted(payment.id);
        }
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de suppression';
      setErrorMsg(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0B57D0] via-[#0D47A1] to-[#0A387E] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[#FF7A45]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Rectifier le Règlement #{payment.id}</h2>
              <p className="text-xs text-blue-100">
                Réservé à la Propriétaire (Hassna El-Hmaidi)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Patient info reminder */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Patient</span>
            <span className="text-slate-900 font-bold text-sm block mt-0.5">
              {payment.patient ? `${payment.patient.prenom} ${payment.patient.nom}` : `Patient #${payment.patient_id}`}
            </span>
          </div>

          {/* Montant (DH) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Montant Encaissé (DH) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Banknote className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                DH
              </span>
            </div>
          </div>

          {/* Mode & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mode de Paiement
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
              >
                <option value="cash">💵 Espèces</option>
                <option value="cheque">📝 Chèque</option>
                <option value="card">💳 Carte Bancaire</option>
                <option value="transfer">🏦 Virement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date du Règlement
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
              />
            </div>
          </div>

          {/* Prestation / Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Prestation / Séances Couvertes
            </label>
            <input
              type="text"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
              placeholder="ex: 1 séance, Forfait 10 séances..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes & Commentaires
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] resize-none"
              placeholder="Rectification de saisie..."
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1.5 p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? 'Suppression...' : 'Supprimer ce règlement'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || deleting}
                className="px-5 py-2 bg-[#0B57D0] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Enregistrer les rectifications</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
