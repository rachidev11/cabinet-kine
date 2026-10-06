'use client';

import React, { useRef } from 'react';
import { X, Printer, Receipt } from 'lucide-react';
import { Payment } from '@/types/payment';
import { Patient } from '@/types/patient';
import { ReceiptToPrint } from '@/components/ReceiptToPrint';
import { useReactToPrint } from 'react-to-print';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  patient?: Patient | null;
}

export default function PaymentReceiptModal({
  isOpen,
  onClose,
  payment,
  patient,
}: PaymentReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Recu_Paiement_${payment?.id || 'Cabinet_Nassim'}`,
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

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Action Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Aperçu du Reçu de Paiement
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Format A4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Prêt pour l&apos;impression directe sans page blanche
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-sm font-semibold shadow-md shadow-teal-900/30 hover:shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le reçu</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Fermer la prévisualisation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Sheet Container */}
        <div className="p-4 sm:p-6 bg-slate-100/70 overflow-y-auto max-h-[82vh]">
          <div className="bg-white mx-auto rounded-xl border border-slate-200/90 shadow-md overflow-hidden">
            <ReceiptToPrint ref={printRef} payment={payment} patient={patient} />
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5 text-teal-600" />
            Impression cadrée sur 1 page A4 via react-to-print.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Fermer
            </button>
            <button
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-sm font-semibold shadow-sm shadow-teal-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le reçu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
