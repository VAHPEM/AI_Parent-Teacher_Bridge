// Mock data for EduTrack AI

export const students = [
  { id: 1, name: "Liam Anderson", photo: "LA", year: "Year 5", class: "5A", avatar_color: "#3B82F6" },
  { id: 2, name: "Olivia Chen", photo: "OC", year: "Year 5", class: "5A", avatar_color: "#10B981" },
  { id: 3, name: "Noah Williams", photo: "NW", year: "Year 5", class: "5A", avatar_color: "#F59E0B" },
  { id: 4, name: "Sophia Martinez", photo: "SM", year: "Year 5", class: "5A", avatar_color: "#EF4444" },
  { id: 5, name: "Jackson Brown", photo: "JB", year: "导Year 5", class: "5A", avatar_color: "#8B5CF6" },
  { id: 6, name: "Ava Taylor", photo: "AT", year: "Year 5", class: "5A", avatar_color: "#EC4899" },
  { id: 7, name: "Lucas Davis", photo: "LD", year: "Year 5", class: "5A", avatar_color: "#14B8A6" },
  { id: 8, name: "Isabella Wilson", photo: "IW", year: "Year 5", class: "5A", avatar_color: "#F97316" },
];

export const gradeEntryData = [
  {
    id: 1, name: "Liam Anderson", avatar: "LA", avatarColor: "#3B82F6",
    grade: "B", score: 72, participation: "Good",
    comment: "Liam shows strong understanding of narrative structure. Continue to encourage creative expression.",
    concerns: ["Written Expression", "Time Management"]
  },
  {
    id: 2, name: "Olivia Chen", avatar: "OC", avatarColor: "#10B981",
    grade: "A", score: 94, participation: "Excellent",
    comment: "Olivia consistently produces outstanding work. Her reading comprehension is exceptional.",
    concerns: []
  },
  {
    id: 3, name: "Noah Williams", avatar: "NW", avatarColor: "#F59E0B",
    grade: "C", score: 58, participation: "Satisfactory",
    comment: "Noah struggles with comprehension tasks. Additional support recommended.",
    concerns: ["Reading Comprehension", "Focus & Attention", "Verbal Communication"]
  },
  {
    id: 4, name: "Sophia Martinez", avatar: "SM", avatarColor: "#EF4444",
    grade: "B", score: 78, participation: "Good",
    comment: "Sophia demonstrates good understanding. Could benefit from more practice with problem solving.",
    concerns: ["Problem Solving"]
  },
  {
    id: 5, name: "Jackson Brown", avatar: "JB", avatarColor: "#8B5CF6",
    grade: "D", score: 45, participation: "Needs Improvement",
    comment: "Jackson requires significant support. Recommend intervention program.",
    concerns: ["Reading Comprehension", "Numeracy", "Focus & Attention", "Time Management"]
  },
  {
    id: 6, name: "Ava Taylor", avatar: "AT", avatarColor: "#EC4899",
    grade: "A", score: 91, participation: "Excellent",
    comment: "Ava is a pleasure to teach. Her written expression is particularly strong.",
    concerns: []
  },
];

export const aiAnalysisData = [
  {
    id: 1,
    student: "Noah Williams",
    avatar: "NW",
    avatarColor: "#F59E0B",
    year: "Year 5",
    subject: "English",
    status: "auto_approved",
    timestamp: "2 hours ago",
    weakAreas: ["Reading Comprehension", "Written Expression", "Vocabulary Development"],
    curriculumRef: "ACELY1700 - Navigate and read texts for specific purposes",
    recommendations: [
      "Read together for 15 minutes each evening using books at interest level",
      "Practice retelling stories in own words after reading",
      "Use vocabulary flashcards for new words encountered",
      "Visit local library weekly to select self-chosen books"
    ],
    practicePreview: "Story comprehension exercise: 'The Magic Garden' - Answer 5 questions about character motivation and plot sequence...",
    confidence: "high"
  },
  {
    id: 2,
    student: "Jackson Brown",
    avatar: "JB",
    avatarColor: "#8B5CF6",
    year: "Year 5",
    subject: "Mathematics",
    status: "auto_approved",
    timestamp: "3 hours ago",
    weakAreas: ["Multiplication & Division", "Problem Solving", "Number Sense"],
    curriculumRef: "ACMNA100 - Solve problems involving multiplication of large numbers",
    recommendations: [
      "Practice times tables for 10 minutes daily using online games",
      "Use real-world examples: measuring, cooking, shopping",
      "Break word problems into smaller steps together",
      "Khan Academy Kids app for engaging math practice"
    ],
    practicePreview: "Multiplication challenge: Tom has 6 boxes with 24 crayons each. How many crayons total? Show your working...",
    confidence: "high"
  },
  {
    id: 3,
    student: "Liam Anderson",
    avatar: "LA",
    avatarColor: "#3B82F6",
    year: "Year 5",
    subject: "Science",
    status: "auto_approved",
    timestamp: "Yesterday",
    weakAreas: ["Scientific Inquiry Skills", "Data Recording"],
    curriculumRef: "ACSIS086 - With guidance, plan appropriate investigation methods",
    recommendations: [
      "Conduct simple home experiments (growing crystals, making volcanoes)",
      "Keep a science journal to record observations",
      "Watch science documentaries together and discuss findings"
    ],
    practicePreview: "Design an experiment: How does sunlight affect plant growth? Hypothesis, method, results...",
    confidence: "medium"
  },
  {
    id: 4,
    student: "Sophia Martinez",
    avatar: "SM",
    avatarColor: "#EF4444",
    year: "Year 5",
    subject: "Mathematics",
    status: "auto_approved",
    timestamp: "4 hours ago",
    weakAreas: ["Fractions", "Decimals"],
    curriculumRef: "ACMNA105 - Compare, order and represent decimals",
    recommendations: [
      "Use pizza/pie analogies for fraction understanding",
      "Practice with measuring cups and rulers",
      "Online fraction games at mathplayground.com"
    ],
    practicePreview: "Fraction ordering: Place these fractions on a number line: 1/2, 3/4, 1/4, 7/8...",
    confidence: "medium"
  },
  {
    id: 5,
    student: "Lucas Davis",
    avatar: "LD",
    avatarColor: "#14B8A6",
    year: "Year 5",
    subject: "HASS",
    status: "pending",
    timestamp: "1 hour ago",
    weakAreas: ["Historical Thinking", "Source Analysis"],
    curriculumRef: "ACHASSK112 - The nature of the contributions of individuals",
    recommendations: [
      "Visit local museum or historical sites",
      "Read historical fiction books together",
      "Discuss current events and connect to history"
    ],
    practicePreview: "Analyse this primary source document about early Australian settlement...",
    confidence: "low"
  },
  {
    id: 6,
    student: "Isabella Wilson",
    avatar: "IW",
    avatarColor: "#F97316",
    year: "Year 5",
    subject: "English",
    status: "auto_approved",
    timestamp: "Yesterday",
    weakAreas: ["Punctuation", "Sentence Structure"],
    curriculumRef: "ACELA1499 - Understand how ideas can be expanded",
    recommendations: [
      "Practice daily sentences with focus on punctuation",
      "Read aloud to notice natural sentence breaks",
      "Grammar workbook activities 15 minutes per day"
    ],
    practicePreview: "Rewrite these sentences with correct punctuation and varied structure...",
    confidence: "high"
  }
];

export const parentQuestionsData = [
  {
    id: 1,
    parentName: "Sarah Williams",
    childName: "Noah Williams",
    avatar: "SW",
    avatarColor: "#F59E0B",
    question: "Noah has been coming home very upset lately saying he doesn't want to go to school. He mentioned some kids are being mean to him. Is there something happening at school I should know about?",
    flagReason: "Sensitive topic - student wellbeing & potential bullying",
    flagType: "urgent",
    flagIcon: "🚨",
    timestamp: "3 hours ago",
    aiSuggestedResponse: "Thank you for reaching out about Noah. I take all wellbeing concerns very seriously and want to ensure Noah feels safe and supported at school. I would like to schedule a meeting to discuss this in detail and investigate the situation properly. Would you be available for a call this week?",
    priority: "red"
  },
  {
    id: 2,
    parentName: "Michelle Brown",
    childName: "Jackson Brown",
    avatar: "MB",
    avatarColor: "#8B5CF6",
    question: "Jackson's grades have dropped significantly this term. His father and I are going through a separation and I'm worried this is affecting his studies. What can the school do to support him?",
    flagReason: "Family circumstances - sensitive personal situation",
    flagType: "urgent",
    flagIcon: "⚠️",
    timestamp: "5 hours ago",
    aiSuggestedResponse: "I appreciate you sharing this with me, and I want you to know Jackson has wonderful support here at school. Family transitions can affect children in various ways, and we have resources available including our school counsellor. Let's work together to create a support plan for Jackson.",
    priority: "red"
  },
  {
    id: 3,
    parentName: "David Chen",
    childName: "Olivia Chen",
    avatar: "DC",
    avatarColor: "#10B981",
    question: "Olivia seems to be bored in class and says the work is too easy for her. She's been asking about extension programs. Are there any gifted student programs available?",
    flagReason: "Gifted/extension program inquiry - requires teacher confirmation of eligibility",
    flagType: "pending",
    flagIcon: "💡",
    timestamp: "6 hours ago",
    aiSuggestedResponse: "Olivia is indeed performing exceptionally well this term. Our school does have an extension program, and based on her recent assessments, she may be eligible. I'll review her full portfolio and provide you with information about the application process.",
    priority: "orange"
  },
  {
    id: 4,
    parentName: "James Taylor",
    childName: "Ava Taylor",
    avatar: "JT",
    avatarColor: "#EC4899",
    question: "Can you explain how the new AI grading system works? I'm concerned about whether AI is making decisions about my daughter's education without teacher oversight.",
    flagReason: "AI transparency concern - requires detailed teacher explanation",
    flagType: "pending",
    flagIcon: "🤖",
    timestamp: "1 day ago",
    aiSuggestedResponse: "That's a great question and completely valid concern. Our AI system EduTrack AI is a support tool only - all final decisions, grades, and communications are reviewed and approved by myself before being sent. The AI helps me identify patterns and suggest activities, but I have full oversight of everything related to Ava's education.",
    priority: "orange"
  },
  {
    id: 5,
    parentName: "Lisa Anderson",
    childName: "Liam Anderson",
    avatar: "LA",
    avatarColor: "#3B82F6",
    question: "What does Liam's 'B' grade in English actually mean in terms of the Australian Curriculum? How does this compare to the class average?",
    flagReason: "Curriculum explanation required - class comparison data needed",
    flagType: "pending",
    flagIcon: "📊",
    timestamp: "2 days ago",
    aiSuggestedResponse: "A 'B' grade indicates Liam is performing above the expected standard for Year 5 English. On the Australian Curriculum scale, this means he demonstrates high achievement in most areas. The class average this term is a C+, so Liam is performing well above his peers.",
    priority: "yellow"
  }
];

export const performanceChartData = [
  { week: "Week 5", aboveExpected: 8, expected: 12, approaching: 5, below: 3 },
  { week: "Week 6", aboveExpected: 9, expected: 11, approaching: 5, below: 3 },
  { week: "Week 7", aboveExpected: 10, expected: 12, approaching: 4, below: 2 },
  { week: "Week 8", aboveExpected: 11, expected: 12, approaching: 3, below: 2 },
];

export const parentStudentData = {
  name: "Noah Williams",
  year: "Year 5",
  class: "5A",
  teacher: "Ms. Thompson",
  school: "Greenwood Primary School",
  avatar: "NW",
  avatarColor: "#F59E0B",
  overallGrade: "C",
  attendance: "92%",
  recentReports: [
    {
      subject: "English",
      grade: "C",
      trend: "down",
      comment: "Noah is working on improving his reading comprehension. We recommend daily reading practice at home.",
      aiRecommendations: ["Read together for 15 minutes nightly", "Practice retelling stories", "Use vocabulary flashcards"],
      week: "Week 8"
    },
    {
      subject: "Mathematics",
      grade: "C+",
      trend: "up",
      comment: "Noah has shown improvement in basic operations. Focus on multiplication facts.",
      aiRecommendations: ["Times tables practice daily", "Use Khan Academy apps", "Real-world maths activities"],
      week: "Week 8"
    },
    {
      subject: "Science",
      grade: "B",
      trend: "stable",
      comment: "Good participation in class experiments. Keep encouraging curiosity!",
      aiRecommendations: ["Home science experiments", "Science documentaries", "Visit local museum"],
      week: "Week 8"
    }
  ]
};

export const parentQuestionThreads = [
  {
    id: 1,
    subject: "How is Noah going with reading comprehension?",
    teacher: "Ms. Jennifer Thompson",
    teacherInitials: "MT",
    teacherColor: "#2563EB",
    status: "answered",
    priority: "orange",
    createdAt: "March 28",
    messages: [
      { id: 1, from: "parent", content: "Hi Ms. Thompson, I was wondering how Noah is going with his reading comprehension? He seems to be finding it difficult at home.", timestamp: "March 28 · 7:42pm" },
      { id: 2, from: "teacher", content: "Hi Sarah! Thank you for reaching out. Noah is making steady progress with his reading comprehension in class. I've noticed he engages really well during group discussions. I'd recommend trying the 'read aloud and retell' technique. Please don't hesitate to reach out if you have any further questions!", timestamp: "March 29 · 9:15am" },
      { id: 3, from: "parent", content: "Thank you so much! We'll give the retelling technique a go. Should we be worried about his Mathematics as well?", timestamp: "March 30 · 8:20pm" },
      { id: 4, from: "teacher", content: "Great question! Noah's Mathematics is actually showing real improvement this term — up from C to C+ in Week 8. He's working hard on multiplication. The hands-on activities in EduTrack AI should help too. Keep encouraging him!", timestamp: "March 31 · 8:45am" },
    ]
  },
  {
    id: 2,
    subject: "Noah has been upset and doesn't want to come to school",
    teacher: "Ms. Jennifer Thompson",
    teacherInitials: "MT",
    teacherColor: "#2563EB",
    status: "pending",
    priority: "red",
    createdAt: "Today · 9:00am",
    messages: [
      { id: 1, from: "parent", content: "Noah has been coming home very upset lately saying he doesn't want to go to school. He mentioned some kids are being mean to him. Is there something happening at school I should know about?", timestamp: "Today · 9:00am" },
    ]
  },
  {
    id: 3,
    subject: "Question about Maths times tables practice",
    teacher: "Mr. Robert Davis",
    teacherInitials: "RD",
    teacherColor: "#8B5CF6",
    status: "answered",
    priority: "orange",
    createdAt: "March 25",
    messages: [
      { id: 1, from: "parent", content: "Hi Mr. Davis, Noah seems to be struggling with his times tables. Do you have any tips for how we can practise at home?", timestamp: "March 25 · 6:30pm" },
      { id: 2, from: "teacher", content: "Hi Sarah! Great initiative reaching out. I recommend using multiplication flashcards for 10 minutes a day, and the Khan Academy Kids app is fantastic for making it fun. We can also try real-world scenarios like counting items at the supermarket. Noah's showing great effort in class!", timestamp: "March 26 · 8:00am" },
    ]
  },
];

export const parentTeachers = [
  {
    id: 1,
    name: "Ms. Jennifer Thompson",
    initials: "MT",
    color: "#2563EB",
    subject: "English & Homeroom",
    year: "Year 5A",
    email: "j.thompson@greenwoodps.edu.au",
    phone: "(03) 9555 0100",
    consultHours: "Tue & Thu 3:30–4:30pm",
    responseTime: "Usually within 24hrs",
    unread: 1,
    messages: [
      { id: 1, from: "parent", content: "Hi Ms. Thompson, I was wondering how Noah is going with his reading comprehension? He seems to be finding it difficult at home.", timestamp: "March 28 · 7:42pm", status: "read" },
      { id: 2, from: "teacher", content: "Hi Sarah! Thank you for reaching out. Noah is making steady progress with his reading comprehension in class. I've noticed he engages really well during group discussions. I'd recommend trying the activities I've sent through EduTrack AI — particularly the 'read aloud and retell' technique. Please don't hesitate to reach out if you have any further questions!", timestamp: "March 29 · 9:15am", status: "read" },
      { id: 3, from: "parent", content: "Thank you so much! We'll give the retelling technique a go. Should we be worried about his Mathematics as well?", timestamp: "March 30 · 8:20pm", status: "read" },
      { id: 4, from: "teacher", content: "Great question! Noah's Mathematics is actually showing real improvement this term — up from C to C+ in Week 8. He's working hard on multiplication. The hands-on activities in EduTrack AI should help too. Keep encouraging him!", timestamp: "March 31 · 8:45am", status: "read" },
      { id: 5, from: "parent", content: "Noah has been coming home very upset lately saying he doesn't want to go to school. He mentioned some kids are being mean to him. Is there something happening at school I should know about?", timestamp: "Today · 9:00am", status: "delivered" }
    ]
  },
  {
    id: 2,
    name: "Mr. Robert Davis",
    initials: "RD",
    color: "#8B5CF6",
    subject: "Mathematics",
    year: "Year 5A",
    email: "r.davis@greenwoodps.edu.au",
    phone: "(03) 9555 0101",
    consultHours: "Mon & Wed 3:30–4:30pm",
    responseTime: "Usually within 48hrs",
    unread: 0,
    messages: [
      { id: 1, from: "parent", content: "Hi Mr. Davis, Noah seems to be struggling with his times tables. Do you have any tips for how we can practise at home?", timestamp: "March 25 · 6:30pm", status: "read" },
      { id: 2, from: "teacher", content: "Hi Sarah! Great initiative reaching out. I recommend using multiplication flashcards for 10 minutes a day, and the Khan Academy Kids app is fantastic for making it fun. We can also try real-world scenarios like counting items at the supermarket. Noah's showing great effort in class!", timestamp: "March 26 · 8:00am", status: "read" }
    ]
  }
];

export const chatbotResponses = {
  high: [
    { question: "What grade did Noah get in maths?", answer: "Noah received a C+ in Mathematics this week (Week 8, Term 2). His score was 62% on the recent assessment. He has shown improvement from last week's C grade, particularly in basic operations." },
    { question: "What homework should I do with my child?", answer: "Based on Noah's current assessment, I recommend: 1) Daily times tables practice (10 mins), 2) Reading together for 15 minutes each evening, 3) Khan Academy Kids app for engaging math practice. These activities align with his identified learning areas." }
  ],
  medium: [
    { question: "Is my child being bullied?", answer: "I want to flag this for Ms. Thompson's direct attention. While I can see Noah's wellbeing notes in his file, any concerns about bullying or student safety should be addressed directly with his teacher. I've notified Ms. Thompson of your question." }
  ],
  low: [
    { question: "Should my child be in extension classes?", answer: "This requires teacher assessment. Based on Noah's current grades, I don't have sufficient information to make this recommendation. Ms. Thompson would be best placed to evaluate this — I've flagged your question for her review." }
  ]
};
