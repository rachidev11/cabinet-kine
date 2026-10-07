'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  CreditCard,
  Calendar,
  Briefcase,
  MapPin,
  Stethoscope,
  Shield,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  Copy,
} from 'lucide-react';
import { NewPatientInput, AssuranceType, Patient, CiviliteType } from '@/types/patient';
import { addPatientToSupabase } from '@/lib/supabase';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: (patient: Patient) => void;
  onOpenSqlModal?: () => void;
}

const ASSURANCE_OPTIONS: AssuranceType[] = [
  'AMO',
  'CNSS',
  'CNOPS',
  'Assurance Privée',
  'Aucune',
];

export default function AddPatientModal({
  isOpen,
  onClose,
  onPatientAdded,
  onOpenSqlModal,
}: AddPatientModalProps) {
  // Form state
  const [formData, setFormData] = useState<NewPatientInput>({
    civilite: 'Monsieur',
    nom: '',
    prenom: '',
    telephone: '',
    cin: '',
    age: 30,
    profession: '',
    adresse: '',
    medecin_traitant: '',
    assurance: 'CNSS',
    motif_consultation: '',
    antecedents: '',
    nombre_seances_prescrites: 10,
    nombre_seances_effectuees: 0,
    statut: 'Actif',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rlsNotice, setRlsNotice] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Validate form
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.nom.trim()) errors.nom = 'Le nom est obligatoire';
    if (!formData.prenom.trim()) errors.prenom = 'Le prénom est obligatoire';
    if (!formData.telephone.trim()) errors.telephone = 'Le numéro de téléphone est obligatoire';
    if (!formData.cin.trim()) errors.cin = 'Le CIN est obligatoire';
    if (!formData.age || Number(formData.age) <= 0) errors.age = 'L\'âge doit être supérieur à 0';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRlsNotice(false);

    if (!validate()) return;

    setLoading(true);

    try {
      // 1. Save directly to Supabase
      const res = await addPatientToSupabase({
        ...formData,
        civilite: formData.civilite || 'Monsieur',
        nom: formData.nom.toUpperCase().trim(),
        prenom: formData.prenom.trim(),
        cin: formData.cin.toUpperCase().trim(),
        telephone: formData.telephone.trim(),
        age: Number(formData.age),
        nombre_seances_prescrites: Number(formData.nombre_seances_prescrites || 10),
      });

      if (res.data) {
        // Direct success from Supabase
        onPatientAdded(res.data);
        handleResetAndClose();
      } else if (res.error) {
        if (res.error.isRlsError) {
          // RLS error: Table exists in Supabase, but Row-Level Security blocks anonymous insert
          setRlsNotice(true);
          setErrorMsg(
            "Supabase a bloqué l'insertion (Politique RLS activée). Le patient a été sauvegardé localement dans votre session."
          );

          // Fallback optimistic object
          const localPatient: Patient = {
            id: `temp-${Date.now()}`,
            ...formData,
            civilite: formData.civilite || 'Monsieur',
            nom: formData.nom.toUpperCase().trim(),
            cin: formData.cin.toUpperCase().trim(),
            created_at: new Date().toISOString(),
          };
          onPatientAdded(localPatient);
        } else {
          setErrorMsg(res.error.message || "Erreur lors de l'enregistrement dans Supabase");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setFormData({
      civilite: 'Monsieur',
      nom: '',
      prenom: '',
      telephone: '',
      cin: '',
      age: 30,
      profession: '',
      adresse: '',
      medecin_traitant: '',
      assurance: 'CNSS',
      motif_consultation: '',
      antecedents: '',
      nombre_seances_prescrites: 10,
      nombre_seances_effectuees: 0,
      statut: 'Actif',
      notes: '',
    });
    setValidationErrors({});
    setErrorMsg(null);
    setRlsNotice(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B57D0] via-[#0D47A1] to-[#0A387E] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Nouveau Dossier Patient</h2>
              <p className="text-xs text-blue-100">Enregistrement direct dans Supabase</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            aria-label="Fermer"
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Error / Alert notice */}
          {errorMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 ${
                rlsNotice
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{rlsNotice ? 'Notice Sécurité Supabase (RLS)' : 'Erreur'}</p>
                <p>{errorMsg}</p>
                {rlsNotice && onOpenSqlModal && (
                  <button
                    type="button"
                    onClick={onOpenSqlModal}
                    className="mt-2 text-xs font-semibold text-[#0B57D0] underline hover:text-[#0D47A1] cursor-pointer"
                  >
                    Voir le code SQL pour activer les droits d&apos;écriture (1-clic)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 1: Informations Personnelles (Obligatoires) */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#0B57D0]" />
              État Civil & Identité
            </h3>

            {/* Champ Civilité */}
            <div className="mb-4">
              <label htmlFor="civilite" className="block text-xs font-semibold text-slate-700 mb-1">
                Civilité <span className="text-rose-500">*</span>
              </label>
              <select
                id="civilite"
                name="civilite"
                value={formData.civilite || 'Monsieur'}
                onChange={(e) => setFormData({ ...formData, civilite: e.target.value as CiviliteType })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all font-medium text-slate-800 cursor-pointer"
              >
                <option value="Monsieur">Monsieur (Homme)</option>
                <option value="Madame">Madame (Femme mariée)</option>
                <option value="Mademoiselle">Mademoiselle (Jeune femme)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom de famille <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: EL AMRANI"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border ${
                    validationErrors.nom ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all`}
                />
                {validationErrors.nom && (
                  <p className="text-[11px] text-rose-500 mt-1">{validationErrors.nom}</p>
                )}
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prénom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Karim"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border ${
                    validationErrors.prenom ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all`}
                />
                {validationErrors.prenom && (
                  <p className="text-[11px] text-rose-500 mt-1">{validationErrors.prenom}</p>
                )}
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Numéro de Téléphone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="ex: 06 61 23 45 67"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-sm border ${
                      validationErrors.telephone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all`}
                  />
                </div>
                {validationErrors.telephone && (
                  <p className="text-[11px] text-rose-500 mt-1">{validationErrors.telephone}</p>
                )}
              </div>

              {/* CIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CIN (Carte d&apos;Identité Nationale) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="ex: BK654321"
                    value={formData.cin}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value.toUpperCase() })}
                    className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-sm border ${
                      validationErrors.cin ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] uppercase transition-all`}
                  />
                </div>
                {validationErrors.cin && (
                  <p className="text-[11px] text-rose-500 mt-1">{validationErrors.cin}</p>
                )}
              </div>

              {/* Âge */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Âge (Ans) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  placeholder="ex: 35"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                />
              </div>

              {/* Profession */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profession
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ex: Enseignant, Cadre, Artisan..."
                    value={formData.profession || ''}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ex: Hay Nassim Bensouda, Fès"
                  value={formData.adresse || ''}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Médical & Couverture Médicale */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#0B57D0]" />
              Couverture & Prise en Charge Médicale
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Médecin traitant */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Médecin traitant (Prescripteur)
                </label>
                <div className="relative">
                  <Stethoscope className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ex: Dr. Benjelloun (Traumatologue)"
                    value={formData.medecin_traitant || ''}
                    onChange={(e) => setFormData({ ...formData, medecin_traitant: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                  />
                </div>
              </div>

              {/* Assurance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organisme d&apos;Assurance <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.assurance}
                  onChange={(e) => setFormData({ ...formData, assurance: e.target.value as AssuranceType })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all font-medium text-slate-800"
                >
                  {ASSURANCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Motif de consultation / Pathologie */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motif de consultation / Diagnostic Kiné
                </label>
                <input
                  type="text"
                  placeholder="ex: Rééducation du genou droit suite rupture ligament croisé (post-op)"
                  value={formData.motif_consultation || ''}
                  onChange={(e) => setFormData({ ...formData, motif_consultation: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                />
              </div>

              {/* Nombre de séances prescrites */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Séances Prescrites
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.nombre_seances_prescrites || 10}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_seances_prescrites: parseInt(e.target.value) || 10 })
                  }
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                />
              </div>

              {/* Antécédents médicaux */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Antécédents médicaux / Chirurgicaux
                </label>
                <input
                  type="text"
                  placeholder="ex: HTA, Diabète, Chirurgie LCA..."
                  value={formData.antecedents || ''}
                  onChange={(e) => setFormData({ ...formData, antecedents: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleResetAndClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0B57D0] to-[#0D47A1] hover:brightness-110 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement dans Supabase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enregistrer le Patient</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
