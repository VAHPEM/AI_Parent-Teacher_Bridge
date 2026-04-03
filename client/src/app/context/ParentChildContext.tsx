import { createContext, useContext, useState } from "react";

export interface ChildProfile {
  id: number;
  name: string;
  firstName: string;
  initials: string;
  color: string;
  year: string;
  class: string;
  teacher: string;
  school: string;
  overallGrade: string;
  attendance: string;
  recentReports: {
    subject: string;
    grade: string;
    trend: string;
    comment: string;
    aiRecommendations: string[];
    week: string;
  }[];
  progressHistory: { week: string; English: number; Mathematics: number; Science: number }[];
  subjects: {
    name: string;
    grade: string;
    score: number;
    trend: string;
    color: string;
    bg: string;
    level: string;
    levelColor: string;
    levelBg: string;
    curriculumRef: string;
    teacherComment: string;
    weakAreas: string[];
    strengths: string[];
    aiRecs: string[];
    achievement: string;
  }[];
}

export const children: ChildProfile[] = [
  {
    id: 1,
    name: "Noah Williams",
    firstName: "Noah",
    initials: "NW",
    color: "#F59E0B",
    year: "Year 5",
    class: "5A",
    teacher: "Ms. Thompson",
    school: "Greenwood Primary School",
    overallGrade: "C",
    attendance: "92%",
    recentReports: [
      {
        subject: "English", grade: "C", trend: "down",
        comment: "Noah is working on improving his reading comprehension. We recommend daily reading practice at home.",
        aiRecommendations: ["Read together for 15 minutes nightly", "Practice retelling stories", "Use vocabulary flashcards"],
        week: "Week 8"
      },
      {
        subject: "Mathematics", grade: "C+", trend: "up",
        comment: "Noah has shown improvement in basic operations. Focus on multiplication facts.",
        aiRecommendations: ["Times tables practice daily", "Use Khan Academy apps", "Real-world maths activities"],
        week: "Week 8"
      },
      {
        subject: "Science", grade: "B", trend: "stable",
        comment: "Good participation in class experiments. Keep encouraging curiosity!",
        aiRecommendations: ["Home science experiments", "Science documentaries", "Visit local museum"],
        week: "Week 8"
      },
    ],
    progressHistory: [
      { week: "Wk 5", English: 55, Mathematics: 50, Science: 72 },
      { week: "Wk 6", English: 58, Mathematics: 55, Science: 74 },
      { week: "Wk 7", English: 56, Mathematics: 62, Science: 76 },
      { week: "Wk 8", English: 60, Mathematics: 68, Science: 78 },
    ],
    subjects: [
      {
        name: "English", grade: "C", score: 60, trend: "up",
        color: "#2563EB", bg: "#EFF6FF", level: "At Expected", levelColor: "#F59E0B", levelBg: "#FEF3C7",
        curriculumRef: "ACELY1700",
        teacherComment: "Noah is working on improving his reading comprehension. He participates well in class discussions and is beginning to show improvement in written expression.",
        weakAreas: ["Reading Comprehension", "Written Expression", "Vocabulary Development"],
        strengths: ["Oral Communication", "Creative Thinking"],
        aiRecs: ["Read together for 15 minutes each evening", "Practice retelling stories in your own words", "Use vocabulary flashcards for new words", "Visit the local library weekly to choose books"],
        achievement: "Noah can read and comprehend familiar texts with some guidance. He is working towards independently analysing unfamiliar texts."
      },
      {
        name: "Mathematics", grade: "C+", score: 68, trend: "up",
        color: "#10B981", bg: "#ECFDF5", level: "At Expected", levelColor: "#F59E0B", levelBg: "#FEF3C7",
        curriculumRef: "ACMNA100",
        teacherComment: "Noah has shown great improvement in Mathematics this term! He is getting stronger with multiplication and is beginning to tackle multi-step word problems.",
        weakAreas: ["Multi-step Problem Solving", "Fractions"],
        strengths: ["Basic Operations", "Measurement"],
        aiRecs: ["Practice times tables for 10 minutes daily", "Use real-world examples: cooking measurements, shopping totals", "Try Khan Academy Kids app for engaging practice", "Play multiplication card games together"],
        achievement: "Noah demonstrates understanding of multiplication facts and can solve routine word problems. He is developing skills in fraction concepts."
      },
      {
        name: "Science", grade: "B", score: 78, trend: "stable",
        color: "#8B5CF6", bg: "#EDE9FE", level: "Above Expected", levelColor: "#10B981", levelBg: "#D1FAE5",
        curriculumRef: "ACSIS086",
        teacherComment: "Noah shows genuine curiosity in Science and asks insightful questions. His lab work is careful and methodical. A real strength area!",
        weakAreas: ["Scientific Report Writing"],
        strengths: ["Experimental Design", "Observation Skills", "Scientific Curiosity"],
        aiRecs: ["Conduct simple home experiments (growing crystals, making volcanoes)", "Keep a science journal to record observations", "Watch science documentaries together on ABC iview", "Visit Scienceworks or the local museum"],
        achievement: "Noah consistently demonstrates above-expected skills in scientific inquiry. He can plan and conduct investigations with increasing independence."
      },
    ],
  },
  {
    id: 2,
    name: "Ella Williams",
    firstName: "Ella",
    initials: "EW",
    color: "#8B5CF6",
    year: "Year 4",
    class: "4D",
    teacher: "Mr. Harris",
    school: "Greenwood Primary School",
    overallGrade: "B",
    attendance: "97%",
    recentReports: [
      {
        subject: "English", grade: "B+", trend: "up",
        comment: "Ella is an enthusiastic reader and her written expression is a real strength. Keep up the great work!",
        aiRecommendations: ["Encourage creative writing at home", "Try reading different genres", "Join the school book club"],
        week: "Week 8"
      },
      {
        subject: "Mathematics", grade: "B", trend: "stable",
        comment: "Ella demonstrates solid understanding of number concepts. Working on improving her speed with mental arithmetic.",
        aiRecommendations: ["Mental maths games", "Maths board games like Maths War", "Practice skip counting"],
        week: "Week 8"
      },
      {
        subject: "HASS", grade: "A", trend: "up",
        comment: "Ella produced an outstanding project on Australian communities. Her research skills are exceptional for Year 4.",
        aiRecommendations: ["Visit local historical sites", "Watch documentaries about Australian history", "Explore community events together"],
        week: "Week 8"
      },
    ],
    progressHistory: [
      { week: "Wk 5", English: 76, Mathematics: 72, Science: 68 },
      { week: "Wk 6", English: 78, Mathematics: 73, Science: 70 },
      { week: "Wk 7", English: 80, Mathematics: 74, Science: 71 },
      { week: "Wk 8", English: 83, Mathematics: 75, Science: 73 },
    ],
    subjects: [
      {
        name: "English", grade: "B+", score: 83, trend: "up",
        color: "#2563EB", bg: "#EFF6FF", level: "Above Expected", levelColor: "#10B981", levelBg: "#D1FAE5",
        curriculumRef: "ACELY1650",
        teacherComment: "Ella is an enthusiastic and confident reader. Her written expression is creative and well-structured. She consistently goes above and beyond in her writing tasks.",
        weakAreas: ["Punctuation in complex sentences"],
        strengths: ["Creative Writing", "Reading Fluency", "Comprehension"],
        aiRecs: ["Encourage creative writing journals at home", "Try reading different genres — fantasy, non-fiction", "Play word games like Scrabble or Boggle", "Read aloud together to build expression"],
        achievement: "Ella demonstrates above-expected skills in reading and writing. She can independently construct well-structured texts for a variety of purposes."
      },
      {
        name: "Mathematics", grade: "B", score: 75, trend: "stable",
        color: "#10B981", bg: "#ECFDF5", level: "Above Expected", levelColor: "#10B981", levelBg: "#D1FAE5",
        curriculumRef: "ACMNA079",
        teacherComment: "Ella has a solid grasp of number concepts and is building confidence with mental arithmetic. She works well during group problem-solving activities.",
        weakAreas: ["Mental Arithmetic Speed", "Division"],
        strengths: ["Number Patterns", "Geometry", "Data & Graphs"],
        aiRecs: ["Practice mental maths for 5 minutes daily", "Play Maths War card games", "Use everyday cooking to explore fractions", "Try prodigy maths app for engaging practice"],
        achievement: "Ella demonstrates above-expected understanding of number and algebra concepts. She applies mathematical thinking to solve problems in familiar contexts."
      },
      {
        name: "HASS", grade: "A", score: 91, trend: "up",
        color: "#F59E0B", bg: "#FEF3C7", level: "Above Expected", levelColor: "#10B981", levelBg: "#D1FAE5",
        curriculumRef: "ACHASSK085",
        teacherComment: "Ella produced an outstanding project on Australian communities. Her research skills and ability to present ideas clearly are exceptional for Year 4. A standout student!",
        weakAreas: [],
        strengths: ["Research Skills", "Presentation", "Critical Thinking", "Historical Understanding"],
        aiRecs: ["Visit local historical sites and museums", "Watch ABC Education documentaries on Australian history", "Explore community events together", "Encourage Ella to keep a current events journal"],
        achievement: "Ella demonstrates exceptional skills in humanities and social sciences. She can independently research, analyse, and present findings to a high standard."
      },
    ],
  },
];

interface ParentChildContextType {
  activeChild: ChildProfile;
  setActiveChildId: (id: number) => void;
}

const ParentChildContext = createContext<ParentChildContextType>({
  activeChild: children[0],
  setActiveChildId: () => {},
});

export function ParentChildProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const [activeChildId, setActiveChildId] = useState(1);
  const activeChild = children.find(c => c.id === activeChildId) || children[0];

  return (
    <ParentChildContext.Provider value={{ activeChild, setActiveChildId }}>
      {reactChildren}
    </ParentChildContext.Provider>
  );
}

export function useActiveChild() {
  return useContext(ParentChildContext);
}
