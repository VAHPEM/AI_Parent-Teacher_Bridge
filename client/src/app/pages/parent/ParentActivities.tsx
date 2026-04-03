import { useState } from "react";
import { BookOpen, Calculator, FlaskConical, Sparkles, CheckCircle, Star, Clock, Play, ChevronDown, ChevronUp } from "lucide-react";
import { useActiveChild } from "../../context/ParentChildContext";

const activities = [
  {
    id: 1,
    subject: "English",
    icon: <BookOpen size={18} />,
    color: "#2563EB",
    bg: "#EFF6FF",
    title: "The Magic Garden — Story Comprehension",
    type: "Reading Activity",
    duration: "20 minutes",
    difficulty: "Medium",
    description: "Read the short story 'The Magic Garden' together with Noah, then answer 5 comprehension questions about character motivation and plot sequence.",
    steps: [
      "Find a quiet place and read the story aloud together (Noah reading, you supporting)",
      "Pause at key moments and ask: 'Why do you think the character did that?'",
      "After reading, answer the 5 questions below",
      "Discuss any new vocabulary words you encountered",
    ],
    questions: [
      "Why did Maya decide to enter the garden?",
      "What problem did Maya face and how did she solve it?",
      "Describe the garden using 3 adjectives from the story",
    ],
    aiGenerated: true,
    completed: false,
    curriculumRef: "ACELY1700",
    confidence: "high"
  },
  {
    id: 2,
    subject: "Mathematics",
    icon: <Calculator size={18} />,
    color: "#10B981",
    bg: "#ECFDF5",
    title: "Multiplication Challenge — Real World Maths",
    type: "Hands-on Activity",
    duration: "15 minutes",
    difficulty: "Easy",
    description: "Use everyday objects around the house to practice multiplication facts in a fun, real-world context.",
    steps: [
      "Gather some household items (e.g., cups, coins, blocks)",
      "Set up groups: 'If we have 6 cups and put 4 pencils in each, how many pencils total?'",
      "Practice with 3 different real-world scenarios",
      "Try the word problem at the end",
    ],
    questions: [
      "Tom has 6 boxes with 24 crayons each. How many crayons total?",
      "A classroom has 7 rows of 5 desks. How many desks altogether?",
    ],
    aiGenerated: true,
    completed: true,
    curriculumRef: "ACMNA100",
    confidence: "high"
  },
  {
    id: 3,
    subject: "Science",
    icon: <FlaskConical size={18} />,
    color: "#8B5CF6",
    bg: "#EDE9FE",
    title: "Home Experiment — Does sunlight affect plant growth?",
    type: "Science Experiment",
    duration: "1 week (5 mins/day)",
    difficulty: "Easy",
    description: "Conduct a simple home experiment to investigate how sunlight affects plant growth. This aligns with Noah's science unit on living things.",
    steps: [
      "Plant 2 bean seeds in small pots with the same soil",
      "Place one in a sunny windowsill and one in a dark cupboard",
      "Water both the same amount each day",
      "Record observations in a simple journal each day",
      "After 7 days, compare and discuss the results",
    ],
    questions: [
      "What did you predict would happen? Was your prediction correct?",
      "What would happen if you used different amounts of water?",
    ],
    aiGenerated: true,
    completed: false,
    curriculumRef: "ACSIS086",
    confidence: "high"
  },
  {
    id: 4,
    subject: "English",
    icon: <BookOpen size={18} />,
    color: "#2563EB",
    bg: "#EFF6FF",
    title: "Vocabulary Flashcard Practice",
    type: "Word Study",
    duration: "10 minutes",
    difficulty: "Easy",
    description: "Build Noah's vocabulary using these 10 words from his current reading. Practice saying, defining, and using each word in a sentence.",
    steps: [
      "Write each word on a small card",
      "Say the word together and find it in the dictionary",
      "Come up with a funny sentence using the word",
      "Test each other — make it a game!",
    ],
    questions: [],
    aiGenerated: true,
    completed: false,
    curriculumRef: "ACELA1498",
    confidence: "medium"
  },
];

const confidenceConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  high: { label: "Approved by Teacher", color: "#10B981", bg: "#D1FAE5", icon: <CheckCircle size={12} /> },
  medium: { label: "AI Suggested", color: "#3B82F6", bg: "#DBEAFE", icon: <Sparkles size={12} /> },
};

const difficultyConfig: Record<string, { color: string; bg: string }> = {
  Easy: { color: "#10B981", bg: "#D1FAE5" },
  Medium: { color: "#F59E0B", bg: "#FEF3C7" },
  Hard: { color: "#EF4444", bg: "#FEE2E2" },
};

export function ParentActivities() {
  const { activeChild: student } = useActiveChild();
  const [completed, setCompleted] = useState<Set<number>>(new Set(activities.filter(a => a.completed).map(a => a.id)));
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]));
  const [filterSubject, setFilterSubject] = useState("All");

  const toggleComplete = (id: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const subjects = ["All", "English", "Mathematics", "Science"];
  const filtered = filterSubject === "All" ? activities : activities.filter(a => a.subject === filterSubject);
  const completedCount = activities.filter(a => completed.has(a.id)).length;

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>Learning Activities for Home</h1>
          <p className="mt-1 text-sm" style={{ color: "#64748B" }}>AI-generated activities personalised for {student.firstName} · Approved by Ms. Thompson</p>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star size={16} style={{ color: "#F59E0B" }} />
              <span style={{ fontWeight: 600, color: "#1E293B" }}>This Week's Progress</span>
            </div>
            <span className="text-sm" style={{ color: "#64748B" }}>{completedCount} of {activities.length} activities completed</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / activities.length) * 100}%`, backgroundColor: "#10B981" }} />
          </div>
          {completedCount === activities.length && (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "#065F46" }}>
              <CheckCircle size={15} style={{ color: "#10B981" }} />
              <span style={{ fontWeight: 500 }}>All activities completed this week! Excellent work, {student.firstName}! 🎉</span>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {subjects.map(sub => (
            <button
              key={sub}
              onClick={() => setFilterSubject(sub)}
              className="px-4 py-2 rounded-xl text-sm transition-all"
              style={{
                backgroundColor: filterSubject === sub ? "#2563EB" : "white",
                color: filterSubject === sub ? "white" : "#64748B",
                border: filterSubject === sub ? "none" : "1px solid #E2E8F0",
                fontWeight: filterSubject === sub ? 600 : 400
              }}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Activity cards */}
        <div className="space-y-4">
          {filtered.map(activity => {
            const isCompleted = completed.has(activity.id);
            const isExpanded = expanded.has(activity.id);
            const conf = confidenceConfig[activity.confidence];
            const diff = difficultyConfig[activity.difficulty];

            return (
              <div key={activity.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                style={{ opacity: isCompleted ? 0.8 : 1 }}>
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: activity.bg }}>
                      <span style={{ color: activity.color }}>{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: activity.bg, color: activity.color, fontWeight: 500 }}>
                              {activity.subject}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: diff.bg, color: diff.color, fontWeight: 500 }}>
                              {activity.difficulty}
                            </span>
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: conf.bg, color: conf.color, fontWeight: 500 }}>
                              {conf.icon}{conf.label}
                            </span>
                            {isCompleted && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#D1FAE5", color: "#065F46", fontWeight: 500 }}>
                                <CheckCircle size={11} />Done!
                              </span>
                            )}
                          </div>
                          <p className="text-sm" style={{ fontWeight: 700, color: "#1E293B" }}>{activity.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs" style={{ color: "#94A3B8" }}>
                              <Clock size={11} />{activity.duration}
                            </span>
                            <span className="text-xs" style={{ color: "#94A3B8" }}>{activity.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleComplete(activity.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all hover:opacity-80"
                            style={{
                              backgroundColor: isCompleted ? "#D1FAE5" : "#EFF6FF",
                              color: isCompleted ? "#065F46" : "#2563EB",
                              fontWeight: 600,
                              border: `1px solid ${isCompleted ? "#A7F3D0" : "#BFDBFE"}`
                            }}
                          >
                            {isCompleted ? <><CheckCircle size={13} />Done</> : <><Play size={13} />Mark Done</>}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm mt-2" style={{ color: "#64748B", lineHeight: "1.6" }}>{activity.description.replace(/Noah/g, student.firstName).replace(/his/g, student.firstName === 'Ella' ? 'her' : 'his')}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleExpand(activity.id)}
                    className="flex items-center gap-1.5 text-xs mt-3 hover:underline"
                    style={{ color: activity.color, fontWeight: 500 }}
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {isExpanded ? "Hide steps" : "Show steps & questions"}
                  </button>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs mb-2" style={{ fontWeight: 600, color: "#64748B" }}>HOW TO DO IT</p>
                        <ol className="space-y-2">
                          {activity.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: "#374151" }}>
                              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white mt-0.5" style={{ backgroundColor: activity.color, fontSize: "10px", fontWeight: 700 }}>
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      {activity.questions.length > 0 && (
                        <div>
                          <p className="text-xs mb-2" style={{ fontWeight: 600, color: "#64748B" }}>DISCUSSION QUESTIONS</p>
                          <div className="space-y-2">
                            {activity.questions.map((q, i) => (
                              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg text-xs" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", color: "#374151" }}>
                                <span style={{ color: activity.color, fontWeight: 700 }}>Q{i + 1}.</span>
                                {q}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
                      <Sparkles size={11} style={{ color: activity.color }} />
                      <span>Australian Curriculum: {activity.curriculumRef}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
