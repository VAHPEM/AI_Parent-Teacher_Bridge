import { useState, useEffect } from "react";
import { Bell, Globe, User, Save, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { DEMO_PARENT_ID } from "../../lib/config";
import { useParentChild } from "../../context/ParentChildContext";
import { useLanguage, SUPPORTED_LANGUAGES } from "../../context/LanguageContext";

interface SettingsData {
  preferred_language: string;
  notifications: {
    newReport: boolean;
    teacherReply: boolean;
    weeklyDigest: boolean;
    aiActivities: boolean;
  };
}

export function ParentSettings() {
  const { t } = useTranslation("settings");
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    newReport: true, teacherReply: true, weeklyDigest: false, aiActivities: true
  });
  const [loading, setLoading] = useState(true);
  const { parent, activeChild } = useParentChild();
  const { language, setLanguage } = useLanguage();

  const firstName = activeChild?.firstName ?? "your child";
  const teacher = activeChild?.teacher ?? "Ms. Thompson";

  useEffect(() => {
    api.get<SettingsData>(`/parent/settings?parent_id=${DEMO_PARENT_ID}`)
      .then(data => {
        if (data.preferred_language) {
          const matched = SUPPORTED_LANGUAGES.find(l => l.label === data.preferred_language || l.code === data.preferred_language);
          if (matched) setLanguage(matched.code);
        }
        if (data.notifications) setNotifications(data.notifications);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (key: string) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSave = () => {
    api.put(`/parent/settings?parent_id=${DEMO_PARENT_ID}`, { preferred_language: language, notifications })
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      })
      .catch((err) => console.error(err));
  };

  const ToggleSwitch = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <div
      className="w-10 h-6 rounded-full relative cursor-pointer transition-colors"
      style={{ backgroundColor: value ? "#10B981" : "#CBD5E1" }}
      onClick={onChange}
    >
      <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: value ? "22px" : "4px" }} />
    </div>
  );

  return (
    <>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>{t("title")}</h1>
          <p className="mt-1 text-sm" style={{ color: "#64748B" }}>{t("subtitle")}</p>
        </div>

        <div className="space-y-5">
          {/* Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} style={{ color: "#10B981" }} />
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>{t("profile_section")}</h2>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: "#10B981", fontSize: "1.1rem", fontWeight: 700 }}>
                SW
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "#1E293B" }}>{parent?.name}</p>
                <p className="text-sm" style={{ color: "#64748B" }}>{t("guardian_of", { childName: firstName })}</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>s.williams@email.com.au</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: t("fields.full_name"), value: parent?.name },
                { label: t("fields.email"), value: "s.williams@email.com.au" },
                { label: t("fields.phone"), value: "0412 345 678" },
                { label: t("fields.relationship"), value: t("fields.relationship_value") },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs block mb-1" style={{ color: "#64748B", fontWeight: 500 }}>{f.label}</label>
                  <input
                    defaultValue={f.value}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2"
                    style={{ color: "#1E293B", backgroundColor: "#F8FAFC" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} style={{ color: "#10B981" }} />
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>{t("language_section")}</h2>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "#64748B", fontWeight: 500 }}>{t("language_label")}</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                style={{ color: "#1E293B", backgroundColor: "white" }}
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.nativeLabel} — {l.label}</option>
                ))}
              </select>
              <p className="text-xs mt-2" style={{ color: "#94A3B8" }}>{t("language_hint")}</p>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} style={{ color: "#10B981" }} />
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>{t("notifications_section")}</h2>
            </div>
            <div className="space-y-4">
              {(["newReport", "teacherReply", "weeklyDigest", "aiActivities"] as const).map(key => (
                <div key={key} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm" style={{ fontWeight: 500, color: "#1E293B" }}>
                      {t(`notification_items.${key}_label`, { firstName, teacher })}
                    </p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>
                      {t(`notification_items.${key}_desc`, { firstName, teacher })}
                    </p>
                  </div>
                  <ToggleSwitch value={notifications[key]} onChange={() => toggle(key)} />
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} style={{ color: "#10B981" }} />
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>{t("privacy_section")}</h2>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: "#F0FDF4", border: "1px solid #A7F3D0" }}>
              <p
                className="text-sm"
                style={{ color: "#065F46", lineHeight: "1.6" }}
                dangerouslySetInnerHTML={{ __html: t("privacy_text", { firstName, teacher }) }}
              />
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all"
              style={{ backgroundColor: "#10B981", fontWeight: 600 }}
            >
              <Save size={15} />
              {saved ? t("saved_btn") : t("save_btn")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
