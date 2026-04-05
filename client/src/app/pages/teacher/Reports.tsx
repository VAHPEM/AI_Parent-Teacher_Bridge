import { useEffect, useState } from "react";
import { FileText, Calendar, CheckCircle, Clock, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router";
import {
  fetchTeacherStudents,
  postTeacherGenerateReport,
  type StudentBrief,
} from "../../lib/api";

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
  const [students, setStudents] = useState<StudentBrief[]>([]);
  const [studentId, setStudentId] = useState<number>(1);
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherStudents()
      .then((list) => {
        setStudents(list);
        if (list.length) {
          setStudentId((prev) =>
            list.some((s) => s.id === prev) ? prev : list[0].id
          );
        }
      })
      .catch(() => setStudents([]));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenMessage(null);
    setGenError(null);
    try {
      const { report_id } = await postTeacherGenerateReport(studentId);
      setGenMessage(
        `AI draft saved (report #${report_id}). Review and approve under Needs Your Review — parents only see it after approval.`
      );
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>Reports</h1>
            <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Generate AI parent reports, then approve them before parents can use them in chat</p>
          </div>
        </div>

        <div className="mb-6 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <h2 style={{ fontWeight: 600, color: "#1E293B" }} className="text-sm">Generate AI parent report</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "#64748B", fontWeight: 600 }}>Student</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(Number(e.target.value))}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 min-w-[200px]"
                style={{ color: "#1E293B" }}
              >
                {students.length === 0 ? (
                  <option value={1}>Student 1 (load API for list)</option>
                ) : (
                  students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))
                )}
              </select>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all disabled:opacity-50"
              style={{ backgroundColor: "#2563EB", fontWeight: 600 }}
            >
              <FileText size={15} />
              {generating ? "Generating…" : "Generate with AI"}
            </button>
            <Link
              to="/teacher/pending"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-slate-200 hover:bg-slate-50"
              style={{ color: "#2563EB", fontWeight: 600 }}
            >
              <LinkIcon size={15} />
              Needs Your Review
            </Link>
          </div>
          {genMessage && (
            <p className="text-sm p-3 rounded-xl" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>{genMessage}</p>
          )}
          {genError && (
            <p className="text-sm p-3 rounded-xl" style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>{genError}</p>
          )}
        </div>

        {generating && (
          <div className="mb-6 p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            <div>
              <p className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>AI is generating the parent report…</p>
              <p className="text-xs" style={{ color: "#64748B" }}>This may take up to a minute. The draft will be pending your approval.</p>
            </div>
          </div>
        )}

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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Report History (demo list)</h2>
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
