import { useState, useEffect } from "react";
import {
  Users, Clock, MessageCircleQuestion, Bot,
  TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, Edit3, ArrowRight, AlertCircle
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from "recharts";
import { Link } from "react-router";
import { api } from "../../lib/api";

const gradeColors: Record<string, string> = {
  A: "#10B981", B: "#3B82F6", C: "#F59E0B", D: "#EF4444", E: "#DC2626"
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Needs Review", color: "#F59E0B", bg: "#FEF3C7" },
  draft: { label: "Draft", color: "#64748B", bg: "#F1F5F9" },
  published: { label: "Published", color: "#10B981", bg: "#D1FAE5" },
  approved: { label: "Approved", color: "#10B981", bg: "#D1FAE5" },
  auto_approved: { label: "Auto-Approved", color: "#10B981", bg: "#D1FAE5" },
  needs_revision: { label: "Needs Revision", color: "#EF4444", bg: "#FEE2E2" },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  red: { label: "Urgent", color: "#EF4444", bg: "#FEE2E2", dot: "#EF4444" },
  orange: { label: "Academic", color: "#F59E0B", bg: "#FEF3C7", dot: "#F59E0B" },
  yellow: { label: "General", color: "#D97706", bg: "#FEF9C3", dot: "#FBBF24" },
};

export function TeacherDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get<any>("/teacher/dashboard").then(setData);
  }, []);

  const handleApprove = (id: number) => {
    api.put(`/teacher/ai-analysis/${id}/approve`).then(() => {
      setData((prev: any) => ({
        ...prev,
        recentAnalysis: prev.recentAnalysis.map((a: any) => a.id === id ? { ...a, status: "approved" } : a)
      }));
    });
  };

  const handleReject = (id: number) => {
    api.put(`/teacher/ai-analysis/${id}/revise`).then(() => {
      setData((prev: any) => ({
        ...prev,
        recentAnalysis: prev.recentAnalysis.map((a: any) => a.id === id ? { ...a, status: "needs_revision" } : a)
      }));
    });
  };

  if (!data) return <div>Loading...</div>;

  const pending = data.recentAnalysis.filter((a: any) => a.status === "pending");

  const statCards = [
    {
      label: "Total Students", value: data.stats.totalStudents, icon: <Users size={20} />,
      iconBg: "#EFF6FF", iconColor: "#2563EB", trend: null, sub: "Year 5A Class"
    },
    {
      label: "Pending Reviews", value: data.stats.pendingReviews, icon: <Clock size={20} />,
      iconBg: "#FEF3C7", iconColor: "#F59E0B", trend: "up", sub: "Needs attention"
    },
    {
      label: "AI Handled Questions", value: `${data.stats.aiHandled}%`, icon: <Bot size={20} />,
      iconBg: "#D1FAE5", iconColor: "#10B981", trend: "up", sub: "This term"
    },
    {
      label: "Flagged Questions", value: data.stats.flagged, icon: <MessageCircleQuestion size={20} />,
      iconBg: "#FEE2E2", iconColor: "#EF4444", trend: null, sub: "Needs your input"
    },
  ];

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Welcome */}
        <div className="mb-7">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1E293B" }}>Good morning, Ms. Thompson 👋</h1>
              <p className="mt-1" style={{ color: "#64748B" }}>Term 2, Week 8 · Thursday, April 3, 2026 · Greenwood Primary School</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200" style={{ backgroundColor: "#EFF6FF" }}>
              <Clock size={14} style={{ color: "#2563EB" }} />
              <span className="text-sm" style={{ color: "#2563EB", fontWeight: 500 }}>Term 2, Week 8</span>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.iconBg }}>
                  <span style={{ color: card.iconColor }}>{card.icon}</span>
                </div>
                {card.trend === "up" && <TrendingUp size={14} style={{ color: "#10B981" }} />}
                {card.trend === "down" && <TrendingDown size={14} style={{ color: "#EF4444" }} />}
              </div>
              <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1E293B", lineHeight: 1 }}>{card.value}</p>
              <p className="mt-1 text-sm" style={{ fontWeight: 500, color: "#1E293B" }}>{card.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-7">
          {/* Performance chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Class Performance Trend</h2>
                <p className="text-sm" style={{ color: "#64748B" }}>Weeks 5–8, Term 2</p>
              </div>
              <div className="flex gap-4 text-xs">
                {[
                  { label: "Above Expected", color: "#10B981" },
                  { label: "At Expected", color: "#2563EB" },
                  { label: "Approaching", color: "#F59E0B" },
                  { label: "Below Expected", color: "#EF4444" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5 hidden md:flex">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }}></div>
                    <span style={{ color: "#64748B" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.performance} barSize={28} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  labelStyle={{ fontWeight: 600, color: "#1E293B" }}
                />
                <Bar dataKey="aboveExpected" name="Above Expected" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expected" name="At Expected" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approaching" name="Approaching" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="below" name="Below Expected" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Stats widget */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="mb-4" style={{ fontWeight: 600, color: "#1E293B" }}>AI Performance</h2>
            <div className="space-y-4">
              {[
                { label: "Questions Auto-Resolved", value: "85%", color: "#10B981", bg: "#D1FAE5" },
                { label: "High Confidence Responses", value: "72%", color: "#2563EB", bg: "#DBEAFE" },
                { label: "Medium Confidence", value: "18%", color: "#F59E0B", bg: "#FEF3C7" },
                { label: "Flagged for Review", value: "10%", color: "#EF4444", bg: "#FEE2E2" },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: "#64748B" }}>{item.label}</span>
                    <span className="text-sm px-2 py-0.5 rounded-full" style={{ color: item.color, backgroundColor: item.bg, fontWeight: 600 }}>
                      {item.value}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: item.value, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-4 rounded-xl" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <p className="text-xs" style={{ color: "#64748B" }}>This week's AI saved approximately</p>
              <p className="text-2xl" style={{ fontWeight: 700, color: "#1E293B" }}>4.2 hrs</p>
              <p className="text-xs" style={{ color: "#64748B" }}>of teacher admin time</p>
            </div>
          </div>
        </div>

        {/* AI Analysis table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-7 overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
            <div>
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Recent AI Analysis — Needs Approval</h2>
              <p className="text-sm" style={{ color: "#64748B" }}>{pending.length} pending · Review and approve before sending to parents</p>
            </div>
            <Link to="/teacher/ai-analysis" className="text-sm flex items-center gap-1.5 hover:underline" style={{ color: "#2563EB", fontWeight: 500 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC" }}>
                  {["Student", "Subject", "Weak Areas", "AI Recommendation (Preview)", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs" style={{ color: "#94A3B8", fontWeight: 600, letterSpacing: "0.05em" }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentAnalysis.slice(0, 5).map((item: any, i: number) => {
                  const st = statusConfig[item.status] ?? statusConfig.pending;
                  return (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                            style={{ backgroundColor: item.avatarColor, fontWeight: 600 }}>
                            {item.avatar}
                          </div>
                          <div>
                            <p className="text-sm" style={{ fontWeight: 500, color: "#1E293B" }}>{item.student}</p>
                            <p className="text-xs" style={{ color: "#94A3B8" }}>{item.year}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#2563EB", fontWeight: 500 }}>
                          {item.subject}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.weakAreas.slice(0, 2).map((area: string) => (
                            <span key={area} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
                              {area}
                            </span>
                          ))}
                          {item.weakAreas.length > 2 && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#94A3B8" }}>
                              +{item.weakAreas.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-xs truncate" style={{ color: "#64748B" }}>
                          {item.recommendations[0]}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.color, fontWeight: 500 }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.status === "pending" ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={16} style={{ color: "#10B981" }} />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Edit">
                              <Edit3 size={16} style={{ color: "#3B82F6" }} />
                            </button>
                            <button
                              onClick={() => handleReject(item.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="Reject"
                            >
                              <XCircle size={16} style={{ color: "#EF4444" }} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: "#94A3B8" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Parent Questions widget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
            <div>
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Flagged Parent Questions</h2>
              <p className="text-sm" style={{ color: "#64748B" }}>Requires your personal response</p>
            </div>
            <Link to="/teacher/flagged" className="text-sm flex items-center gap-1.5 hover:underline" style={{ color: "#2563EB", fontWeight: 500 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.flaggedQuestions.slice(0, 3).map((q: any) => {
              const p = priorityConfig[q.priority] ?? priorityConfig.yellow;
              return (
                <div key={q.id} className="px-6 py-4 flex items-start gap-4">
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: p.dot }}></div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                    style={{ backgroundColor: q.avatarColor, fontWeight: 600 }}>
                    {q.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>{q.parentName}</span>
                      <span className="text-xs" style={{ color: "#94A3B8" }}>re: {q.childName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: p.bg, color: p.color, fontWeight: 500 }}>
                        {p.label}
                      </span>
                    </div>
                    <p className="text-sm truncate" style={{ color: "#64748B" }}>{q.question}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <AlertCircle size={12} style={{ color: "#F59E0B" }} />
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{q.flagReason} · {q.timestamp}</p>
                    </div>
                  </div>
                  <Link
                    to="/teacher/flagged"
                    className="text-xs px-3 py-1.5 rounded-lg shrink-0 hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "#EFF6FF", color: "#2563EB", fontWeight: 500 }}
                  >
                    Respond
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
