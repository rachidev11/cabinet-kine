'use client';

import React, { forwardRef } from 'react';
import {
  Building2,
  Phone,
  MapPin,
  User,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Activity,
  Stethoscope,
  Dumbbell,
  Scale,
} from 'lucide-react';
import { Patient } from '@/types/patient';
import { MedicalRecord } from '@/types/medicalRecord';

interface BilanToPrintProps {
  patient: Patient | null;
  medicalRecord: MedicalRecord;
}

export const BilanToPrint = forwardRef<HTMLDivElement, BilanToPrintProps>(
  function BilanToPrint({ patient, medicalRecord }, ref) {
    if (!patient) return null;

    const civilite = patient.civilite || 'Monsieur';
    const patientNom = patient.nom || '—';
    const patientPrenom = patient.prenom || '';
    const patientCin = patient.cin || 'Non renseigné';
    const patientAssurance = patient.assurance || 'CNSS';
    const patientTelephone = patient.telephone || '—';
    const patientAge = patient.age ? `${patient.age} ans` : '—';
    const patientProfession = patient.profession || '—';

    const dateBilan = medicalRecord.date_bilan
      ? new Date(medicalRecord.date_bilan).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });

    const prescrites = medicalRecord.seances_prescrites || patient.nombre_seances_prescrites || 10;
    const effectuees = medicalRecord.seances_effectuees ?? patient.nombre_seances_effectuees ?? 0;
    const medecin = medicalRecord.medecin_prescripteur || patient.medecin_traitant || 'Médecin traitant';

    const eva = medicalRecord.eva_douleur ?? 5;

    return (
      <div
        ref={ref}
        id="print-bilan"
        style={{
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
          boxSizing: 'border-box',
          width: '100%',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        className="p-8 bg-white text-slate-800 text-xs"
      >
        {/* 1. EN-TÊTE OFFICIEL DU CENTRE */}
        <div className="border-b-2 border-[#0B57D0] pb-4 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                    Centre de Kinésithérapie Nassim Al Massira
                  </h1>
                  <p className="text-xs font-bold text-[#0B57D0] tracking-wide uppercase">
                    Hassna El-Hmaidi • Kinésithérapeute Diplômée d&apos;État • Rééducation
                  </p>
                </div>
              </div>

              <div className="pt-1.5 text-[11px] text-slate-600 space-y-0.5">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>3 BLOC 4 HAY NASSIM BENSOUDA RDC FES, Fez, Morocco, 30000</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Tél : +212 5 35 60 70 80 / +212 6 61 23 45 67</span>
                </p>
                <p className="text-[10px] text-slate-400 pt-0.5">
                  N° INPE : 108429381 • Patente : 34820194 • IF : 4829104
                </p>
              </div>
            </div>

            {/* Titre & Date du Document */}
            <div className="text-right flex flex-col items-end">
              <div className="bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl text-[#0B57D0] text-right">
                <span className="text-[9px] font-bold uppercase tracking-wider block text-[#F05A28]">
                  Dossier Médical Confidentiel
                </span>
                <span className="text-xs font-black tracking-tight block">
                  BILAN KINÉSITHÉRAPIQUE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Date du bilan : <strong className="text-slate-800">{dateBilan}</strong>
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Dossier #{patient.id}
              </p>
            </div>
          </div>
        </div>

        {/* 2. IDENTITÉ DU PATIENT & PRESCRIPTION */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Patient Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-200">
              <User className="w-3.5 h-3.5 text-[#0B57D0]" />
              <h2 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Identité du Patient
              </h2>
            </div>
            <div className="space-y-1 text-[11px]">
              <p>
                <span className="text-slate-500">Nom & Prénom : </span>
                <strong className="text-slate-900 font-bold">
                  {civilite} {patientNom} {patientPrenom}
                </strong>
              </p>
              <p>
                <span className="text-slate-500">CIN : </span>
                <strong className="text-slate-800 font-mono">{patientCin}</strong>
                <span className="text-slate-400 mx-2">•</span>
                <span className="text-slate-500">Âge : </span>
                <strong className="text-slate-800">{patientAge}</strong>
              </p>
              <p>
                <span className="text-slate-500">Tél : </span>
                <span className="text-slate-800">{patientTelephone}</span>
              </p>
              <p>
                <span className="text-slate-500">Couverture : </span>
                <span className="font-bold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px]">
                  {patientAssurance}
                </span>
              </p>
            </div>
          </div>

          {/* Prescription Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-200">
              <FileText className="w-3.5 h-3.5 text-[#0B57D0]" />
              <h2 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Prescription & Orientation
              </h2>
            </div>
            <div className="space-y-1 text-[11px]">
              <p>
                <span className="text-slate-500">Médecin prescripteur : </span>
                <strong className="text-slate-900">{medecin}</strong>
              </p>
              <p>
                <span className="text-slate-500">Diagnostic / Motif : </span>
                <strong className="text-slate-900">
                  {medicalRecord.diagnostic || patient.motif_consultation || 'Rééducation fonctionnelle'}
                </strong>
              </p>
              {medicalRecord.pathologie && (
                <p>
                  <span className="text-slate-500">Pathologie : </span>
                  <span className="text-slate-800">{medicalRecord.pathologie}</span>
                </p>
              )}
              <p>
                <span className="text-slate-500">Séances : </span>
                <strong className="text-[#0B57D0]">
                  {effectuees} séance(s) effectuée(s) sur {prescrites} prescrites
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* 3. BILAN CLINIQUE INITIAL & DOULEUR */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white mb-4 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#0B57D0]" />
              <h2 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Évaluation Clinique & Douleur (EVA)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-600">Échelle EVA :</span>
              <span className="font-black text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0B57D0]">
                {eva} / 10
              </span>
            </div>
          </div>

          {medicalRecord.bilan_initial && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Examen Clinique & Anamnèse :</p>
              <p className="text-[11px] text-slate-800 leading-relaxed mt-0.5">
                {medicalRecord.bilan_initial}
              </p>
            </div>
          )}

          {medicalRecord.antecedents && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Antécédents Notables :</p>
              <p className="text-[11px] text-slate-700 leading-relaxed mt-0.5">
                {medicalRecord.antecedents}
              </p>
            </div>
          )}
        </div>

        {/* 4. BILANS ARTICULAIRE ET MUSCULAIRE */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Scale className="w-3.5 h-3.5 text-[#0B57D0]" />
              <h3 className="font-bold text-[11px] text-slate-800 uppercase">
                Bilan Articulaire & Mobilités
              </h3>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed pt-1">
              {medicalRecord.bilan_articulaire || 'Mobilités articulaires conformes à l’âge et à la pathologie.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Dumbbell className="w-3.5 h-3.5 text-[#0B57D0]" />
              <h3 className="font-bold text-[11px] text-slate-800 uppercase">
                Bilan Musculaire & Testing
              </h3>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed pt-1">
              {medicalRecord.bilan_musculaire || 'Force musculaire évaluée et intégrée au protocole.'}
            </p>
          </div>
        </div>

        {/* 5. OBJECTIFS THÉRAPEUTIQUES & RECOMMANDATIONS */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-blue-50/40 mb-6 space-y-2">
          <div>
            <p className="text-[10px] font-bold text-[#0B57D0] uppercase">
              Objectifs Thérapeutiques & Protocole de Rééducation :
            </p>
            <p className="text-[11px] text-slate-800 leading-relaxed mt-0.5">
              {medicalRecord.objectifs_reeducation || 'Soulagement de la douleur, récupération des amplitudes et autonomie fonctionnelle.'}
            </p>
          </div>

          {medicalRecord.observations && (
            <div className="pt-1.5 border-t border-blue-100">
              <p className="text-[10px] font-bold text-[#0B57D0] uppercase">
                Observations & Recommandations Particulières :
              </p>
              <p className="text-[11px] text-slate-700 leading-relaxed mt-0.5">
                {medicalRecord.observations}
              </p>
            </div>
          )}
        </div>

        {/* 6. SIGNATURE, CACHET & MENTIONS LÉGALES */}
        <div className="pt-4 border-t border-slate-200 flex items-end justify-between">
          <div className="text-[10px] text-slate-400 space-y-0.5">
            <p className="flex items-center gap-1 text-[#0B57D0] font-semibold">
              <CheckCircle2 className="w-3 h-3 text-[#F05A28]" />
              Bilan établi conformément aux règles déontologiques de la kinésithérapie
            </p>
            <p>Fait à Fès, le {dateBilan}</p>
          </div>

          <div className="w-64 border border-dashed border-blue-300 rounded-xl p-3 bg-blue-50/20 text-center">
            <span className="text-[10px] font-bold text-[#0B57D0] block uppercase">
              Cachet & Signature de la Praticienne
            </span>
            <p className="text-[10px] text-slate-700 font-bold mt-1">
              Hassna El-Hmaidi
            </p>
            <p className="text-[9px] text-slate-500">
              Kinésithérapeute Diplômée d&apos;État • Fès
            </p>
            <div className="h-14 mt-1 flex items-center justify-center text-slate-300 text-[10px] italic">
              [Cachet & Signature]
            </div>
          </div>
        </div>
      </div>
    );
  }
);
