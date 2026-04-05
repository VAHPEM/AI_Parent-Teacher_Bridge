import { createContext, useCallback, useContext, useState } from "react";
import i18n from "../i18n/index";
import { api } from "../lib/api";
import { DEMO_PARENT_ID } from "../lib/config";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "zh-CN", label: "Simplified Chinese", nativeLabel: "简体中文" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "vi", label: "Vietnamese", nativeLabel: "Tiếng Việt" },
];

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  isChangingLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  isChangingLanguage: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState(i18n.language ?? "en");
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const setLanguage = useCallback((lang: string) => {
    setIsChangingLanguage(true);
    i18n.changeLanguage(lang);
    // Wait for DB to update first, THEN set language state to trigger page refetches
    api.put(`/parent/settings?parent_id=${DEMO_PARENT_ID}`, { preferred_language: lang })
      .then(() => setLangState(lang))
      .catch(err => {
        console.error("Failed to auto-sync language to backend:", err);
        setLangState(lang);
      })
      .finally(() => setIsChangingLanguage(false));
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isChangingLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
