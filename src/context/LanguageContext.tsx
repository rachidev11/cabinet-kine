'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 'fr' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface Translations {
  // Navigation
  dashboard: string;
  agenda: string;
  patients: string;
  facturation: string;
  statsRevenue: string;
  caisseJour: string;
  medicalRecord: string;
  supabaseDb: string;
  login: string;
  logout: string;
  mainNav: string;
  clinicalSpace: string;

  // Header & Brand
  clinicName: string;
  clinicSub: string;
  kineName: string;
  kineRole: string;
  assistantRole: string;
  connected: string;
  addPatient: string;
  quickAddPatient: string;
  refresh: string;
  changeProfile: string;

  // Gender & Civility
  gender: string;
  genderMale: string;
  genderFemale: string;
  genderRequired: string;
  civilite: string;
  mr: string;
  mrs: string;
  ms: string;

  // WhatsApp
  sendWhatsApp: string;
  whatsAppReminder: string;
  chooseLang: string;
  french: string;
  arabic: string;
  previewMessage: string;
  sendOnWhatsApp: string;
  close: string;
  cancel: string;
  confirm: string;
}

export const DICTIONARY: Record<Language, Translations> = {
  fr: {
    dashboard: 'Tableau de bord',
    agenda: 'Planning & Agenda',
    patients: 'Gestion des Patients',
    facturation: 'Facturation & Règlements',
    statsRevenue: "Statistiques & Chiffre d'affaires",
    caisseJour: "Encaissements du jour",
    medicalRecord: 'Dossier Médical & Bilan Kiné',
    supabaseDb: 'Base de Données Supabase',
    login: 'Connexion',
    logout: 'Changer de profil',
    mainNav: 'Navigation Principale',
    clinicalSpace: 'Espace Clinique & Soins',

    clinicName: 'Centre Nassim Al Massira',
    clinicSub: 'Kinésithérapie • Fès',
    kineName: 'Hassna El-Hmaidi',
    kineRole: 'Kinésithérapeute (Propriétaire)',
    assistantRole: 'Assistante Médicale',
    connected: 'Connecté',
    addPatient: 'Ajouter un Patient',
    quickAddPatient: 'Nouveau Patient',
    refresh: 'Rafraîchir',
    changeProfile: 'Changer de profil',

    gender: 'Genre / الجنس',
    genderMale: 'Homme / ذكر (M)',
    genderFemale: 'Femme / أنثى (F)',
    genderRequired: 'Veuillez sélectionner le genre',
    civilite: 'Civilité',
    mr: 'Monsieur',
    mrs: 'Madame',
    ms: 'Mademoiselle',

    sendWhatsApp: 'Rappel WhatsApp',
    whatsAppReminder: 'Rappel de rendez-vous WhatsApp',
    chooseLang: 'Choisir la langue du message',
    french: 'Français',
    arabic: 'العربية',
    previewMessage: 'Aperçu du message à envoyer',
    sendOnWhatsApp: 'Envoyer sur WhatsApp',
    close: 'Fermer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    agenda: 'المواعيد والجدول',
    patients: 'سجل المرضى',
    facturation: 'الفواتير والتحصيل',
    statsRevenue: 'الإحصائيات ورقم المعاملات',
    caisseJour: 'مداخيل وصندوق اليوم',
    medicalRecord: 'الملف الطبي والتقييم Kiné',
    supabaseDb: 'قاعدة بيانات سوبابيز',
    login: 'الدخول',
    logout: 'تسجيل الخروج',
    mainNav: 'القائمة الرئيسية',
    clinicalSpace: 'الفضاء الطبي والسريري',

    clinicName: 'مركز نسيم المسيرة',
    clinicSub: 'ترويض طبي • فاس',
    kineName: 'حسناء الحمايدي',
    kineRole: 'أخصائية الترويض الطبي (المسؤولة)',
    assistantRole: 'مساعدة الاستقبال',
    connected: 'متصل',
    addPatient: 'إضافة مريض',
    quickAddPatient: 'مريض جديد',
    refresh: 'تحديث',
    changeProfile: 'تبديل الحساب',

    gender: 'الجنس / Genre',
    genderMale: 'ذكر / Homme (M)',
    genderFemale: 'أنثى / Femme (F)',
    genderRequired: 'المرجو اختيار الجنس',
    civilite: 'اللقب',
    mr: 'سيد (Monsieur)',
    mrs: 'سيدة (Madame)',
    ms: 'آنسة (Mademoiselle)',

    sendWhatsApp: 'تذكير واتساب',
    whatsAppReminder: 'تذكير بالموعد عبر واتساب',
    chooseLang: 'اختر لغة الرسالة',
    french: 'الفرنسية (Français)',
    arabic: 'العربية (العربية)',
    previewMessage: 'معاينة نص الرسالة',
    sendOnWhatsApp: 'فتح وإرسال عبر واتساب',
    close: 'إغلاق',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
  },
};

interface LanguageContextType {
  language: Language;
  dir: Direction;
  isArabic: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    const saved = localStorage.getItem('cabinet_kine_lang') as Language | null;
    if (saved === 'fr' || saved === 'ar') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('cabinet_kine_lang', lang);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      if (lang === 'ar') {
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
      }
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'fr' ? 'ar' : 'fr');
  }, [language, setLanguage]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      if (language === 'ar') {
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
      }
    }
  }, [language]);

  const t = useCallback(
    (key: keyof Translations): string => {
      return DICTIONARY[language][key] || DICTIONARY['fr'][key] || key;
    },
    [language]
  );

  const value: LanguageContextType = {
    language,
    dir: language === 'ar' ? 'rtl' : 'ltr',
    isArabic: language === 'ar',
    setLanguage,
    toggleLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
