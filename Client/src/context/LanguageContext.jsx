import React, { createContext, useContext, useState, useEffect } from 'react';

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'mr', name: 'मराठी' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
];

const getStoredLang = () => {
  // Check googtrans cookie first (format: /en/hi)
  const match = document.cookie.match(/googtrans=\/[a-zA-Z-]+\/([a-zA-Z-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return localStorage.getItem('site_language') || 'en';
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLangState] = useState(getStoredLang);

  useEffect(() => {
    const lang = getStoredLang();
    if (lang !== currentLang) {
      setCurrentLangState(lang);
    }
  }, []);

  const switchLanguage = (langCode) => {
    setCurrentLangState(langCode);
    localStorage.setItem('site_language', langCode);
    document.documentElement.lang = langCode;

    if (langCode === 'en') {
      // Clear translation cookie to restore original English text
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
      
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = 'en';
        combo.dispatchEvent(new Event('change', { bubbles: true }));
      }
      // Reload ensures pristine original DOM text without translation leftovers
      window.location.reload();
      return;
    }

    // Set Google Translate cookie
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    document.cookie = `googtrans=/en/${langCode}; domain=${window.location.hostname}; path=/;`;

    // Trigger Google Translate combo dropdown
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // If script is still loading, reload with cookie set
      window.location.reload();
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLang, switchLanguage, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
