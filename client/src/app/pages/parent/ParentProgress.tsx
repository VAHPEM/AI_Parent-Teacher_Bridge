import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, BookOpen, CheckCircle, AlertCircle, Sparkles, Info } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useTranslation } from "react-i18next";
import { useParentChild } from "../../context/ParentChildContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import { DEMO_PARENT_ID } from "../../lib/config";

const gradeConfig: Record<string, { color: string; bg: string; border: string }> = {
  "A":  { color: "#10B981", bg: "#D1FAE5", border: "#A7F3D0" },
  "B+": { color: "#2563EB", bg: "#DBEAFE", border: "#93C5FD" },
  "B":  { color: "#2563EB", bg: "#DBEAFE", border: "#93C5FD" },
  "C+": { color: "#F59E0B", bg: "#FEF3C7", border: "#FDE68A" },
  "C":  { color: "#F59E0B", bg: "#FEF3C7", border: "#FDE68A" },
  "D":  { color: "#EF4444", bg: "#FEE2E2", border: "#FECACA" },
};

const SUBJECT_COLORS: Record<string, { color: string; bg: string }> = {
  "English":     { color: "#2563EB", bg: "#EFF6FF" },
  "Mathematics": { color: "#10B981", bg: "#ECFDF5" },
  "Science":     { color: "#8B5CF6", bg: "#EDE9FE" },
  "HASS":        { color: "#F59E0B", bg: "#FEF3C7" },
  "Health & PE": { color: "#EF4444", bg: "#FEE2E2" },
};

interface Subject {
  name: string; grade: string; score: number; trend: string;
  level: string; levelColor: string; levelBg: string;
  curriculumRef: string; teacherComment: string;
  weakAreas: string[]; strengths: string[]; aiRecs: string[];
  classAverage: number;
}

export function ParentProgress() {
  const { activeChild } = useParentChild();
  const { t } = useTranslation("progress");
  const { language } = useLanguage();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progressHistory, setProgressHistory] = useState<Record<string, unknown>[]>([]);
  const [activeSubjectMap, setActiveSubjectMap] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeChild) return;
    setIsLoading(true);
    api.get<{ subjects: Subject[]; progressHistory: Record<string, unknown>[] }>(
      `/parent/progress/${activeChild.id}?parent_id=${DEMO_PARENT_ID}`
    ).then(d => {
      setSubjects(d.subjects);
      setProgressHistory(d.progressHistory);
      console.log("Fetched progress data:", d);
    }).finally(() => setIsLoading(false));
  }, [activeChild?.id, language]);

  if (!activeChild || isLoading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm" style={{ color: "#94A3B8" }}>{t("loading", { ns: "common" })}</p>
    </div>
  );

  if (subjects.length === 0) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm" style={{ color: "#94A3B8" }}>{t("no_data")}</p>
    </div>
  );

  const activeSubject = activeSubjectMap[activeChild.id] || subjects[0].name;
  const setActiveSubject = (name: string) => setActiveSubjectMap(prev => ({ ...prev, [activeChild.id]: name }));
  const active = subjects.find(s => s.name === activeSubject) || subjects[0];
  const sc = SUBJECT_COLORS[active.name] ?? { color: "#64748B", bg: "#F1F5F9" };
  const gc = gradeConfig[active.grade] || { color: "#94A3B8", bg: "#F1F5F9", border: "#E2E8F0" };

  const trendLabel = active.trend === "up"
    ? t("trend.improving", { ns: "common" })
    : active.trend === "down"
    ? t("trend.declining", { ns: "common" })
    : t("trend.stable", { ns: "common" });

  const weeklyGoalKey = active.name === "English" || active.name === "Mathematics"
    ? `weekly_goals.${active.name}`
    : "weekly_goals.default";

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>
            {t("title", { firstName: activeChild.firstName })}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
            {t("subtitle", { term: 2, week: 8, school: activeChild.school, year: activeChild.year })}
          </p>
        </div>

        {/* Progress chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>{t("chart_title")}</h2>
              <p className="text-sm" style={{ color: "#64748B" }}>{t("chart_subtitle")}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={progressHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                labelStyle={{ fontWeight: 600, color: "#1E293B" }}
                formatter={(value: any) => [`${value}%`, ""]}
              />
              <Legend />
              {
                subjects.map(subject => (
                    <Line type="monotone" dataKey={subject.origin_subject} name={subject.name} stroke={subject.color} strokeWidth={2.5} dot={{ fill: subject.color, r: 4 }} />
                ))
              }
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {subjects.map(sub => (
            <button
              key={sub.name}
              onClick={() => setActiveSubject(sub.name)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeSubject === sub.name ? (SUBJECT_COLORS[sub.name]?.color ?? "#64748B") : "white",
                color: activeSubject === sub.name ? "white" : "#64748B",
                border: activeSubject === sub.name ? "none" : "1px solid #E2E8F0",
                fontWeight: activeSubject === sub.name ? 600 : 400
              }}
            >
              {sub.name}
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: activeSubject === sub.name ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                  color: activeSubject === sub.name ? "white" : "#64748B",
                  fontWeight: 600
                }}>
                {sub.grade}
              </span>
            </button>
          ))}
        </div>

        {/* Subject detail */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Left */}
          <div className="space-y-4">
            {/* Grade card */}
            <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: gc.border }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: sc.bg }}>
                    <BookOpen size={18} style={{ color: sc.color }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: "#1E293B" }}>{active.name}</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>{active.curriculumRef}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl px-3 py-1 rounded-xl" style={{ backgroundColor: gc.bg, color: gc.color, fontWeight: 800 }}>
                    {active.grade}
                  </span>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {active.trend === "up" && <TrendingUp size={14} style={{ color: "#10B981" }} />}
                    {active.trend === "down" && <TrendingDown size={14} style={{ color: "#EF4444" }} />}
                    {active.trend === "stable" && <Minus size={14} style={{ color: "#94A3B8" }} />}
                    <span className="text-xs" style={{ color: active.trend === "up" ? "#10B981" : active.trend === "down" ? "#EF4444" : "#94A3B8" }}>
                      {active.score}% · {trendLabel}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: active.levelBg, color: active.levelColor, fontWeight: 600 }}>
                  {active.level}
                </span>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: "#94A3B8" }}>{t("score", { value: active.score })}</span>
                  <span className="text-xs" style={{ color: "#94A3B8" }}>{t("class_avg", { value: 65 })}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${active.score}%`, backgroundColor: sc.color }} />
                </div>
              </div>
            </div>

            {/* Teacher comment */}
            {/*<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">*/}
            {/*  <p className="text-xs mb-2" style={{ fontWeight: 600, color: "#64748B" }}>{t("teacher_comment_label")}</p>*/}
            {/*  <p className="text-sm" style={{ color: "#374151", lineHeight: "1.7", fontStyle: "italic" }}>*/}
            {/*    "{active.teacherComment}"*/}
            {/*  </p>*/}
            {/*</div>*/}

            {/* Achievement standard */}
            {/*<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">*/}
            {/*  <div className="flex items-center gap-2 mb-2">*/}
            {/*    <Info size={14} style={{ color: "#2563EB" }} />*/}
            {/*    <p className="text-xs" style={{ fontWeight: 600, color: "#2563EB" }}>{t("curriculum_label")}</p>*/}
            {/*  </div>*/}
            {/*  <p className="text-sm" style={{ color: "#374151", lineHeight: "1.6" }}>{active.curriculumRef}</p>*/}
            {/*</div>*/}

            {/* Strengths & weak areas */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="mb-3">
                <p className="text-xs mb-2" style={{ fontWeight: 600, color: "#10B981" }}>{t("strengths")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {active.strengths.map(s => (
                    <span key={s} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>
                      <CheckCircle size={11} />{s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs mb-2" style={{ fontWeight: 600, color: "#F59E0B" }}>{t("improvements")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {active.weakAreas.map(w => (
                    <span key={w} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                      <AlertCircle size={11} />{w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: AI Recommendations */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EFF6FF" }}>
                  <Sparkles size={15} style={{ color: "#2563EB" }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "#1E293B" }}>{t("ai_activities_title")}</p>
                  <p className="text-xs" style={{ color: "#64748B" }}>{t("ai_activities_subtitle", { firstName: activeChild.firstName, subject: active.name })}</p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {active.aiRecs.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs text-white" style={{ backgroundColor: sc.color, fontWeight: 700 }}>
                      {i + 1}
                    </div>
                    <p className="text-sm" style={{ color: "#374151", lineHeight: "1.5" }}>{rec}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "#D1FAE5", border: "1px solid #A7F3D0" }}>
                <CheckCircle size={14} style={{ color: "#10B981" }} />
                <p className="text-xs" style={{ color: "#065F46", fontWeight: 500 }}>{t("approved")}</p>
              </div>

              <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                <p className="text-xs mb-1" style={{ fontWeight: 600, color: "#2563EB" }}>{t("weekly_goal")}</p>
                <p className="text-sm" style={{ color: "#1E40AF" }}>
                  {t(weeklyGoalKey, { firstName: activeChild.firstName, pronoun: "they", subject: active.name })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
