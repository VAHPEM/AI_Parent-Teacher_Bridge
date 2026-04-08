-- =========================================================
-- DROP TABLES
-- =========================================================
DROP TABLE IF EXISTS translation_cache CASCADE;
DROP TABLE IF EXISTS parent_feedback CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS question_replies CASCADE;
DROP TABLE IF EXISTS parent_questions CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS ai_reports CASCADE;
DROP TABLE IF EXISTS weekly_records CASCADE;
DROP TABLE IF EXISTS weekly_observations CASCADE;
DROP TABLE IF EXISTS assessment_scores CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS class_subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS canvas_sync_logs CASCADE;


-- =========================================================
-- TEACHERS
-- =========================================================
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- PARENTS
-- =========================================================
CREATE TABLE parents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    preferred_language VARCHAR(20) DEFAULT 'en',
    prefers_voice BOOLEAN DEFAULT FALSE,
    notifications JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- CLASSES
-- =========================================================
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50),
    teacher_id INT REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- SUBJECTS
-- =========================================================
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- CLASS_SUBJECTS
-- =========================================================
CREATE TABLE class_subjects (
    id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE (class_id, subject_id)
);


-- =========================================================
-- STUDENTS
-- =========================================================
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    class_id INT REFERENCES classes(id) ON DELETE SET NULL,
    class_name VARCHAR(50),
    grade_level VARCHAR(20),
    parent_id INT REFERENCES parents(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- ASSESSMENTS
-- =========================================================
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    assessment_name VARCHAR(255) NOT NULL,
    assessment_type VARCHAR(100),
    term VARCHAR(50),
    week_number INT,
    due_date DATE,
    max_score NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- ASSESSMENT_SCORES
-- =========================================================
CREATE TABLE assessment_scores (
    id SERIAL PRIMARY KEY,
    assessment_id INT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    score NUMERIC(10,2),
    grade VARCHAR(20),
    participation VARCHAR(100),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (assessment_id, student_id)
);


-- =========================================================
-- WEEKLY_RECORDS
-- teammate AI-module style weekly input
-- =========================================================
CREATE TABLE weekly_records (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    subject VARCHAR(50) NOT NULL,
    skill VARCHAR(100),
    score NUMERIC(4,1),
    teacher_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- WEEKLY_OBSERVATIONS
-- optional teacher weekly note, separate from scores
-- =========================================================
CREATE TABLE weekly_observations (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id INT REFERENCES teachers(id) ON DELETE SET NULL,
    class_id INT REFERENCES classes(id) ON DELETE SET NULL,
    subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
    term VARCHAR(50),
    week_number INT NOT NULL,
    participation TEXT,
    trend VARCHAR(100),
    concerns TEXT,
    teacher_comment TEXT,
    curriculum_ref VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- AI_REPORTS
-- merged from your design + teammate's AI module
-- =========================================================
CREATE TABLE ai_reports (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    week_number INT,
    term VARCHAR(50),
    summary TEXT,
    strengths JSONB,
    support_areas JSONB,
    recommendations JSONB,
    risk_level VARCHAR(20),
    curriculum_ref VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    teacher_approved BOOLEAN DEFAULT FALSE,
    teacher_notes TEXT,
    sent_to_parent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- ACTIVITIES
-- =========================================================
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    ai_report_id INT REFERENCES ai_reports(id) ON DELETE SET NULL,
    subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    activity_type VARCHAR(100),
    duration VARCHAR(50),
    difficulty VARCHAR(50),
    description TEXT,
    steps JSONB,
    curriculum_ref VARCHAR(255),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- PARENT_QUESTIONS
-- parent asks teacher
-- =========================================================
CREATE TABLE parent_questions (
    id SERIAL PRIMARY KEY,
    parent_id INT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    original_content TEXT,
    original_language VARCHAR(10),
    priority VARCHAR(50),
    status VARCHAR(50) DEFAULT 'open',
    flag_reason VARCHAR(255),
    ai_suggested_response TEXT,
    call_scheduled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- QUESTION_REPLIES
-- =========================================================
CREATE TABLE question_replies (
    id SERIAL PRIMARY KEY,
    question_id INT NOT NULL REFERENCES parent_questions(id) ON DELETE CASCADE,
    from_role VARCHAR(50) NOT NULL,
    from_id INT,
    content TEXT NOT NULL,
    original_content TEXT,
    original_language VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- CHAT_SESSIONS
-- One session = one conversation thread, tied to a language
-- =========================================================
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id INT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    title VARCHAR(255),
    language VARCHAR(20) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- CHAT_MESSAGES
-- parent <-> AI chat, scoped to a session
-- =========================================================
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'ai')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- PARENT_FEEDBACK
-- teammate AI-module table
-- =========================================================
CREATE TABLE parent_feedback (
    id SERIAL PRIMARY KEY,
    report_id INT REFERENCES ai_reports(id) ON DELETE CASCADE,
    parent_id INT REFERENCES parents(id) ON DELETE CASCADE,
    feedback_text TEXT,
    status VARCHAR(30),
    needs_teacher_followup BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- CANVAS_SYNC_LOGS
-- =========================================================
CREATE TABLE canvas_sync_logs (
    id SERIAL PRIMARY KEY,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    records_count INT DEFAULT 0,
    status VARCHAR(50),
    trigger_type VARCHAR(50)
);


-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_parent_id ON students(parent_id);

CREATE INDEX idx_assessments_subject_id ON assessments(subject_id);

CREATE INDEX idx_assessment_scores_assessment_id ON assessment_scores(assessment_id);
CREATE INDEX idx_assessment_scores_student_id ON assessment_scores(student_id);

CREATE INDEX idx_weekly_records_student_id ON weekly_records(student_id);

CREATE INDEX idx_weekly_observations_student_id ON weekly_observations(student_id);
CREATE INDEX idx_weekly_observations_teacher_id ON weekly_observations(teacher_id);

CREATE INDEX idx_ai_reports_student_id ON ai_reports(student_id);
CREATE INDEX idx_ai_reports_status ON ai_reports(status);

CREATE INDEX idx_activities_student_id ON activities(student_id);

CREATE INDEX idx_parent_questions_student_id ON parent_questions(student_id);
CREATE INDEX idx_parent_questions_parent_id ON parent_questions(parent_id);

CREATE INDEX idx_question_replies_question_id ON question_replies(question_id);

CREATE INDEX idx_chat_sessions_student_id ON chat_sessions(student_id);
CREATE INDEX idx_chat_sessions_parent_id ON chat_sessions(parent_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

CREATE INDEX idx_parent_feedback_report_id ON parent_feedback(report_id);
CREATE INDEX idx_parent_feedback_parent_id ON parent_feedback(parent_id);

-- =========================================================
-- TRANSLATION CACHE
-- =========================================================
CREATE TABLE translation_cache (
    id SERIAL PRIMARY KEY,
    payload_hash VARCHAR(64) NOT NULL,
    language VARCHAR(10) NOT NULL,
    translated_payload TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_translation_cache_hash_lang ON translation_cache(payload_hash, language);

-- =========================================================
-- DEMO DATA
-- 2 parents, each has 2 children
-- 2 teachers, each teaches 1 child from each parent
-- 5 subjects
-- a few assessments per subject
-- =========================================================

-- Teachers
INSERT INTO teachers (name, email)
VALUES
    ('Emma Wilson', 'emma.wilson@school.edu.au'),
    ('James Carter', 'james.carter@school.edu.au');

-- Classes
INSERT INTO classes (name, grade_level, teacher_id)
VALUES
    ('5A', 'Year 5', 1),
    ('5B', 'Year 5', 2);

-- Parents
INSERT INTO parents (name, email, phone, preferred_language, prefers_voice)
VALUES
    ('Sarah Johnson', 'sarah.johnson@email.com', '0400000001', 'en', TRUE),
    ('Minh Nguyen', 'minh.nguyen@email.com', '0400000002', 'en', FALSE);

-- Students
INSERT INTO students (student_code, name, class_id, class_name, grade_level, parent_id)
VALUES
    ('S001', 'Liam Johnson', 1, '5A', 'Year 5', 1),
    ('S002', 'Ava Johnson', 2, '5B', 'Year 5', 1),
    ('S003', 'Ethan Nguyen', 1, '5A', 'Year 5', 2),
    ('S004', 'Chloe Nguyen', 2, '5B', 'Year 5', 2);

-- Subjects
INSERT INTO subjects (subject_name)
VALUES
    ('Mathematics'),
    ('English'),
    ('Science'),
    ('HASS'),
    ('Health & PE');

-- Both classes teach all 5 subjects
INSERT INTO class_subjects (class_id, subject_id)
SELECT c.id, s.id
FROM classes c
CROSS JOIN subjects s;

-- Assessments: 2 assessments per subject for each of weeks 6, 7, 8
INSERT INTO assessments (subject_id, assessment_name, assessment_type, term, week_number, due_date, max_score)
SELECT s.id, a.name, a.assessment_type, a.term, a.week_number, a.due_date, 100
FROM subjects s
JOIN (
    VALUES
        ('English', 'Reading Comprehension Quiz', 'Quiz', 'Term 2', 6, DATE '2026-05-11'),
        ('English', 'Writing Task', 'Assignment', 'Term 2', 6, DATE '2026-05-13'),
        ('English', 'Vocabulary Test', 'Quiz', 'Term 2', 7, DATE '2026-05-18'),
        ('English', 'Short Response Task', 'Worksheet', 'Term 2', 7, DATE '2026-05-20'),
        ('English', 'Mid-Term English Assessment', 'Test', 'Term 2', 8, DATE '2026-05-25'),
        ('English', 'Presentation Reflection', 'Project', 'Term 2', 8, DATE '2026-05-27'),

        ('Mathematics', 'Number & Algebra Quiz', 'Quiz', 'Term 2', 6, DATE '2026-05-11'),
        ('Mathematics', 'Problem Solving Worksheet', 'Worksheet', 'Term 2', 6, DATE '2026-05-13'),
        ('Mathematics', 'Fractions Test', 'Quiz', 'Term 2', 7, DATE '2026-05-18'),
        ('Mathematics', 'Data & Statistics Task', 'Worksheet', 'Term 2', 7, DATE '2026-05-20'),
        ('Mathematics', 'Mid-Term Maths Test', 'Test', 'Term 2', 8, DATE '2026-05-25'),
        ('Mathematics', 'Geometry Project', 'Project', 'Term 2', 8, DATE '2026-05-27'),

        ('Science', 'Science Concepts Quiz', 'Quiz', 'Term 2', 6, DATE '2026-05-12'),
        ('Science', 'Lab Observation Report', 'Worksheet', 'Term 2', 6, DATE '2026-05-14'),
        ('Science', 'Inquiry Skills Test', 'Quiz', 'Term 2', 7, DATE '2026-05-19'),
        ('Science', 'Hypothesis Worksheet', 'Worksheet', 'Term 2', 7, DATE '2026-05-21'),
        ('Science', 'Mid-Term Science Test', 'Test', 'Term 2', 8, DATE '2026-05-26'),
        ('Science', 'Science Fair Project', 'Project', 'Term 2', 8, DATE '2026-05-28'),

        ('HASS', 'Geography Quiz', 'Quiz', 'Term 2', 6, DATE '2026-05-12'),
        ('HASS', 'History Source Analysis', 'Worksheet', 'Term 2', 6, DATE '2026-05-14'),
        ('HASS', 'Civics & Citizenship Test', 'Quiz', 'Term 2', 7, DATE '2026-05-19'),
        ('HASS', 'Economics Reflection Task', 'Worksheet', 'Term 2', 7, DATE '2026-05-21'),
        ('HASS', 'Mid-Term HASS Assessment', 'Test', 'Term 2', 8, DATE '2026-05-26'),
        ('HASS', 'Community Project', 'Project', 'Term 2', 8, DATE '2026-05-28'),

        ('Health & PE', 'Fitness Skills Quiz', 'Quiz', 'Term 2', 6, DATE '2026-05-13'),
        ('Health & PE', 'Movement Assessment', 'Practical', 'Term 2', 6, DATE '2026-05-15'),
        ('Health & PE', 'Health & Wellbeing Test', 'Quiz', 'Term 2', 7, DATE '2026-05-20'),
        ('Health & PE', 'Sports Skills Worksheet', 'Worksheet', 'Term 2', 7, DATE '2026-05-22'),
        ('Health & PE', 'Mid-Term PE Assessment', 'Practical', 'Term 2', 8, DATE '2026-05-27'),
        ('Health & PE', 'Team Sports Project', 'Project', 'Term 2', 8, DATE '2026-05-29')
) AS a(subject_name, name, assessment_type, term, week_number, due_date)
    ON s.subject_name = a.subject_name;
