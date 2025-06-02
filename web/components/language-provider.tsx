'use client';
import { useEffect, useState } from 'react';
import { setCookie, getCookie } from 'cookies-next';

export const LanguageProvider = ({ children, initialLang }: { children: React.ReactNode; initialLang: 'en' | 'hi' }) => {
  const [language, setLanguage] = useState(initialLang);

  useEffect(() => {
    const savedLang = getCookie('voiceLang') as 'en' | 'hi' || 'en';
    setLanguage(savedLang);
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    setCookie('voiceLang', newLang);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLang }));
  };

  return (
    <div data-language={language}>
      {children}
      <button onClick={toggleLanguage} className="fixed top-4 right-4 p-2 rounded-full bg-gray-200">
        {language === 'en' ? '🇮🇳' : '🇺🇸'}
      </button>
    </div>
  );
};