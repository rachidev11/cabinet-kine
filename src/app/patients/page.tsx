'use client';

import React, { useState, useMemo } from 'react';
import { usePatients } from '@/context/PatientContext';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  CreditCard,
  Building2,
  Calendar,
  Activity,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  X,
  MessageSquare,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  FolderOpen,
} from 'lucide-react';
import { Patient, AssuranceType } from '@/types/patient';
import PatientDetailsModal from '@/components/PatientDetailsModal';
import AddPatientModal from '@/components/AddPatientModal';
import { useAuth } from '@/context/AuthContext';

export default function PatientsPage() {
  const { isKine } = useAuth();
  const {
    patients,
    loading,
    isRefreshing,
    refreshPatients,
    createPatient,
    removePatient,
    incrementSeanceCount,
  } = usePatients();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssurance, setSelectedAssurance] = useState<string>('Tous');
  const [selectedStatus, setSelectedStatus] = useState<string>('Tous');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Filter patients based on search and dropdowns
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      // 1. Search Query (Nom, Prénom, Téléphone, CIN)
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        patient.nom.toLowerCase().includes(q) ||
        patient.prenom.toLowerCase().includes(q) ||
        patient.telephone.toLowerCase().includes(q) ||
        patient.cin.toLowerCase().includes(q) ||
        (patient.medecin_traitant && patient.medecin_traitant.toLowerCase().includes(q)) ||
        (patient.motif_consultation && patient.motif_consultation.toLowerCase().includes(q));

      // 2. Assurance Filter
      const matchAssurance =
        selectedAssurance === 'Tous' || patient.assurance === selectedAssurance;

      // 3. Status Filter
      const matchStatus =
        selectedStatus === 'Tous' ||
        (selectedStatus === 'Actif' && (patient.statut === 'Actif' || !patient.statut)) ||
        patient.statut === selectedStatus;

      return matchSearch && matchAssurance && matchStatus;
    });
  }, [patients, searchQuery, selectedAssurance, selectedStatus]);

  // Assurance badge helper
  const getAssuranceBadge = (assurance: AssuranceType) => {
    const map: Record<AssuranceType, string> = {
      AMO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      CNSS: 'bg-blue-50 text-blue-700 border-blue-200',
      CNOPS: 'bg-purple-50 text-purple-700 border-purple-200',
      'Assurance Privée': 'bg-amber-50 text-amber-700 border-amber-200',
      Aucune: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
          map[assurance] || 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
      >
        {assurance}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Gestion des Patients
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
              {patients.length} au total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Liste complète des dossiers patients synchronisés avec la base de données Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refreshPatients()}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-teal-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Synchroniser avec Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-teal-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Patient</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input (Nom, Prénom, Tél, CIN) */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Recherche instantanée par Nom, Prénom, Téléphone, ou CIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & View Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Assurance filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Assurance :</span>
              <select
                value={selectedAssurance}
                onChange={(e) => setSelectedAssurance(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="Tous">Toutes</option>
                <option value="AMO">AMO</option>
                <option value="CNSS">CNSS</option>
                <option value="CNOPS">CNOPS</option>
                <option value="Assurance Privée">Assurance Privée</option>
                <option value="Aucune">Aucune</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Statut :</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="Tous">Tous</option>
                <option value="Actif">Actif</option>
                <option value="Terminé">Terminé</option>
              </select>
            </div>

            {/* View Toggle (Table / Grid) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-teal-700 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Affichage en tableau"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-teal-700 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Affichage en cartes"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results count & active search tags */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            {filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''} trouvé
            {filteredPatients.length > 1 ? 's' : ''}
            {searchQuery && (
              <span>
                {' '}
                pour la recherche &laquo;<strong>{searchQuery}</strong>&raquo;
              </span>
            )}
          </span>

          {(searchQuery || selectedAssurance !== 'Tous' || selectedStatus !== 'Tous') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedAssurance('Tous');
                setSelectedStatus('Tous');
              }}
              className="text-xs text-teal-600 hover:text-teal-800 font-semibold cursor-pointer underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Patients Content (Table View or Cards View) */}
      {filteredPatients.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Aucun patient trouvé</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {searchQuery
              ? `Aucun résultat pour "${searchQuery}". Essayez un autre mot-clé ou vérifiez l'orthographe.`
              : 'Commencez par ajouter le premier patient dans votre cabinet de kinésithérapie.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un patient</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">CIN</th>
                  <th className="py-3.5 px-4">Téléphone</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Médecin Prescripteur</th>
                  <th className="py-3.5 px-4">Assurance</th>
                  <th className="py-3.5 px-4">Séances Kiné</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => {
                  const done = patient.nombre_seances_effectuees || 0;
                  const total = patient.nombre_seances_prescrites || 10;
                  const pct = Math.min(100, Math.round((done / total) * 100));

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-teal-50/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      {/* Name + Age + Profession */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/patients/${patient.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs hover:scale-105 transition-transform"
                            title="Voir dossier médical"
                          >
                            {patient.prenom[0]}
                            {patient.nom[0]}
                          </Link>
                          <div>
                            <div className="flex items-center gap-1.5">
                              {patient.civilite && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {patient.civilite === 'Monsieur' ? 'M.' : patient.civilite === 'Madame' ? 'Mme' : 'Mlle'}
                                </span>
                              )}
                              <Link
                                href={`/patients/${patient.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-slate-900 hover:text-teal-700 hover:underline transition-colors"
                              >
                                {patient.prenom} {patient.nom}
                              </Link>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {patient.age} ans
                              {patient.profession && ` • ${patient.profession}`}
                            </p>
                            {patient.motif_consultation && (
                              <p className="text-[10px] text-teal-700 truncate max-w-xs mt-0.5">
                                {patient.motif_consultation}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CIN */}
                      <td className="py-4 px-4 font-mono font-semibold text-slate-700">
                        <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs">
                          {patient.cin}
                        </span>
                      </td>

                      {/* Phone with quick call */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${patient.telephone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-slate-700 hover:text-teal-700 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{patient.telephone}</span>
                          </a>
                        </div>
                      </td>

                      {/* Prescribing doctor */}
                      <td className="py-4 px-4 hidden md:table-cell text-slate-600">
                        {patient.medecin_traitant || (
                          <span className="text-slate-400 italic">Non renseigné</span>
                        )}
                      </td>

                      {/* Insurance badge */}
                      <td className="py-4 px-4">{getAssuranceBadge(patient.assurance)}</td>

                      {/* Session progress */}
                      <td className="py-4 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>
                            {done} / {total}
                          </span>
                          <span className="text-[10px] text-teal-700 font-bold">{pct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 hidden lg:table-cell">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            patient.statut === 'Terminé'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-teal-50 text-teal-700'
                          }`}
                        >
                          {patient.statut || 'Actif'}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Voir Dossier (FolderOpen) */}
                          <Link
                            href={`/patients/${patient.id}`}
                            title="Voir le dossier médical complet"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-teal-600" />
                            <span className="hidden xl:inline">Voir Dossier</span>
                          </Link>

                          {/* Validate session (+1) */}
                          <button
                            onClick={() => incrementSeanceCount(patient)}
                            title="Valider une séance effectuée (+1)"
                            className="p-1.5 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          {/* View Full File */}
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            title="Voir le dossier complet"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete (Réservé au kinésithérapeute / Propriétaire) */}
                          {isKine && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Supprimer le dossier de ${patient.prenom} ${patient.nom} ?`
                                  )
                                ) {
                                  removePatient(patient.id);
                                }
                              }}
                              title="Supprimer définitivement (Propriétaire)"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View (Mobile-Friendly Responsive Grid) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const done = patient.nombre_seances_effectuees || 0;
            const total = patient.nombre_seances_prescrites || 10;
            const pct = Math.min(100, Math.round((done / total) * 100));

            return (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-4 cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/patients/${patient.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs hover:scale-105 transition-transform"
                      title="Voir dossier médical"
                    >
                      {patient.prenom[0]}
                      {patient.nom[0]}
                    </Link>
                    <div>
                      <div className="flex items-center gap-1.5">
                        {patient.civilite && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {patient.civilite === 'Monsieur' ? 'M.' : patient.civilite === 'Madame' ? 'Mme' : 'Mlle'}
                          </span>
                        )}
                        <Link
                          href={`/patients/${patient.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-slate-900 text-sm hover:text-teal-700 hover:underline transition-colors"
                        >
                          {patient.prenom} {patient.nom}
                        </Link>
                      </div>
                      <p className="text-xs text-slate-500">
                        {patient.age} ans • CIN: {patient.cin}
                      </p>
                    </div>
                  </div>
                  {getAssuranceBadge(patient.assurance)}
                </div>

                {patient.motif_consultation && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <p className="font-semibold text-slate-800 text-[11px] mb-0.5">
                      Diagnostic / Motif :
                    </p>
                    <p className="line-clamp-2">{patient.motif_consultation}</p>
                  </div>
                )}

                {/* Sessions progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Séances effectuées</span>
                    <span className="text-teal-700 font-bold">
                      {done}/{total} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Bottom details & quick communication */}
                <div
                  className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <a
                    href={`tel:${patient.telephone}`}
                    className="text-xs font-semibold text-slate-700 hover:text-teal-700 flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span>{patient.telephone}</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/patients/${patient.id}`}
                      className="px-2 py-1 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors inline-flex items-center gap-1"
                      title="Voir dossier médical"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-teal-600" />
                      <span>Dossier</span>
                    </Link>
                    <button
                      onClick={() => incrementSeanceCount(patient)}
                      className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                      title="Valider séance (+1)"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Voir fiche complète"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Details Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        isOpen={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        onIncrementSeance={incrementSeanceCount}
        onDelete={isKine ? removePatient : undefined}
      />

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPatientAdded={async (newPatient) => {
          await createPatient(newPatient);
        }}
      />
    </div>
  );
}
