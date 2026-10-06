# Cabinet KinéSanté - Nassim Kinésithérapie & Rééducation Fonctionnelle

Application web moderne et réactive conçue pour la gestion complète d'un cabinet de kinésithérapie, physiothérapie et rééducation fonctionnelle au Maroc.

Développée avec **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Lucide Icons** et connectée directement à **Supabase**.

---

## 🌟 Fonctionnalités Principales

### 1. Tableau de Bord (Dashboard)
- **Indicateurs Clés (KPIs)** :
  - Total des patients & dossiers actifs.
  - Nombre de séances planifiées aujourd'hui.
  - Séances de kinésithérapie réalisées.
  - Protocoles de rééducation complétés.
- **Planning des séances du jour** : affichage en direct des rendez-vous et des salles (mécanothérapie, massage décontracturant, rééducation à la marche, proprioception).
- **Dossiers récents** : aperçu rapide des derniers patients avec jauge de progression des séances.
- **Répartition des assurances** : statistiques visuelles des mutuelles (AMO, CNSS, CNOPS, Assurance Privée, Aucune).

### 2. Gestion des Patients
- **Tableau réactif complet** :
  - Nom, Prénom, Âge, Profession.
  - CIN (Carte d'Identité Nationale).
  - Numéro de téléphone avec liens directs pour appel téléphonique et message **WhatsApp**.
  - Médecin traitant prescripteur.
  - Badge coloré d'assurance (AMO, CNSS, CNOPS, Assurance Privée, Aucune).
  - Barre de progression des séances prescrites vs effectuées (ex: 8/20 séances).
  - Bouton d'incrémentation rapide (+1 séance validée).
- **Recherche instantanée en direct** : filtrage temps réel par Nom, Prénom, Téléphone, ou CIN.
- **Filtres avancés** : filtrage par organisme d'assurance et par statut (Actif / Terminé).
- **Double affichage** : basculez entre le mode **Tableau détaillé** et le mode **Cartes mobiles tactiles**.

### 3. Fiche Patient Détaillée (Modal)
- Consultation du dossier médical complet.
- Antécédents médicaux et chirurgicaux.
- Motif de consultation et diagnostic kinésithérapique.
- Actions directes de communication (Appel / WhatsApp).
- Validation de séance (+1) et suppression de dossier.

### 4. Ajout de Patient & Sauvegarde Supabase
- **Formulaire modal complet** avec validation en direct :
  - `Nom` *(Obligatoire)*
  - `Prénom` *(Obligatoire)*
  - `Téléphone` *(Obligatoire)*
  - `CIN` *(Obligatoire)*
  - `Âge` *(Obligatoire)*
  - `Profession`
  - `Adresse`
  - `Médecin traitant`
  - `Assurance` : AMO / CNSS / CNOPS / Assurance Privée / Aucune
  - `Motif de consultation / Diagnostic`
  - `Séances prescrites`
  - `Antécédents médicaux`
- Sauvegarde directe dans la table `patients` de Supabase.
- Notification Toast de succès et rafraîchissement immédiat de la liste.

---

## 🗄️ Configuration Supabase

Le fichier `.env.local` est déjà configuré à la racine du projet :

```env
NEXT_PUBLIC_SUPABASE_URL=https://fbfbzsererucogvqmozy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_bYhozgDk0ABZWJLJvYe1fg_m5cHiB5K
```

### Script SQL pour Supabase

Si votre table `patients` nécessite la création des colonnes ou la désactivation du blocage RLS (Row Level Security), copiez-collez ce script dans votre [Supabase Dashboard](https://supabase.com/dashboard) > **SQL Editor** :

```sql
-- Création de la table patients (si nécessaire)
CREATE TABLE IF NOT EXISTS public.patients (
    id BIGSERIAL PRIMARY KEY,
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

-- Autoriser la lecture et l'écriture publique sans blocage RLS :
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
```

---

## 🚀 Démarrage Local

Pour lancer l'application en développement :

```bash
npm run dev
```

L'application est disponible sur : [http://localhost:3000](http://localhost:3000)

Pour générer le build de production :

```bash
npm run build
npm start
```
