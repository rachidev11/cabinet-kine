'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCard,
  TrendingUp,
  CalendarCheck,
  Plus,
  Search,
  Banknote,
  ArrowUpDown,
  Loader2,
  Receipt,
  Wallet,
  Printer,
  Pencil,
  ShieldAlert,
} from 'lucide-react';
import { Patient } from '@/types/patient';
import { Payment, PaymentMethod, PAYMENT_METHOD_MAP } from '@/types/payment';
import {
  getPatientsFromSupabase,
  getPaymentsFromSupabase,
  getPaymentKpis,
} from '@/lib/supabase';
import PaymentReceiptModal from '@/components/PaymentReceiptModal';
import NewPaymentModal from '@/components/NewPaymentModal';
import EditPaymentModal from '@/components/EditPaymentModal';
import { ReceiptToPrint } from '@/components/ReceiptToPrint';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '@/context/AuthContext';

// =====================================================================
// KPI CARD (Utilisé pour les statistiques financières de Hassna)
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
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
      <div className={`absolute inset-0 opacity-[0.03] ${gradient}`} />
      <div className="relative p-5 flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} shadow-xs transition-transform group-hover:scale-105`}
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
// PAGE FACTURATION & RÈGLEMENTS
// =====================================================================
export default function FacturationPage() {
  const { isKine, isOwner, profile, isAssistante } = useAuth();

  // Exclusivité stricte pour Hassna El-Hmaidi
  // Strictement fausse si l'Assistante est connectée
  const isHassnaOrKine = Boolean(
    !isAssistante &&
    (isKine ||
      isOwner ||
      profile?.role === 'kine' ||
      profile?.isOwner === true ||
      (profile?.name && profile.name.includes('Hassna')))
  );

  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
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

  // Filtre de recherche
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B57D0] to-[#0D47A1] flex items-center justify-center shadow-xs">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              Facturation & Règlements
            </h1>
            <p className="text-sm text-slate-500 mt-1 ml-[52px]">
              Suivi des encaissements des séances et édition des reçus
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B57D0] to-[#0D47A1] hover:brightness-110 text-white text-sm font-semibold shadow-xs shadow-blue-600/20 transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-[#FF7A45]" />
            Nouveau Paiement / Séance
          </button>
        </div>

        {/* Section KPI : TOTAUX GLOBAUX RÉSERVÉS STRICTEMENT À HASSNA EL-HMAIDI */}
        {isHassnaOrKine ? (
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
          /* Espace Accueil pour l'Assistante : STRICTEMENT AUCUN CHIFFRE D'AFFAIRES OU TOTAL GLOBAL */
          <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-slate-50 p-4 sm:p-5 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#0B57D0] text-white flex items-center justify-center font-bold shadow-xs">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  Espace Accueil & Encaissement des Séances
                </h3>
                <p className="text-xs text-slate-500">
                  Saisie du tarif séance du jour, enregistrement du montant reçu, reste à payer individuel et impression de reçu patient.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B57D0] text-white text-xs font-bold hover:bg-[#0D47A1] shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-[#FF7A45]" />
              <span>Encaisser une séance</span>
            </button>
          </div>
        )}

        {/* Payment Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
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
                placeholder="Rechercher par patient ou montant..."
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
                      Actions
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
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B57D0] to-[#0D47A1] flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0">
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
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setReceiptPayment(payment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0B57D0] hover:text-[#0D47A1] text-xs font-semibold border border-blue-200/80 hover:border-blue-300 transition-all cursor-pointer shadow-2xs active:scale-95 group"
                            title="Imprimer le reçu officiel de paiement"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#0B57D0] group-hover:text-[#0D47A1] transition-colors" />
                            <span>Imprimer Reçu</span>
                          </button>

                          {/* Bouton Rectifier réservé exclusivement à Hassna */}
                          {isHassnaOrKine && (
                            <button
                              type="button"
                              onClick={() => setPaymentToEdit(payment)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                              title="Rectifier ou supprimer ce règlement (Privilège Propriétaire)"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-500" />
                              <span>Rectifier</span>
                            </button>
                          )}
                        </div>
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
                {filteredPayments.length} règlement{filteredPayments.length > 1 ? 's' : ''} enregistré{filteredPayments.length > 1 ? 's' : ''}
              </p>
              {/* Le total chiffré global est STRICTEMENT masqué pour l'Assistante */}
              {isHassnaOrKine ? (
                <p className="text-xs font-semibold text-slate-600">
                  Total affiché :{' '}
                  <span className="text-[#0B57D0] font-bold">
                    {formatCurrency(
                      filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                    )}{' '}
                    DH
                  </span>
                </p>
              ) : (
                <p className="text-xs font-medium text-slate-500 italic">
                  Espace encaissements cabinet
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Payment Modal (avec saisie tarif séance, calcul reste à payer et impression directe) */}
      <div className="print:hidden">
        <NewPaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          patients={patients}
          onPaymentAdded={loadData}
          onPrintRequested={(p) => setReceiptPayment(p)}
        />
      </div>

      {/* Edit Payment Modal (Rectification réservée à Hassna) */}
      {paymentToEdit && isHassnaOrKine && (
        <EditPaymentModal
          isOpen={Boolean(paymentToEdit)}
          onClose={() => setPaymentToEdit(null)}
          payment={paymentToEdit}
          onPaymentUpdated={() => {
            loadData();
            setPaymentToEdit(null);
          }}
          onPaymentDeleted={() => {
            loadData();
            setPaymentToEdit(null);
          }}
        />
      )}

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
