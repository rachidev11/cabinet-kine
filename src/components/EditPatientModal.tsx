'use client';

import React, { useState, useEffect } from 'react';
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
  Edit3,
} from 'lucide-react';
import { AssuranceType, Patient, CiviliteType, GenderType, PatientStatus } from '@/types/patient';
import { updatePatientInSupabase } from '@/lib/supabase';

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onPatientUpdated: (updated: Patient) => void;
}

const ASSURANCE_OPTIONS: AssuranceType[] = [
  'AMO',
  'CNSS',
  'CNOPS',
  'Assurance Privée',
  'Aucune',
];

const STATUS_OPTIONS: PatientStatus[] = [
  'Actif',
  'En attente',
  'Terminé',
  'Archivé',
];

export default function EditPatientModal({
  isOpen,
  onClose,
  patient,
  onPatientUpdated,
}: EditPatientModalProps) {
  const [formData, setFormData] = useState<Partial<Patient>>({
    civilite: patient.civilite || 'Monsieur',
    gender: patient.gender || 'M',
    nom: patient.nom || '',
    prenom: patient.prenom || '',
    telephone: patient.telephone || '',
    cin: patient.cin || '',
    age: patient.age || 30,
    profession: patient.profession || '',
    adresse: patient.adresse || '',
    medecin_traitant: patient.medecin_traitant || '',
    assurance: patient.assurance || 'CNSS',
    motif_consultation: patient.motif_consultation || '',
    antecedents: patient.antecedents || '',
    nombre_seances_prescrites: patient.nombre_seances_prescrites ?? 10,
    nombre_seances_effectuees: patient.nombre_seances_effectuees ?? 0,
    statut: patient.statut || 'Actif',
    notes: patient.notes || '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (patient) {
      setFormData({
        civilite: patient.civilite || 'Monsieur',
        gender: patient.gender || 'M',
        nom: patient.nom || '',
        prenom: patient.prenom || '',
        telephone: patient.telephone || '',
        cin: patient.cin || '',
        age: patient.age || 30,
        profession: patient.profession || '',
        adresse: patient.adresse || '',
        medecin_traitant: patient.medecin_traitant || '',
        assurance: patient.assurance || 'CNSS',
        motif_consultation: patient.motif_consultation || '',
        antecedents: patient.antecedents || '',
        nombre_seances_prescrites: patient.nombre_seances_prescrites ?? 10,
        nombre_seances_effectuees: patient.nombre_seances_effectuees ?? 0,
        statut: patient.statut || 'Actif',
        notes: patient.notes || '',
      });
      setErrorMsg(null);
      setSuccessMsg(null);
      setValidationErrors({});
    }
  }, [patient]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.nom?.trim()) errors.nom = 'Le nom est obligatoire';
    if (!formData.prenom?.trim()) errors.prenom = 'Le prénom est obligatoire';
    if (!formData.telephone?.trim()) errors.telephone = 'Le numéro de téléphone est obligatoire';
    if (!formData.cin?.trim()) errors.cin = 'Le CIN est obligatoire';
    if (!formData.age || Number(formData.age) <= 0) errors.age = 'L\'âge doit être supérieur à 0';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const updates: Partial<Patient> = {
        ...formData,
        age: Number(formData.age),
        nombre_seances_prescrites: Number(formData.nombre_seances_prescrites),
        nombre_seances_effectuees: Number(formData.nombre_seances_effectuees),
        updated_at: new Date().toISOString(),
      };

      const res = await updatePatientInSupabase(patient.id, updates);

      const updatedPatient: Patient = res.data || {
        ...patient,
        ...updates,
      };

      setSuccessMsg('Informations du patient mises à jour avec succès !');
      onPatientUpdated(updatedPatient);

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-[#0B57D0] via-[#0D47A1] to-[#0A387E] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Edit3 className="w-5 h-5 text-[#FF7A45]" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Modifier le Dossier Patient</h2>
              <p className="text-xs text-blue-100">
                {patient.prenom} {patient.nom} • Privilège Propriétaire Hassna El-Hmaidi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section: Identité */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0B57D0]" />
              Identité & Coordonnées
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Civilité</label>
                <select
                  value={formData.civilite}
                  onChange={(e) => {
                    const civ = e.target.value as CiviliteType;
                    const gender = civ === 'Madame' || civ === 'Mademoiselle' ? 'F' : 'M';
                    setFormData({ ...formData, civilite: civ, gender });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                >
                  <option value="Monsieur">Monsieur (M.)</option>
                  <option value="Madame">Madame (Mme)</option>
                  <option value="Mademoiselle">Mademoiselle (Mlle)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 transition-all ${
                    validationErrors.nom
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500/20'
                      : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-blue-500/20 focus:border-[#0B57D0]'
                  }`}
                  placeholder="ex: Benali"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prénom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 transition-all ${
                    validationErrors.prenom
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500/20'
                      : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-blue-500/20 focus:border-[#0B57D0]'
                  }`}
                  placeholder="ex: Youssef"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CIN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cin}
                  onChange={(e) => setFormData({ ...formData, cin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                  placeholder="ex: CD123456"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Téléphone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                  placeholder="06XXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Âge <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Profession</label>
                <input
                  type="text"
                  value={formData.profession || ''}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                  placeholder="ex: Enseignant, Cadre..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={formData.adresse || ''}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                  placeholder="ex: Al Massira, Fès"
                />
              </div>
            </div>
          </div>

          {/* Section: Prise en charge & Mutuelle */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#0B57D0]" />
              Assurance & Suivi des Séances
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mutuelle / Organisme</label>
                <select
                  value={formData.assurance}
                  onChange={(e) => setFormData({ ...formData, assurance: e.target.value as AssuranceType })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                >
                  {ASSURANCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Statut du Dossier</label>
                <select
                  value={formData.statut || 'Actif'}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value as PatientStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Médecin Traitant</label>
                <input
                  type="text"
                  value={formData.medecin_traitant || ''}
                  onChange={(e) => setFormData({ ...formData, medecin_traitant: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                  placeholder="ex: Dr. Benjelloun"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Séances Prescrites</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.nombre_seances_prescrites ?? 10}
                  onChange={(e) => setFormData({ ...formData, nombre_seances_prescrites: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Séances Effectuées</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.nombre_seances_effectuees ?? 0}
                  onChange={(e) => setFormData({ ...formData, nombre_seances_effectuees: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section: Motif & Antécédents */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#0B57D0]" />
              Données Cliniques & Notes
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Motif de consultation / Diagnostic</label>
              <input
                type="text"
                value={formData.motif_consultation || ''}
                onChange={(e) => setFormData({ ...formData, motif_consultation: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all"
                placeholder="ex: Lombalgie chronique L4-L5, Rééducation post-opératoire"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Antécédents médicaux</label>
              <textarea
                rows={2}
                value={formData.antecedents || ''}
                onChange={(e) => setFormData({ ...formData, antecedents: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all resize-none"
                placeholder="ex: Diabète type 2, hypertension, chirurgie méniscale..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes & Observations administratives</label>
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] transition-all resize-none"
                placeholder="Notes de suivi, recommandations..."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0B57D0] to-[#0D47A1] hover:brightness-110 text-white text-xs font-bold shadow-md shadow-blue-700/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Mettre à jour le dossier</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
