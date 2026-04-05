import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  TrendingUp, TrendingDown, Minus, BookOpen, Award, MessageSquare,
  ArrowRight, CheckCircle, AlertCircle, Clock, Bell, Sparkles, Calendar
} from "lucide-react";
import { useActiveChild } from "../../context/ParentChildContext";
import { fetchParentReport } from "../../lib/api";

const gradeConfig: Record<string, { color: string; bg: string; label: string; border: string }> = {
  "A": { color: "#10B981", bg: "#D1FAE5", label: "Above Expected", border: "#A7F3D0" },
  "B": { color: "#2563EB", bg: "#DBEAFE", label: "Above Expected", border: "#93C5FD" },
  "B+": { color: "#2563EB", bg: "#DBEAFE", label: "Above Expected", border: "#93C5FD" },
  "C+": { color: "#F59E0B", bg: "#FEF3C7", label: "At Expected", border: "#FDE68A" },
  "C": { color: "#F59E0B", bg: "#FEF3C7", label: "At Expected", border: "#FDE68A" },
  "D": { color: "#EF4444", bg: "#FEE2E2", label: "Below Expected", border: "#FECACA" },
};

const recentActivity = [
  { type: "report", text: "Week 8 Mathematics report added", time: "2 hours ago", icon: <BookOpen size={14} />, color: "#2563EB", bg: "#EFF6FF" },
  { type: "message", text: "Ms. Thompson replied to your question", time: "Yesterday", icon: <MessageSquare size={14} />, color: "#10B981", bg: "#ECFDF5" },
  { type: "alert", text: "New English assessment available to review", time: "Yesterday", icon: <Bell size={14} />, color: "#F59E0B", bg: "#FEF3C7" },
  { type: "ai", text: "AI generated new home learning activities", time: "2 days ago", icon: <Sparkles size={14} />, color: "#8B5CF6", bg: "#EDE9FE" },
];

const upcomingEvents = [
  { title: "Parent-Teacher Conference", date: "April 10, 2026", type: "meeting" },
  { title: "Science Fair", date: "April 15, 2026", type: "event" },
  { title: "Term 2 Reports Released", date: "April 22, 2026", type: "report" },
];

export function ParentDashboard() {
  const { activeChild: student } = useActiveChild();
  const [liveSummary, setLiveSummary] = useState<string | null>(null);
  const [reportFetchError, setReportFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLiveSummary(null);
    setReportFetchError(null);
    fetchParentReport(student.id)
      .then((report) => {
        if (cancelled) return;
        setLiveSummary(report?.summary?.trim() ? report.summary : null);
      })
      .catch((e) => {
        if (cancelled) return;
        setReportFetchError(e instanceof Error ? e.message : "Failed to load report");
      });
    return () => {
      cancelled = true;
    };
  }, [student.id]);

  const mockInsight =
    student.id === 1
      ? "Noah is showing positive improvement in Mathematics this week (+1 grade level). His English reading comprehension could benefit from 15 minutes of daily reading practice at home."
      : "Ella is performing above expected across all subjects this term. Her HASS project received an A — outstanding work! Continue encouraging her love of reading and creative writing.";

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Welcome */}
        <div className="mb-7">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1E293B" }}>
                Good afternoon, Sarah! 👋
              </h1>
              <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
                Here's {student.firstName}'s latest progress report for Term 2, Week 8
              </p>
            </div>
            <Link
              to="/parent/questions"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#10B981", fontWeight: 600 }}
            >
              <MessageSquare size={15} />
              Ask {student.teacher}
            </Link>
          </div>
        </div>

        {/* Child overview card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: student.color, fontSize: "1.25rem", fontWeight: 700 }}>
              {student.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 700, color: "#1E293B", fontSize: "1.1rem" }}>{student.name}</p>
              <p className="text-sm" style={{ color: "#64748B" }}>{student.year} · Class {student.class} · {student.teacher}</p>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{student.school}</p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="text-center">
                <p style={{ fontSize: "1.5rem", fontWeight: 700, color: student.color }}>{student.overallGrade}</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Overall</p>
              </div>
              <div className="text-center">
                <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10B981" }}>{student.attendance}</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Attendance</p>
              </div>
              <div className="text-center">
                <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2563EB" }}>{student.recentReports.length}</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Subjects</p>
              </div>
            </div>
          </div>

          {/* AI insight strip */}
          <div className="mt-4 p-3 rounded-xl flex items-start gap-2.5" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <Sparkles size={14} className="shrink-0 mt-0.5" style={{ color: "#2563EB" }} />
            <p className="text-sm" style={{ color: "#1E40AF" }}>
              <span style={{ fontWeight: 600 }}>AI Insight:</span>{" "}
              {reportFetchError ? (
                <span className="block mt-1 text-amber-900">
                  Could not load live report ({reportFetchError}). Showing demo text below.
                </span>
              ) : null}
              {liveSummary || mockInsight}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Subject reports */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Latest Subject Reports</h2>
              <Link to="/parent/progress" className="text-sm flex items-center gap-1 hover:underline" style={{ color: "#10B981", fontWeight: 500 }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-4">
              {student.recentReports.map((report) => {
                const gc = gradeConfig[report.grade] || { color: "#94A3B8", bg: "#F1F5F9", label: "Unknown", border: "#E2E8F0" };
                return (
                  <div key={report.subject} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: gc.bg }}>
                          <BookOpen size={18} style={{ color: gc.color }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: "#1E293B" }}>{report.subject}</p>
                          <p className="text-xs" style={{ color: "#94A3B8" }}>Week 8, Term 2</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl px-3 py-1 rounded-xl border" style={{ backgroundColor: gc.bg, color: gc.color, fontWeight: 700, borderColor: gc.border }}>
                          {report.grade}
                        </span>
                        {report.trend === "up" && <TrendingUp size={18} style={{ color: "#10B981" }} />}
                        {report.trend === "down" && <TrendingDown size={18} style={{ color: "#EF4444" }} />}
                        {report.trend === "stable" && <Minus size={18} style={{ color: "#94A3B8" }} />}
                      </div>
                    </div>

                    <div className="mb-3 p-3 rounded-xl" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                      <p className="text-xs mb-0.5" style={{ fontWeight: 600, color: "#64748B" }}>TEACHER'S COMMENT</p>
                      <p className="text-sm" style={{ color: "#374151", lineHeight: "1.6" }}>{report.comment}</p>
                    </div>

                    <div>
                      <p className="text-xs mb-2" style={{ fontWeight: 600, color: "#10B981" }}>
                        <Sparkles size={11} className="inline mr-1" />AI RECOMMENDED HOME ACTIVITIES
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {report.aiRecommendations.map((rec, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" }}>
                            ✓ {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Recent activity */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="mb-4" style={{ fontWeight: 600, color: "#1E293B" }}>Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: item.bg }}>
                      <span style={{ color: item.color }}>{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "#1E293B", fontWeight: 500, lineHeight: "1.4" }}>{item.text}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming events */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={15} style={{ color: "#2563EB" }} />
                <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Upcoming</h2>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: i === 0 ? "#2563EB" : "#94A3B8" }}></div>
                    <div>
                      <p className="text-sm" style={{ fontWeight: 500, color: "#1E293B" }}>{event.title}</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="mb-3" style={{ fontWeight: 600, color: "#1E293B" }}>Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: "View full progress report", to: "/parent/progress", color: "#10B981", bg: "#ECFDF5" },
                  { label: "See learning activities", to: "/parent/activities", color: "#2563EB", bg: "#EFF6FF" },
                  { label: "Send a message", to: "/parent/messages", color: "#8B5CF6", bg: "#EDE9FE" },
                ].map(action => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors hover:opacity-80"
                    style={{ backgroundColor: action.bg, color: action.color }}
                  >
                    <span className="text-sm" style={{ fontWeight: 500 }}>{action.label}</span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
