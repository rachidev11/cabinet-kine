-- =====================================================================
-- SCHEMA DE BASE DE DONNÉES SUPABASE - CABINET DE KINÉSITHÉRAPIE NASSIM
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

-- 5. Désactivation RLS pour un accès complet direct
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
