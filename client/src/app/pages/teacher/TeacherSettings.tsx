import { useState } from "react";
import { Bell, Globe, Shield, Bot, Mail, Save, User } from "lucide-react";

export function TeacherSettings() {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    newQuestion: true, approvalReminder: true, weeklyDigest: true, urgentAlerts: true
  });
  const [aiSettings, setAiSettings] = useState({
    autoApproveHigh: false, requireReview: true, translateMessages: true
  });

  const toggle = (setter: React.Dispatch<React.SetStateAction<any>>, key: string) => {
    setter((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const ToggleSwitch = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <div
      className="w-10 h-6 rounded-full relative cursor-pointer transition-colors"
      style={{ backgroundColor: value ? "#2563EB" : "#CBD5E1" }}
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
          <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Manage your EduTrack AI preferences and notifications</p>
        </div>

        <div className="space-y-5">
          {/* Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} style={{ color: "#2563EB" }} />
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Profile</h2>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: "#2563EB", fontSize: "1.1rem", fontWeight: 700 }}>
                MT
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "#1E293B" }}>Ms. Jennifer Thompson</p>
                <p className="text-sm" style={{ color: "#64748B" }}>Year 5 Teacher · Greenwood Primary School</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>j.thompson@greenwoodps.edu.au</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Full Name", value: "Jennifer Thompson" },
                { label: "Email", value: "j.thompson@greenwoodps.edu.au" },
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

          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} style={{ color: "#2563EB" }} />
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Notifications</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: "newQuestion", label: "New parent questions", desc: "Get notified when parents submit questions" },
                { key: "approvalReminder", label: "Pending approval reminders", desc: "Daily reminder for unapproved AI analyses" },
                { key: "weeklyDigest", label: "Weekly class digest", desc: "Summary of class performance each Monday" },
                { key: "urgentAlerts", label: "Urgent alerts", desc: "Immediate notification for wellbeing concerns" },
              ].map(item => (
                <div key={item.key} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm" style={{ fontWeight: 500, color: "#1E293B" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>{item.desc}</p>
                  </div>
                  <ToggleSwitch
                    value={notifications[item.key as keyof typeof notifications]}
                    onChange={() => toggle(setNotifications, item.key)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot size={16} style={{ color: "#2563EB" }} />
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>AI Settings</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: "autoApproveHigh", label: "Auto-approve high confidence responses", desc: "Skip review for AI responses with high confidence score" },
                { key: "requireReview", label: "Require review for sensitive topics", desc: "Always flag sensitive questions for manual review" },
                { key: "translateMessages", label: "Auto-translate parent messages", desc: "Translate non-English messages automatically" },
              ].map(item => (
                <div key={item.key} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm" style={{ fontWeight: 500, color: "#1E293B" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>{item.desc}</p>
                  </div>
                  <ToggleSwitch
                    value={aiSettings[item.key as keyof typeof aiSettings]}
                    onChange={() => toggle(setAiSettings, item.key)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all"
              style={{ backgroundColor: "#2563EB", fontWeight: 600 }}
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
