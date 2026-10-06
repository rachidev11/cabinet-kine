export type CiviliteType = 'Monsieur' | 'Madame' | 'Mademoiselle';

export type AssuranceType = 'AMO' | 'CNSS' | 'CNOPS' | 'Assurance Privée' | 'Aucune';

export type PatientStatus = 'Actif' | 'En attente' | 'Terminé' | 'Archivé';

export interface Patient {
  id: string | number;
  civilite?: CiviliteType;
  nom: string;
  prenom: string;
  telephone: string;
  cin: string;
  age: number;
  profession?: string | null;
  adresse?: string | null;
  medecin_traitant?: string | null;
  assurance: AssuranceType;
  antecedents?: string | null;
  motif_consultation?: string | null;
  nombre_seances_prescrites?: number | null;
  nombre_seances_effectuees?: number | null;
  statut?: PatientStatus | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type NewPatientInput = Omit<Patient, 'id' | 'created_at' | 'updated_at'>;

export interface KineKpis {
  totalPatients: number;
  activePatients: number;
  seancesAujourdhui: number;
  nouveauxCeMois: number;
}
