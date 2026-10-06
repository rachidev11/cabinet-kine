'use client';

import React, { useState } from 'react';
import {
  X,
  Database,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Server,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { supabaseUrl, supabaseAnonKey, supabase } from '@/lib/supabase';

interface SqlSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCRIPT = `-- 1. Table des patients
CREATE TABLE IF NOT EXISTS patients (
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

-- 2. Table des Dossiers Médicaux & Bilans Kiné (medical_records)
CREATE TABLE IF NOT EXISTS medical_records (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
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

-- 3. Accès sans restriction (RLS désactivé)
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records DISABLE ROW LEVEL SECURITY;
`;

export default function SqlSetupModal({ isOpen, onClose }: SqlSetupModalProps) {
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.from('patients').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.code === '42501') {
          setTestResult("⚠️ Table 'patients' détectée, mais RLS bloque l'accès public. Exécutez le script ci-dessous dans votre Supabase SQL Editor !");
        } else {
          setTestResult(`❌ Erreur Supabase (${error.code}) : ${error.message}`);
        }
      } else {
        setTestResult('✅ Connexion Supabase établie avec succès ! Accès en lecture validé.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      setTestResult(`❌ Échec de connexion : ${msg}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Configuration Supabase & Droits SQL</h2>
              <p className="text-xs text-slate-400">Paramètres de la base de données du cabinet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Connection Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <Server className="w-3.5 h-3.5 text-teal-600" />
                URL Supabase
              </span>
              <p className="font-mono text-xs text-slate-800 truncate" title={supabaseUrl}>
                {supabaseUrl}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                Clé Publique (Anon Key)
              </span>
              <p className="font-mono text-xs text-slate-800 truncate" title={supabaseAnonKey}>
                {supabaseAnonKey.slice(0, 16)}...{supabaseAnonKey.slice(-6)}
              </p>
            </div>
          </div>

          {/* Test connection button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80">
            <div>
              <p className="font-semibold text-teal-900">Tester la connexion Supabase</p>
              <p className="text-xs text-teal-700">Vérifie l&apos;accessibilité de la table &apos;patients&apos;</p>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Test en cours...' : 'Tester maintenant'}</span>
            </button>
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800">
              {testResult}
            </div>
          )}

          {/* SQL Instructions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-teal-600" />
                Script SQL pour activer les autorisations (RLS)
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier le script SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {SQL_SCRIPT}
              </pre>
            </div>

            <p className="text-xs text-slate-500">
              💡 <strong>Astuce :</strong> Rendez-vous sur votre tableau de bord Supabase &gt;
              sélectionnez <strong>SQL Editor</strong> &gt; collez le script ci-dessus et cliquez sur <strong>Run</strong> pour débloquer l&apos;écriture immédiate sans restriction de sécurité.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
