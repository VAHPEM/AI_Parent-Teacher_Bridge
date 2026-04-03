import { useState } from "react";
import { RefreshCcw, CheckCircle, AlertCircle, Clock, Database, Link, ArrowRight } from "lucide-react";

const syncHistory = [
  { id: 1, date: "Today, 10:32am", records: 168, status: "success", trigger: "Automatic" },
  { id: 2, date: "Yesterday, 11:00pm", records: 168, status: "success", trigger: "Scheduled" },
  { id: 3, date: "March 31, 11:00pm", records: 162, status: "success", trigger: "Scheduled" },
  { id: 4, date: "March 30, 2:15pm", records: 168, status: "warning", trigger: "Manual" },
  { id: 5, date: "March 29, 11:00pm", records: 168, status: "success", trigger: "Scheduled" },
];

export function CanvasSync() {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setSynced(false);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
      setTimeout(() => setSynced(false), 4000);
    }, 2500);
  };

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>Canvas LMS Sync</h1>
          <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Synchronise grade data between Canvas and EduTrack AI</p>
        </div>

        {/* Connection status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EFF6FF" }}>
                <Database size={22} style={{ color: "#2563EB" }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p style={{ fontWeight: 600, color: "#1E293B" }}>Canvas LMS — Greenwood Primary</p>
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#D1FAE5", color: "#065F46", fontWeight: 500 }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Connected
                  </span>
                </div>
                <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
                  <Clock size={12} className="inline mr-1" />Last synced: Today at 10:32am AEST · {168} records
                </p>
              </div>
            </div>
            <button
              onClick={handleSync}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all disabled:opacity-60"
              style={{ backgroundColor: "#2563EB", fontWeight: 600 }}
              disabled={syncing}
            >
              <RefreshCcw size={15} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : synced ? "Sync Complete ✓" : "Sync Now"}
            </button>
          </div>

          {synced && (
            <div className="mt-4 p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: "#D1FAE5" }}>
              <CheckCircle size={16} style={{ color: "#10B981" }} />
              <p className="text-sm" style={{ color: "#065F46", fontWeight: 500 }}>Sync complete! 168 student records updated successfully.</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: "Students Synced", value: "84", color: "#2563EB" },
              { label: "Grades Updated", value: "168", color: "#10B981" },
              { label: "Sync Frequency", value: "Daily", color: "#F59E0B" },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl text-center" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <p style={{ fontWeight: 700, color: s.color, fontSize: "1.5rem" }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: "#64748B" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sync history */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Sync History</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {syncHistory.map(entry => (
              <div key={entry.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: entry.status === "success" ? "#D1FAE5" : "#FEF3C7" }}>
                  {entry.status === "success"
                    ? <CheckCircle size={14} style={{ color: "#10B981" }} />
                    : <AlertCircle size={14} style={{ color: "#F59E0B" }} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm" style={{ fontWeight: 500, color: "#1E293B" }}>{entry.date}</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{entry.records} records · {entry.trigger}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: entry.status === "success" ? "#D1FAE5" : "#FEF3C7",
                    color: entry.status === "success" ? "#065F46" : "#92400E",
                    fontWeight: 500
                  }}>
                  {entry.status === "success" ? "Success" : "Partial"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
