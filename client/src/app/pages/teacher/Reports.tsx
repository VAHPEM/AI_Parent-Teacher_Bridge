import { useState, useEffect } from "react";
import { FileText, Download, Eye, Calendar, CheckCircle, Clock, ChevronDown } from "lucide-react";
import { api } from "../../lib/api";
import { DEMO_TEACHER_ID } from "../../lib/config";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ready: { label: "Ready to Send", color: "#10B981", bg: "#D1FAE5", icon: <CheckCircle size={12} /> },
  sent: { label: "Sent to Parents", color: "#2563EB", bg: "#DBEAFE", icon: <CheckCircle size={12} /> },
  draft: { label: "Draft", color: "#F59E0B", bg: "#FEF3C7", icon: <Clock size={12} /> },
};

interface ClassItem {
  id: number;
  name: string;
}

export function Reports() {
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState<any>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Fetch classes once on mount, set default selection
  useEffect(() => {
    api.get<any[]>(`/teacher/classes?teacher_id=${DEMO_TEACHER_ID}`).then((rows) => {
      const mapped = rows.map((c: any) => ({ id: c.id, name: c.name }));
      setClasses(mapped);
      if (mapped.length > 0) setSelectedClassId(mapped[0].id);
    });
  }, []);

  // Fetch reports whenever selected class changes
  useEffect(() => {
    if (selectedClassId === null) return;
    api.get<any>(`/teacher/reports?teacher_id=${DEMO_TEACHER_ID}&class_id=${selectedClassId}`).then(setData);
  }, [selectedClassId]);

  const handleGenerate = () => {
    if (!selectedClassId) return;
    setGenerating(true);
    const q = `teacher_id=${DEMO_TEACHER_ID}&class_id=${selectedClassId}&term=Term%202&week=8`;
    api.post(`/teacher/reports/generate?${q}`, {})
      .then(() => api.get<any>(`/teacher/reports?teacher_id=${DEMO_TEACHER_ID}&class_id=${selectedClassId}`).then(setData))
      .finally(() => setGenerating(false));
  };

  if (!data) return <div>Loading...</div>;

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>Reports</h1>
            <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Generate, preview and send progress reports to parents</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Class dropdown */}
            <div className="relative">
              <select
                value={selectedClassId ?? ""}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                style={{ color: "#1E293B", fontWeight: 500, minWidth: "180px" }}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#64748B" }} />
            </div>
            <button
              onClick={handleGenerate}
              disabled={!selectedClassId || generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: "#2563EB", fontWeight: 600 }}
            >
              <FileText size={15} />
              {generating ? "Generating..." : "Generate New Report"}
            </button>
          </div>
        </div>

        {generating && (
          <div className="mb-6 p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            <div>
              <p className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>AI is generating your report...</p>
              <p className="text-xs" style={{ color: "#64748B" }}>Analysing assessment data and crafting personalised summaries</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: "Reports Generated", value: data.stats.generated, color: "#2563EB", bg: "#EFF6FF" },
            { label: "Sent to Parents", value: data.stats.sent, color: "#10B981", bg: "#D1FAE5" },
            { label: "Avg. Read Rate", value: `${data.stats.readRate}%`, color: "#F59E0B", bg: "#FEF3C7" },
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
            {data.reports.map((report: any) => {
              const status = statusConfig[report.status] || statusConfig.draft;
              return (
                <div key={report.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#EFF6FF" }}>
                    <FileText size={18} style={{ color: "#2563EB" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>{report.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar size={12} style={{ color: "#94A3B8" }} />
                      <span className="text-xs" style={{ color: "#94A3B8" }}>{report.term} Wk {report.week_number} · {report.studentCount} students · Generated {report.generatedAt}</span>
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
