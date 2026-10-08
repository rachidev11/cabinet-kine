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
    documentTitle: `Recu_Paiement_${payment?.id || 'Centre_Nassim'}`,
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
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0B57D0] via-[#0D47A1] to-[#0A387E] text-white border-b border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 text-white border border-white/20 flex items-center justify-center shadow-sm">
              <Receipt className="w-5 h-5 text-[#FF7A45]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Aperçu du Reçu de Paiement
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  Format A4
                </span>
              </h2>
              <p className="text-xs text-blue-100/80">
                Centre Nassim Al Massira • Prêt pour l&apos;impression directe
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (handlePrint) {
                  handlePrint();
                } else if (typeof window !== 'undefined') {
                  window.print();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F05A28] hover:bg-[#FF7A45] text-white text-sm font-semibold shadow-md shadow-orange-950/20 hover:shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Reçu</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
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
            <Printer className="w-3.5 h-3.5 text-[#0B57D0]" />
            Format A4 compact et professionnel prêt à l&apos;impression.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                if (handlePrint) {
                  handlePrint();
                } else if (typeof window !== 'undefined') {
                  window.print();
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#0B57D0] to-[#0D47A1] hover:brightness-110 text-white text-sm font-semibold shadow-sm shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Reçu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
