export interface MedicalRecord {
  id?: string | number;
  patient_id: string | number;
  diagnostic: string;
  pathologie?: string | null;
  medecin_prescripteur: string;
  seances_prescrites: number;
  seances_effectuees?: number;
  objectifs_reeducation: string;
  bilan_initial: string;
  bilan_articulaire?: string | null;
  bilan_musculaire?: string | null;
  eva_douleur?: number | null;
  antecedents?: string | null;
  observations?: string | null;
  date_bilan?: string;
  created_at?: string;
  updated_at?: string;
}

export type NewMedicalRecordInput = Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>;
