import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// EN
import enCommon from "./locales/en/common.json";
import enLayout from "./locales/en/layout.json";
import enDashboard from "./locales/en/dashboard.json";
import enProgress from "./locales/en/progress.json";
import enActivities from "./locales/en/activities.json";
import enMessages from "./locales/en/messages.json";
import enAiChat from "./locales/en/ai-chat.json";
import enQuestions from "./locales/en/questions.json";
import enSettings from "./locales/en/settings.json";

// ZH-CN
import zhCNCommon from "./locales/zh-CN/common.json";
import zhCNLayout from "./locales/zh-CN/layout.json";
import zhCNDashboard from "./locales/zh-CN/dashboard.json";
import zhCNProgress from "./locales/zh-CN/progress.json";
import zhCNActivities from "./locales/zh-CN/activities.json";
import zhCNMessages from "./locales/zh-CN/messages.json";
import zhCNAiChat from "./locales/zh-CN/ai-chat.json";
import zhCNQuestions from "./locales/zh-CN/questions.json";
import zhCNSettings from "./locales/zh-CN/settings.json";

// HI
import hiCommon from "./locales/hi/common.json";
import hiLayout from "./locales/hi/layout.json";
import hiDashboard from "./locales/hi/dashboard.json";
import hiProgress from "./locales/hi/progress.json";
import hiActivities from "./locales/hi/activities.json";
import hiMessages from "./locales/hi/messages.json";
import hiAiChat from "./locales/hi/ai-chat.json";
import hiQuestions from "./locales/hi/questions.json";
import hiSettings from "./locales/hi/settings.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        layout: enLayout,
        dashboard: enDashboard,
        progress: enProgress,
        activities: enActivities,
        messages: enMessages,
        "ai-chat": enAiChat,
        questions: enQuestions,
        settings: enSettings,
      },
      "zh-CN": {
        common: zhCNCommon,
        layout: zhCNLayout,
        dashboard: zhCNDashboard,
        progress: zhCNProgress,
        activities: zhCNActivities,
        messages: zhCNMessages,
        "ai-chat": zhCNAiChat,
        questions: zhCNQuestions,
        settings: zhCNSettings,
      },
      hi: {
        common: hiCommon,
        layout: hiLayout,
        dashboard: hiDashboard,
        progress: hiProgress,
        activities: hiActivities,
        messages: hiMessages,
        "ai-chat": hiAiChat,
        questions: hiQuestions,
        settings: hiSettings,
      },
    },
    lng: undefined,
    fallbackLng: "en",
    defaultNS: "common",
    initImmediate: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "edutrack_parent_lang",
    },
  });

export default i18n;
