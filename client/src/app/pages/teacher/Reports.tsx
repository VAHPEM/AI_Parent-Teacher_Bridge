import { useState } from "react";
import { FileText, Download, Eye, Calendar, CheckCircle, Clock } from "lucide-react";

const reports = [
  {
    id: 1, title: "Term 2 Mid-Year Progress Report", class: "Year 5A", date: "Week 8, Term 2",
    status: "ready", students: 28, generated: "April 2, 2026"
  },
  {
    id: 2, title: "Week 7 Assessment Summary", class: "Year 5A", date: "Week 7, Term 2",
    status: "sent", students: 28, generated: "March 26, 2026"
  },
  {
    id: 3, title: "Term 1 Final Report", class: "Year 5A", date: "Term 1", status: "sent",
    students: 28, generated: "March 1, 2026"
  },
  {
    id: 4, title: "Week 6 Assessment Summary", class: "Year 5A", date: "Week 6, Term 2",
    status: "sent", students: 27, generated: "March 19, 2026"
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ready: { label: "Ready to Send", color: "#10B981", bg: "#D1FAE5", icon: <CheckCircle size={12} /> },
  sent: { label: "Sent to Parents", color: "#2563EB", bg: "#DBEAFE", icon: <CheckCircle size={12} /> },
  draft: { label: "Draft", color: "#F59E0B", bg: "#FEF3C7", icon: <Clock size={12} /> },
};

export function Reports() {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>Reports</h1>
            <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Generate, preview and send progress reports to parents</p>
          </div>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all"
            style={{ backgroundColor: "#2563EB", fontWeight: 600 }}
          >
            <FileText size={15} />
            {generating ? "Generating..." : "Generate New Report"}
          </button>
        </div>

        {generating && (
          <div className="mb-6 p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            <div>
              <p className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>AI is generating your report...</p>
              <p className="text-xs" style={{ color: "#64748B" }}>Analysing Week 8 assessment data and crafting personalised summaries</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: "Reports Generated", value: "12", color: "#2563EB", bg: "#EFF6FF" },
            { label: "Sent to Parents", value: "10", color: "#10B981", bg: "#D1FAE5" },
            { label: "Avg. Read Rate", value: "94%", color: "#F59E0B", bg: "#FEF3C7" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
              <p style={{ fontSize: "1.75rem", fontWeight: 700, color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Report list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Report History</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {reports.map(report => {
              const status = statusConfig[report.status];
              return (
                <div key={report.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#EFF6FF" }}>
                    <FileText size={18} style={{ color: "#2563EB" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>{report.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar size={12} style={{ color: "#94A3B8" }} />
                      <span className="text-xs" style={{ color: "#94A3B8" }}>{report.date} · {report.students} students · Generated {report.generated}</span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: status.bg, color: status.color, fontWeight: 500 }}>
                    {status.icon}{status.label}
                  </span>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-blue-50 transition-colors">
                      <Eye size={15} style={{ color: "#2563EB" }} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                      <Download size={15} style={{ color: "#64748B" }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
