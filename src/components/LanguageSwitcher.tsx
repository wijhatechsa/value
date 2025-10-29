import React from 'react';
import { useI18n } from '../contexts/I18nContext';

export const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useI18n();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as any)}
      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
      title={lang === 'ar' ? 'تغيير اللغة' : 'Change language'}
    >
      <option value="ar">العربية</option>
      <option value="en">English</option>
    </select>
  );
};

