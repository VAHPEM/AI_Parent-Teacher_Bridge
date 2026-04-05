import { createContext, useCallback, useContext, useState } from "react";
import i18n from "../i18n/index";
import { api } from "../lib/api";
import { DEMO_PARENT_ID } from "../lib/config";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "zh-CN", label: "Simplified Chinese", nativeLabel: "简体中文" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
];

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState(i18n.language ?? "en");

  const setLanguage = useCallback((lang: string) => {
    i18n.changeLanguage(lang);
    setLangState(lang);
    // Auto-save the selected language directly to the backend
    api.put(`/parent/settings?parent_id=${DEMO_PARENT_ID}`, { preferred_language: lang })
      .catch(err => console.error("Failed to auto-sync language to backend:", err));
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
