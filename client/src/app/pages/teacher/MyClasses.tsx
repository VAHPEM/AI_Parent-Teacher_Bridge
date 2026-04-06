import { useState, useEffect } from "react";
import { Users, TrendingUp, TrendingDown, Minus, ChevronRight, BookOpen, Award } from "lucide-react";
import { api } from "../../lib/api";
import { DEMO_TEACHER_ID } from "../../lib/config";

const gradeColors: Record<string, { bg: string; color: string }> = {
  "A": { bg: "#D1FAE5", color: "#065F46" },
  "B+": { bg: "#DBEAFE", color: "#1E40AF" },
  "B": { bg: "#DBEAFE", color: "#1E40AF" },
  "C+": { bg: "#FEF3C7", color: "#92400E" },
  "C": { bg: "#FEF3C7", color: "#92400E" },
  "D": { bg: "#FEE2E2", color: "#991B1B" },
};

export function MyClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [studentList, setStudentList] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>(`/teacher/classes?teacher_id=${DEMO_TEACHER_ID}`).then((data) => {
      // enrich with UI specific fields if missing
      const enriched = data.map((c, i) => ({
        ...c,
        subjects: ["English", "Mathematics", "Science", "HASS", "Health & PE"],
        topStudents: ["Olivia Chen", "Ava Taylor", "Lucas Davis"], // mock for now if not returned
        concern: i === 0 ? 3 : i === 1 ? 2 : 5,
        color: i === 0 ? "#2563EB" : i === 1 ? "#10B981" : "#F59E0B",
        bg: i === 0 ? "#EFF6FF" : i === 1 ? "#ECFDF5" : "#FFFBEB"
      }));
      setClasses(enriched);
      if (enriched.length > 0) {
        setSelectedClass(enriched[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedClass) {
      api.get<any[]>(`/teacher/classes/${selectedClass}/students`).then(setStudentList);
    }
  }, [selectedClass]);

  const activeClass = classes.find(c => c.id === selectedClass);

  if (!activeClass) return <div>Loading...</div>;

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>My Classes</h1>
          <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Manage and view all your assigned classes</p>
        </div>

        {/* Class selector cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-7">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className="bg-white rounded-2xl p-5 border-2 text-left transition-all hover:shadow-md"
              style={{
                borderColor: selectedClass === cls.id ? cls.color : "#E2E8F0",
                backgroundColor: selectedClass === cls.id ? cls.bg : "white"
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cls.bg }}>
                  <Users size={18} style={{ color: cls.color }} />
                </div>
                {cls.trending === "up" && <TrendingUp size={16} style={{ color: "#10B981" }} />}
                {cls.trending === "down" && <TrendingDown size={16} style={{ color: "#EF4444" }} />}
                {cls.trending === "stable" && <Minus size={16} style={{ color: "#94A3B8" }} />}
              </div>
              <p style={{ fontWeight: 700, color: "#1E293B", fontSize: "1.1rem" }}>{cls.name}</p>
              <p className="text-sm mt-1" style={{ color: "#64748B" }}>{cls.studentCount} students · Avg {cls.avgGrade}</p>
              {cls.concern > 0 && (
                <p className="text-xs mt-2 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: "#FEE2E2", color: "#EF4444", fontWeight: 500 }}>
                  {cls.concern} students need attention
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Class detail */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Subjects */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="mb-4" style={{ fontWeight: 600, color: "#1E293B" }}>
              <BookOpen size={16} className="inline mr-2" style={{ color: "#2563EB" }} />
              Subjects — {activeClass.name}
            </h2>
            <div className="space-y-2">
              {activeClass.subjects.map((sub: string) => (
                <div key={sub} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                  <span className="text-sm" style={{ color: "#1E293B", fontWeight: 500 }}>{sub}</span>
                  <ChevronRight size={15} style={{ color: "#94A3B8" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Student list */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Students — {activeClass.name}</h2>
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>
                {activeClass.studentCount} enrolled
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {studentList.map(student => {
                const gc = gradeColors[student.grade] || { bg: "#F1F5F9", color: "#64748B" };
                return (
                  <div key={student.name} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                      style={{ backgroundColor: student.color, fontWeight: 700 }}>
                      {student.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ fontWeight: 500, color: "#1E293B" }}>{student.name}</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>Focus: English</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: gc.bg, color: gc.color, fontWeight: 600 }}>
                      {student.grade}
                    </span>
                    {student.trend === "up" && <TrendingUp size={14} style={{ color: "#10B981" }} />}
                    {student.trend === "down" && <TrendingDown size={14} style={{ color: "#EF4444" }} />}
                    {student.trend === "stable" && <Minus size={14} style={{ color: "#94A3B8" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top performers */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} style={{ color: "#F59E0B" }} />
            <h2 style={{ fontWeight: 600, color: "#1E293B" }}>Top Performers — {activeClass.name}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {activeClass.topStudents.map((name: string, i: number) => (
              <div key={name} className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: i === 0 ? "#FEF3C7" : "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <span className="text-sm" style={{ fontWeight: 500, color: i === 0 ? "#92400E" : "#1E293B" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
