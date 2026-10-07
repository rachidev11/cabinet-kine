-- =====================================================================
-- SCHEMA DE BASE DE DONNÉES SUPABASE - CENTRE DE KINÉSITHÉRAPIE NASSIM AL MASSIRA (HASSNA EL-HMAIDI)
-- =====================================================================

-- 1. Table des Patients
CREATE TABLE IF NOT EXISTS public.patients (
    id BIGSERIAL PRIMARY KEY,
    civilite VARCHAR(20) DEFAULT 'Monsieur',
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(30) NOT NULL,
    cin VARCHAR(30) NOT NULL,
    age INTEGER NOT NULL,
    profession VARCHAR(100),
    adresse TEXT,
    medecin_traitant VARCHAR(150),
    assurance VARCHAR(50) DEFAULT 'CNSS',
    antecedents TEXT,
    motif_consultation TEXT,
    nombre_seances_prescrites INTEGER DEFAULT 10,
    nombre_seances_effectuees INTEGER DEFAULT 0,
    statut VARCHAR(30) DEFAULT 'Actif',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS civilite VARCHAR(20) DEFAULT 'Monsieur';
CREATE INDEX IF NOT EXISTS idx_patients_nom ON public.patients(nom);
CREATE INDEX IF NOT EXISTS idx_patients_cin ON public.patients(cin);
CREATE INDEX IF NOT EXISTS idx_patients_telephone ON public.patients(telephone);

-- 2. Table des Dossiers Médicaux & Bilans Kiné (medical_records)
CREATE TABLE IF NOT EXISTS public.medical_records (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    diagnostic TEXT NOT NULL,
    pathologie TEXT,
    medecin_prescripteur VARCHAR(150),
    seances_prescrites INTEGER DEFAULT 10,
    seances_effectuees INTEGER DEFAULT 0,
    objectifs_reeducation TEXT,
    bilan_initial TEXT,
    bilan_articulaire TEXT,
    bilan_musculaire TEXT,
    eva_douleur INTEGER DEFAULT 0,
    antecedents TEXT,
    observations TEXT,
    date_bilan DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);

-- 3. Table des Rendez-vous (appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_number INTEGER DEFAULT 1,
    status VARCHAR(30) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);

-- Colonnes de compatibilité pour l'agenda des séances
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS heure_debut TIME;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS heure_fin TIME;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS box INTEGER;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS type_seance VARCHAR(150);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS statut VARCHAR(50);

-- 4. Table des Règlements (payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    method VARCHAR(50) DEFAULT 'Espèces',
    payment_type VARCHAR(50) DEFAULT 'Séance',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON public.payments(patient_id);

-- 5. Table des Profils Utilisateurs (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('kine', 'assistante')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 6. Politiques RLS permissives pour la table profiles
-- Permet la lecture à tous les utilisateurs authentifiés (et lecture publique) sans blocage
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture des profils autorisée" ON public.profiles;
CREATE POLICY "Lecture des profils autorisée"
    ON public.profiles
    FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Modification de son propre profil" ON public.profiles;
CREATE POLICY "Modification de son propre profil"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Création de profil" ON public.profiles;
CREATE POLICY "Création de profil"
    ON public.profiles
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- 7. Désactivation RLS sur les tables métier pour un accès direct
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
