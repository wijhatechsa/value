import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

type Lang = 'ar' | 'en';

type Dict = Record<string, string>;

const ar: Dict = {
  'title.propertyDetails': 'تفاصيل الطلب',
  'tabs.details': 'تفاصيل العقار',
  'tabs.inspection': 'المعاينة',
  'tabs.appraisal': 'التقييم',
  'tabs.review': 'المراجعة',
  'tabs.delivery': 'التسليم',
  'steps.intake': 'الاستلام',
  'steps.inspection': 'المعاينة',
  'steps.appraisal': 'التقييم',
  'steps.review': 'المراجعة',
  'steps.delivery': 'التسليم',
  'property.type.residential': 'سكني',
  'property.type.commercial': 'تجاري',
  'property.type.industrial': 'صناعي',
  'property.type.land': 'أرض',
};

const en: Dict = {
  'title.propertyDetails': 'Request Details',
  'tabs.details': 'Property Details',
  'tabs.inspection': 'Inspection',
  'tabs.appraisal': 'Appraisal',
  'tabs.review': 'Review',
  'tabs.delivery': 'Delivery',
  'steps.intake': 'Intake',
  'steps.inspection': 'Inspection',
  'steps.appraisal': 'Appraisal',
  'steps.review': 'Review',
  'steps.delivery': 'Delivery',
  'property.type.residential': 'Residential',
  'property.type.commercial': 'Commercial',
  'property.type.industrial': 'Industrial',
  'property.type.land': 'Land',
};

const dictionaries: Record<Lang, Dict> = { ar, en };

interface I18nContextType {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  setLang: (l: Lang, persist?: boolean) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user } = useAuth();
  const [lang, setLangState] = useState<Lang>('ar');

  useEffect(() => {
    const stored = (localStorage.getItem('lang') as Lang | null);
    const fromProfile = (profile as any)?.locale as Lang | undefined;
    const initial: Lang = fromProfile || stored || 'ar';
    setLangState(initial);
  }, [profile?.id]);

  const setLang = async (l: Lang, persist = true) => {
    setLangState(l);
    if (persist) localStorage.setItem('lang', l);
    try {
      if (user?.id) {
        await supabase.from('user_profiles').update({ locale: l }).eq('id', user.id);
      }
    } catch {
      // ignore best-effort failure
    }
  };

  const dict = useMemo(() => dictionaries[lang] || dictionaries.ar, [lang]);
  const t = (key: string) => dict[key] ?? key;
  const dir: 'rtl' | 'ltr' = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <I18nContext.Provider value={{ lang, dir, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

