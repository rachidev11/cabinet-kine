'use client';

import React, { forwardRef } from 'react';
import {
  MapPin,
  Phone,
  User,
  Activity,
  Calendar,
  Stethoscope,
  Target,
  Scale,
  Dumbbell,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Patient } from '@/types/patient';
import { MedicalRecord } from '@/types/medicalRecord';

interface BilanKineToPrintProps {
  patient: Patient;
  medicalRecord?: Partial<MedicalRecord> | null;
}

export const BilanKineToPrint = forwardRef<HTMLDivElement, BilanKineToPrintProps>(
  function BilanKineToPrint({ patient, medicalRecord = {} }, ref) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const bilanDateStr = medicalRecord?.date_bilan
      ? new Date(medicalRecord.date_bilan).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : formattedDate;

    const evaScore = Number(medicalRecord?.eva_douleur ?? 5);
    const getEvaAppreciation = (score: number) => {
      if (score === 0) return 'Douleur nulle (0/10)';
      if (score <= 3) return 'Douleur légère / supportable';
      if (score <= 6) return 'Douleur modérée';
      if (score <= 8) return 'Douleur vive & invalidante';
      return 'Douleur intolérable / maximale';
    };

    const civilite = patient.civilite || (patient.gender === 'F' ? 'Mme' : 'M.');
    const prescripteur =
      medicalRecord?.medecin_prescripteur ||
      patient.medecin_traitant ||
      'Médecin traitant / prescripteur';

    return (
      <div
        ref={ref}
        id="print-bilan-kine"
        style={{
          boxSizing: 'border-box',
          width: '100%',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
        }}
        className="bilan-print-container p-6 bg-white text-slate-900 text-xs"
      >
        {/* =========================================================
            1. EN-TÊTE OFFICIEL DU CENTRE DE KINÉSITHÉRAPIE
            ========================================================= */}
        <div className="border-b-2 border-[#0B57D0] pb-3 mb-3">
          <div className="flex items-start justify-between gap-4">
            {/* Logo & Identité du Cabinet */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img src="/logo.png" alt="Logo Cabinet" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-slate-900 uppercase leading-snug">
                  Centre de Kinésithérapie Nassim Al Massira
                </h1>
                <p className="text-xs font-extrabold text-[#0B57D0] tracking-wide uppercase">
                  Hassna El-Hmaidi — Kinésithérapeute
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Diplômée d&apos;État • Rééducation Fonctionnelle & Physiothérapie
                </p>
              </div>
            </div>

            {/* Badge BDK Officiel & Références */}
            <div className="text-right">
              <div className="inline-block bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg text-[#0B57D0]">
                <span className="text-[9px] font-bold uppercase tracking-wider block text-[#F05A28]">
                  Dossier Médical Confidentiel
                </span>
                <span className="text-xs font-black tracking-tight uppercase">
                  Bilan Kinésithérapique (BDK)
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Date d&apos;évaluation : <strong className="text-slate-800">{bilanDateStr}</strong>
              </p>
            </div>
          </div>

          {/* Coordonnées & Adresse Exacte */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-y-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0B57D0] shrink-0" />
              <span className="font-semibold text-slate-700">
                3 BLOC 4 HAY NASSIM BENSOUDA RDC FES, Fez, Morocco, 30000
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>+212 5 35 60 70 80 / +212 6 61 23 45 67</span>
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-mono text-[10px] text-slate-500">
                INPE: 108429381 | Patente: 34820194
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================
            2. INFORMATIONS PATIENT & MÉDECIN PRESCRIPTEUR
            ========================================================= */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Fiche Patient */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
            <div className="flex items-center gap-1.5 pb-1 mb-1.5 border-b border-slate-200">
              <User className="w-3.5 h-3.5 text-[#0B57D0]" />
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Identité du Patient
              </h2>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500 font-medium">Nom complet :</span>
                <span className="font-black text-slate-900">
                  {civilite} {patient.prenom} {patient.nom}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Âge & Genre :</span>
                <span className="font-semibold text-slate-800">
                  {patient.age} ans ({patient.gender === 'F' ? 'Femme' : 'Homme'})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">CIN :</span>
                <span className="font-mono font-semibold text-slate-800">
                  {patient.cin || 'Non renseigné'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Téléphone :</span>
                <span className="font-medium text-slate-800">{patient.telephone || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Assurance :</span>
                <span className="font-bold text-[#0B57D0]">{patient.assurance || 'Aucune'}</span>
              </div>
            </div>
          </div>

          {/* Fiche Prescription & Contexte Médical */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
            <div className="flex items-center gap-1.5 pb-1 mb-1.5 border-b border-slate-200">
              <Stethoscope className="w-3.5 h-3.5 text-[#0B57D0]" />
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Prescription & Prise en Charge
              </h2>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500 font-medium">Médecin Prescripteur :</span>
                <span className="font-bold text-slate-900">{prescripteur}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Séances prescrites :</span>
                <span className="font-bold text-slate-800">
                  {medicalRecord?.seances_prescrites || patient.nombre_seances_prescrites || 10} séances
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Séances réalisées :</span>
                <span className="font-semibold text-emerald-700">
                  {patient.nombre_seances_effectuees || 0} effectuée(s)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Date d&apos;évaluation :</span>
                <span className="font-medium text-slate-800">{bilanDateStr}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Statut du dossier :</span>
                <span className="font-semibold text-slate-800">{patient.statut || 'En cours'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            3. CORPS DU BILAN CLINIQUE
            ========================================================= */}
        <div className="space-y-2.5 mb-3">
          {/* Section 1 : Diagnostic Médical & Motif de Consultation */}
          <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
            <div className="flex items-center gap-2 pb-1.5 mb-1.5 border-b border-slate-100">
              <div className="w-4 h-4 rounded bg-[#0B57D0] text-white flex items-center justify-center font-bold text-[10px]">
                1
              </div>
              <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wide">
                Diagnostic Médical & Motif de Consultation
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Diagnostic Principal :
                </span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {medicalRecord?.diagnostic || patient.motif_consultation || 'Rééducation fonctionnelle'}
                </p>
              </div>
              {medicalRecord?.pathologie && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Pathologie / Précision anatomique :
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {medicalRecord.pathologie}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2 : Bilan de la Douleur (EVA) & Anamnèse */}
          <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#0B57D0] text-white flex items-center justify-center font-bold text-[10px]">
                  2
                </div>
                <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wide">
                  Bilan de la Douleur (Échelle EVA) & Anamnèse
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold text-[#0B57D0] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  EVA : {evaScore} / 10
                </span>
                <span className="text-[10px] text-slate-500 italic">
                  ({getEvaAppreciation(evaScore)})
                </span>
              </div>
            </div>

            {/* Jauge visuelle de la douleur */}
            <div className="mb-2 p-1.5 bg-slate-50 rounded border border-slate-200">
              <div className="flex justify-between text-[9px] font-semibold text-slate-500 mb-1">
                <span>0 (Aucune douleur)</span>
                <span className="font-bold text-slate-800">Niveau évalué : {evaScore}/10</span>
                <span>10 (Douleur insupportable)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, evaScore * 10))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Antécédents Médicaux & Chirurgicaux :
                </span>
                <p className="text-slate-800 mt-0.5 leading-relaxed bg-slate-50/50 p-1.5 rounded border border-slate-100">
                  {medicalRecord?.antecedents ||
                    patient.antecedents ||
                    'Aucun antécédent particulier déclaré lors de l\'anamnèse.'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Bilan Initial & Examen Clinique de Départ :
                </span>
                <p className="text-slate-800 mt-0.5 leading-relaxed bg-slate-50/50 p-1.5 rounded border border-slate-100">
                  {medicalRecord?.bilan_initial ||
                    'Évaluation posturale, inspection dynamique et palpation réalisées en début de prise en charge.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 : Bilan Articulaire & Musculaire */}
          <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
            <div className="flex items-center gap-2 pb-1.5 mb-1.5 border-b border-slate-100">
              <div className="w-4 h-4 rounded bg-[#0B57D0] text-white flex items-center justify-center font-bold text-[10px]">
                3
              </div>
              <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wide">
                Bilan Articulaire & Musculaire
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#0B57D0] mb-0.5">
                  <Scale className="w-3 h-3" />
                  <span>Bilan Articulaire & Goniométrie (Amplitudes)</span>
                </div>
                <p className="text-slate-800 leading-relaxed bg-slate-50/50 p-1.5 rounded border border-slate-100 min-h-[48px]">
                  {medicalRecord?.bilan_articulaire ||
                    'Amplitudes articulaires fonctionnelles testées en actif et passif. Raideur modérée en fin de course.'}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#0B57D0] mb-0.5">
                  <Dumbbell className="w-3 h-3" />
                  <span>Bilan Musculaire & Testing de Force</span>
                </div>
                <p className="text-slate-800 leading-relaxed bg-slate-50/50 p-1.5 rounded border border-slate-100 min-h-[48px]">
                  {medicalRecord?.bilan_musculaire ||
                    'Testing musculaire coté selon l\'échelle internationale (0-5). Déficit d\'endurance et amyotrophie relative.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 : Objectifs Thérapeutiques & Séances Préconisées */}
          <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
            <div className="flex items-center gap-2 pb-1.5 mb-1.5 border-b border-slate-100">
              <div className="w-4 h-4 rounded bg-[#0B57D0] text-white flex items-center justify-center font-bold text-[10px]">
                4
              </div>
              <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wide">
                Objectifs Thérapeutiques & Protocole Préconisé
              </h3>
            </div>

            <div className="text-xs space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Plan Thérapeutique & Objectifs de Rééducation :
                </span>
                <p className="text-slate-800 mt-0.5 leading-relaxed bg-blue-50/40 p-2 rounded border border-blue-100 font-medium">
                  {medicalRecord?.objectifs_reeducation ||
                    '1. Sédation des douleurs et prise en charge des contractures.\n2. Récupération des amplitudes articulaires complètes.\n3. Renforcement musculaire et travail proprioceptif dynamique.\n4. Réautonomisation du patient dans les gestes de la vie quotidienne.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-50 rounded border border-slate-200 text-slate-700">
                <span className="font-semibold">
                  Nombre de séances préconisées :{' '}
                  <strong className="text-slate-900">
                    {medicalRecord?.seances_prescrites || patient.nombre_seances_prescrites || 10} séances
                  </strong>
                </span>
                <span className="text-[11px] text-slate-600">
                  Rythme recommandé : <strong>2 à 3 séances par semaine</strong>
                </span>
              </div>

              {medicalRecord?.observations && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Observations & Recommandations complémentaires :
                  </span>
                  <p className="text-slate-700 mt-0.5 italic">
                    {medicalRecord.observations}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            4. PIED DE PAGE : DATE, CACHET ET SIGNATURE
            ========================================================= */}
        <div className="mt-3 pt-2.5 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-4 items-end">
            {/* Mention de délivrance */}
            <div className="space-y-1 text-[10px] text-slate-600 leading-tight">
              <p className="font-bold text-slate-800">
                Attestation du Kinésithérapeute :
              </p>
              <p className="font-medium text-slate-700">
                Document délivré pour faire valoir ce que de droit et transmis au médecin prescripteur.
              </p>
              <p className="text-slate-500">
                Bilan rédigé conformément au code de déontologie des professionnels de rééducation fonctionnelle.
              </p>
              <p className="text-[10px] text-slate-500 font-semibold pt-1">
                Fait à Fès, le {formattedDate}
              </p>
            </div>

            {/* Encart Cachet et Signature */}
            <div className="text-right flex flex-col items-end">
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                Cachet et Signature du Kinésithérapeute
              </p>
              <div className="w-52 h-24 border border-dashed border-slate-300 rounded-lg bg-slate-50/50 flex flex-col items-center justify-center p-2 relative shadow-2xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase">
                  Cachet & Signature
                </span>
                <span className="text-[10px] text-slate-400 italic">
                  Hassna El-Hmaidi
                </span>
                <span className="text-[9px] text-slate-400">
                  Kinésithérapeute Diplômée d&apos;État
                </span>
                <div className="absolute bottom-1 right-2 text-[8px] text-slate-400 font-mono">
                  Centre Nassim Al Massira • Fès
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bas de page récapitulatif */}
        <div className="mt-2.5 pt-1.5 border-t border-slate-100 text-center text-[9px] text-slate-400 flex items-center justify-between">
          <span>Centre de Kinésithérapie Nassim Al Massira • 3 BLOC 4 HAY NASSIM BENSOUDA RDC FES</span>
          <span>Bilan Kinésithérapique • Dossier Patient #{patient.id}</span>
        </div>
      </div>
    );
  }
);
