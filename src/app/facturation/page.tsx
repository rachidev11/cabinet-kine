'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCard,
  TrendingUp,
  CalendarCheck,
  Plus,
  X,
  Search,
  Banknote,
  ArrowUpDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Wallet,
  ChevronDown,
  Printer,
  Lock,
} from 'lucide-react';
import { Patient } from '@/types/patient';
import { Payment, PaymentMethod, PAYMENT_METHOD_MAP, NewPaymentInput } from '@/types/payment';
import {
  getPatientsFromSupabase,
  getPaymentsFromSupabase,
  addPaymentToSupabase,
  getPaymentKpis,
} from '@/lib/supabase';
import PaymentReceiptModal from '@/components/PaymentReceiptModal';
import { ReceiptToPrint } from '@/components/ReceiptToPrint';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '@/context/AuthContext';

// =====================================================================
// KPI CARD
// =====================================================================
function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
  gradient,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  suffix?: string;
  gradient: string;
  iconBg: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
      <div className={`absolute inset-0 opacity-[0.03] ${gradient}`} />
      <div className="relative p-5 flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} shadow-sm transition-transform group-hover:scale-105`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {value}
            {suffix && (
              <span className="text-base font-semibold text-slate-500 ml-1">{suffix}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// NEW PAYMENT MODAL
// =====================================================================
function NewPaymentModal({
  isOpen,
  onClose,
  patients,
  onPaymentAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onPaymentAdded: () => void;
}) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [sessionsCovered, setSessionsCovered] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(
    null
  );

  const filteredPatients = patients.filter((p) => {
    const q = patientSearch.toLowerCase();
    return (
      p.nom.toLowerCase().includes(q) ||
      p.prenom.toLowerCase().includes(q) ||
      p.telephone.includes(q)
    );
  });

  const selectedPatient = patients.find((p) => String(p.id) === selectedPatientId);

  const resetForm = () => {
    setSelectedPatientId('');
    setAmount('');
    setMethod('cash');
    setSessionsCovered('1');
    setNotes('');
    setPatientSearch('');
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatientId || selectedPatientId === '') {
      setFeedback({ type: 'error', msg: 'Veuillez sélectionner un patient avant de valider le paiement.' });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setFeedback({ type: 'error', msg: 'Veuillez saisir un montant valide.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const payload: NewPaymentInput = {
      patient_id: selectedPatientId,
      amount: parseFloat(amount),
      method,
      payment_type: `${sessionsCovered} séance(s)`,
      notes: notes || null,
    };

    const res = await addPaymentToSupabase(payload);

    if (res.error) {
      setFeedback({ type: 'error', msg: res.error.message });
    } else {
      setFeedback({ type: 'success', msg: 'Paiement enregistré avec succès !' });
      onPaymentAdded();
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1200);
    }

    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => {
          resetForm();
          onClose();
        }}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/40 bg-gradient-to-r from-[#0B57D0] via-[#0D47A1] to-[#0A387E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[#FF7A45]" />
            </div>
            <h2 className="text-lg font-bold text-white">Nouveau Paiement</h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Patient <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-left hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all cursor-pointer"
              >
                <span className={selectedPatient ? 'text-slate-900' : 'text-slate-400'}>
                  {selectedPatient
                    ? `${selectedPatient.prenom} ${selectedPatient.nom}`
                    : 'Sélectionner un patient...'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl max-h-52 overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom ou téléphone..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredPatients.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-slate-400 text-center">
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
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer ${
                            String(p.id) === selectedPatientId ? 'bg-blue-50 text-[#0B57D0] font-bold' : 'text-slate-700'
                          }`}
                        >
                          <span className="font-medium">
                            {p.prenom} {p.nom}
                          </span>
                          <span className="text-xs text-slate-400">{p.telephone}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Montant (DH) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Banknote className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                DH
              </span>
            </div>
          </div>

          {/* Method & Sessions Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mode de paiement
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all cursor-pointer"
              >
                <option value="cash">💵 Espèces</option>
                <option value="cheque">📝 Chèque</option>
                <option value="card">💳 Carte</option>
                <option value="transfer">🏦 Virement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Séances payées
              </label>
              <select
                value={sessionsCovered}
                onChange={(e) => setSessionsCovered(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} séance{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Notes <span className="text-slate-400 text-xs font-normal">(optionnel)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Remarques ou détails supplémentaires..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all resize-none"
            />
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              {feedback.msg}
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
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedPatientId || !amount}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0B57D0] to-[#0D47A1] hover:brightness-110 text-white text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// MAIN PAGE
// =====================================================================
export default function FacturationPage() {
  const { isKine } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [kpis, setKpis] = useState({ totalMois: 0, totalAujourdhui: 0, totalSeancesReglees: 0 });

  const printReceiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printReceiptRef,
    documentTitle: `Recu_Paiement_${receiptPayment?.id || 'Centre_Nassim'}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [paymentsRes, patientsRes, kpiData] = await Promise.all([
      getPaymentsFromSupabase(),
      getPatientsFromSupabase(),
      getPaymentKpis(),
    ]);

    if (paymentsRes.data) setPayments(paymentsRes.data);
    if (patientsRes.data) setPatients(patientsRes.data);
    setKpis(kpiData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter payments by search
  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const patientName = p.patient
      ? `${p.patient.prenom} ${p.patient.nom}`.toLowerCase()
      : '';
    return (
      patientName.includes(q) ||
      String(p.amount).includes(q) ||
      (PAYMENT_METHOD_MAP[p.method] || p.method).toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getMethodBadge = (method: PaymentMethod) => {
    const map: Record<string, { label: string; class: string; icon: string }> = {
      cash: {
        label: 'Espèces',
        class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: '💵',
      },
      cheque: {
        label: 'Chèque',
        class: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: '📝',
      },
      check: {
        label: 'Chèque',
        class: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: '📝',
      },
      card: {
        label: 'Carte',
        class: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: '💳',
      },
      transfer: {
        label: 'Virement',
        class: 'bg-violet-50 text-violet-700 border-violet-200',
        icon: '🏦',
      },
    };
    const info = map[method] || { label: method, class: 'bg-slate-100 text-slate-600 border-slate-200', icon: '💰' };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${info.class}`}
      >
        <span>{info.icon}</span>
        {info.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 print:space-y-0">
      <div className={`space-y-6 ${receiptPayment ? 'print:hidden' : ''}`}>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B57D0] to-[#0D47A1] flex items-center justify-center shadow-sm">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              Facturation & Règlements
            </h1>
            <p className="text-sm text-slate-500 mt-1 ml-[52px]">
              Suivi des paiements et encaissements
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B57D0] to-[#0D47A1] hover:brightness-110 text-white text-sm font-semibold shadow-sm shadow-blue-600/20 transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-[#FF7A45]" />
            Nouveau Paiement
          </button>
        </div>

        {/* KPI Cards */}
        {isKine ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon={TrendingUp}
              label="Total encaissé ce mois"
              value={formatCurrency(kpis.totalMois)}
              suffix="DH"
              gradient="bg-gradient-to-br from-[#0B57D0] to-[#0D47A1]"
              iconBg="bg-gradient-to-br from-[#0B57D0] to-[#0A387E]"
            />
            <KpiCard
              icon={CreditCard}
              label="Total encaissé aujourd'hui"
              value={formatCurrency(kpis.totalAujourdhui)}
              suffix="DH"
              gradient="bg-gradient-to-br from-blue-400 to-cyan-500"
              iconBg="bg-gradient-to-br from-blue-500 to-cyan-600"
            />
            <KpiCard
              icon={CalendarCheck}
              label="Séances réglées ce mois"
              value={String(kpis.totalSeancesReglees)}
              gradient="bg-gradient-to-br from-violet-400 to-purple-500"
              iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              icon={CreditCard}
              label="Caisse & Encaissements du jour"
              value={formatCurrency(kpis.totalAujourdhui)}
              suffix="DH"
              gradient="bg-gradient-to-br from-blue-400 to-cyan-500"
              iconBg="bg-gradient-to-br from-blue-500 to-cyan-600"
            />
            <div className="relative overflow-hidden rounded-2xl bg-slate-50 border border-dashed border-slate-200/90 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-200/70 flex items-center justify-center text-slate-500 shrink-0">
                <Lock className="w-5 h-5 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Statistiques & Chiffre d&apos;Affaires
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  Accès réservé à la Propriétaire (Hassna El-Hmaidi)
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Les bilans financiers globaux sont masqués pour le profil Assistante.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#0B57D0]" />
              Historique des Règlements
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
                {payments.length}
              </span>
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un paiement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
              />
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B57D0]" />
              <span className="ml-3 text-sm text-slate-500">Chargement des paiements...</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">Aucun paiement trouvé</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? 'Essayez une autre recherche'
                  : 'Cliquez sur "Nouveau Paiement" pour commencer'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <div className="flex items-center gap-1">
                        Patient
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Date
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Montant
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Mode
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Séances
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Notes
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B57D0] to-[#0D47A1] flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                            {payment.patient
                              ? `${payment.patient.prenom?.[0] || ''}${payment.patient.nom?.[0] || ''}`
                              : '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">
                              {payment.patient
                                ? `${payment.patient.prenom} ${payment.patient.nom}`
                                : `Patient #${payment.patient_id}`}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {payment.patient?.telephone || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-700">{formatDate(payment.created_at)}</p>
                        <p className="text-xs text-slate-400">{formatTime(payment.created_at)}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-base font-bold text-slate-900">
                          {formatCurrency(payment.amount)}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">DH</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {getMethodBadge(payment.method)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[#0B57D0] text-sm font-bold border border-blue-200">
                          {payment.payment_type
                            ? payment.payment_type.replace(/[^\d]/g, '') || '1'
                            : '1'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-slate-500 truncate max-w-[200px]">
                          {payment.notes || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setReceiptPayment(payment)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0B57D0] hover:text-[#0D47A1] text-xs font-semibold border border-blue-200/80 hover:border-blue-300 transition-all cursor-pointer shadow-xs active:scale-95 group"
                          title="Imprimer le reçu de paiement"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#0B57D0] group-hover:text-[#0D47A1] transition-colors" />
                          <span>Imprimer</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          {!loading && filteredPayments.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {filteredPayments.length} règlement{filteredPayments.length > 1 ? 's' : ''} affiché
                {filteredPayments.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                Total affiché :{' '}
                <span className="text-[#0B57D0] font-bold">
                  {formatCurrency(
                    filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                  )}{' '}
                  DH
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Payment Modal */}
      <div className="print:hidden">
        <NewPaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          patients={patients}
          onPaymentAdded={loadData}
        />
      </div>

      {/* Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
        patient={
          receiptPayment
            ? (patients.find((p) => String(p.id) === String(receiptPayment.patient_id)) || receiptPayment.patient)
            : null
        }
      />

      {/* Direct print container referenced by printReceiptRef */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
        {receiptPayment && (
          <ReceiptToPrint
            ref={printReceiptRef}
            payment={receiptPayment}
            patient={
              patients.find((p) => String(p.id) === String(receiptPayment.patient_id)) || receiptPayment.patient
            }
          />
        )}
      </div>
    </div>
  );
}
