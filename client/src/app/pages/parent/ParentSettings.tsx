import { useState, useEffect } from "react";
import { Bell, Globe, User, Save, Shield, Lock } from "lucide-react";
import { api } from "../../lib/api";
import { DEMO_PARENT_ID } from "../../lib/config";
import { useParentChild } from "../../context/ParentChildContext";

const languages = ["English", "Simplified Chinese (普通话)", "Arabic (العربية)", "Vietnamese (Tiếng Việt)", "Hindi (हिन्दी)", "Korean (한국어)"];

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
  const [saved, setSaved] = useState(false);
  const [language, setLanguage] = useState("English");
  const [notifications, setNotifications] = useState({
    newReport: true, teacherReply: true, weeklyDigest: false, aiActivities: true
  });
  const [loading, setLoading] = useState(true);
  const{parent}= useParentChild();

  useEffect(() => {
    api.get<SettingsData>(`/parent/settings?parent_id=${DEMO_PARENT_ID}`)
      .then(data => {
        if (data.preferred_language) setLanguage(data.preferred_language);
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
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>Settings</h1>
          <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Manage your account and notification preferences</p>
        </div>

        <div className="space-y-5">
          {/* Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} style={{ color: "#10B981" }} />
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Your Profile</h2>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: "#10B981", fontSize: "1.1rem", fontWeight: 700 }}>
                SW
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "#1E293B" }}>{parent?.name}</p>
                <p className="text-sm" style={{ color: "#64748B" }}>Parent / Guardian of Noah Williams</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>s.williams@email.com.au</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Full Name", value: parent?.name },
                { label: "Email", value: "s.williams@email.com.au" },
                { label: "Phone", value: "0412 345 678" },
                { label: "Relationship", value: "Parent / Guardian" },
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
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Language & Translation</h2>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "#64748B", fontWeight: 500 }}>Preferred Language</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                style={{ color: "#1E293B", backgroundColor: "white" }}
              >
                {languages.map(l => <option key={l}>{l}</option>)}
              </select>
              <p className="text-xs mt-2" style={{ color: "#94A3B8" }}>
                AI-generated reports and teacher communications will be automatically translated to your preferred language.
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} style={{ color: "#10B981" }} />
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Notifications</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: "newReport", label: "New progress reports", desc: "Get notified when a new report is ready for Noah" },
                { key: "teacherReply", label: "Teacher replies", desc: "Notification when Ms. Thompson replies to your messages" },
                { key: "weeklyDigest", label: "Weekly summary email", desc: "A summary of Noah's week sent every Friday" },
                { key: "aiActivities", label: "New AI learning activities", desc: "When new home learning activities are generated for Noah" },
              ].map(item => (
                <div key={item.key} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm" style={{ fontWeight: 500, color: "#1E293B" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>{item.desc}</p>
                  </div>
                  <ToggleSwitch
                    value={notifications[item.key as keyof typeof notifications]}
                    onChange={() => toggle(item.key)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} style={{ color: "#10B981" }} />
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Privacy & Data</h2>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: "#F0FDF4", border: "1px solid #A7F3D0" }}>
              <p className="text-sm" style={{ color: "#065F46", lineHeight: "1.6" }}>
                <span style={{ fontWeight: 600 }}>Your data is secure.</span> EduTrack AI only uses Noah's educational data to generate personalised learning recommendations. All data is stored securely and is never shared with third parties. AI responses are reviewed by Ms. Thompson before being sent to you.
              </p>
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
              {saved ? "Settings Saved ✓" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
