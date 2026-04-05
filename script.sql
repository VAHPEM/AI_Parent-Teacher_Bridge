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
    participation VARCHAR(100),
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
    improvement_areas JSONB,
    parent_actions JSONB,
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
-- TEACHERS
-- =========================================================
INSERT INTO teachers (name, email)
VALUES
    ('Emma Wilson', 'emma.wilson@school.edu.au'),
    ('James Carter', 'james.carter@school.edu.au'),
    ('Sophia Nguyen', 'sophia.nguyen@school.edu.au');


-- =========================================================
-- CLASSES
-- safer version using teacher email lookup
-- =========================================================
INSERT INTO classes (name, grade_level, teacher_id)
VALUES
    ('5A', 'Year 5', (SELECT id FROM teachers WHERE email = 'emma.wilson@school.edu.au')),
    ('5B', 'Year 5', (SELECT id FROM teachers WHERE email = 'james.carter@school.edu.au')),
    ('6A', 'Year 6', (SELECT id FROM teachers WHERE email = 'sophia.nguyen@school.edu.au'));

-- =========================================================
-- PARENTS
-- 6 parents, each will have 3 children
-- =========================================================
INSERT INTO parents (name, email, phone, preferred_language, prefers_voice)
VALUES
    ('Sarah Johnson', 'sarah.johnson@email.com', '0400000001', 'en', TRUE),
    ('Michael Brown', 'michael.brown@email.com', '0400000002', 'en', FALSE),
    ('Emily Davis', 'emily.davis@email.com', '0400000003', 'en', TRUE),
    ('David Miller', 'david.miller@email.com', '0400000004', 'en', FALSE),
    ('Olivia Taylor', 'olivia.taylor@email.com', '0400000005', 'en', TRUE),
    ('Daniel Anderson', 'daniel.anderson@email.com', '0400000006', 'en', FALSE);


-- =========================================================
-- STUDENTS
-- 18 students total
-- 6 students in each class
-- each parent has 1 student in each class
-- =========================================================
INSERT INTO students (student_code, name, class_id, class_name, grade_level, parent_id)
VALUES
    -- Parent 1 children
    ('S001', 'Liam Johnson', 1, '5A', 'Year 5', 1),
    ('S002', 'Ava Johnson', 2, '5B', 'Year 5', 1),
    ('S003', 'Noah Johnson', 3, '6A', 'Year 6', 1),

    -- Parent 2 children
    ('S004', 'Olivia Brown', 1, '5A', 'Year 5', 2),
    ('S005', 'Ethan Brown', 2, '5B', 'Year 5', 2),
    ('S006', 'Sophia Brown', 3, '6A', 'Year 6', 2),

    -- Parent 3 children
    ('S007', 'Mason Davis', 1, '5A', 'Year 5', 3),
    ('S008', 'Isabella Davis', 2, '5B', 'Year 5', 3),
    ('S009', 'Lucas Davis', 3, '6A', 'Year 6', 3),

    -- Parent 4 children
    ('S010', 'Mia Miller', 1, '5A', 'Year 5', 4),
    ('S011', 'James Miller', 2, '5B', 'Year 5', 4),
    ('S012', 'Charlotte Miller', 3, '6A', 'Year 6', 4),

    -- Parent 5 children
    ('S013', 'Benjamin Taylor', 1, '5A', 'Year 5', 5),
    ('S014', 'Amelia Taylor', 2, '5B', 'Year 5', 5),
    ('S015', 'Henry Taylor', 3, '6A', 'Year 6', 5),

    -- Parent 6 children
    ('S016', 'Ella Anderson', 1, '5A', 'Year 5', 6),
    ('S017', 'Jack Anderson', 2, '5B', 'Year 5', 6),
    ('S018', 'Grace Anderson', 3, '6A', 'Year 6', 6);

-- =========================================================
-- SUBJECTS
-- =========================================================
INSERT INTO subjects (subject_name)
VALUES
    ('Math'),
    ('English'),
    ('Science'),
    ('Health & PE'),
    ('Art')
ON CONFLICT (subject_name) DO NOTHING;


-- =========================================================
-- CLASS_SUBJECTS
-- All classes: Math, English, Science, Health & PE
-- Year 6 class (6A): + Art
-- =========================================================

-- 5A
INSERT INTO class_subjects (class_id, subject_id)
SELECT
    c.id,
    s.id
FROM classes c
JOIN subjects s ON s.subject_name IN ('Math', 'English', 'Science', 'Health & PE')
WHERE c.name = '5A'
ON CONFLICT (class_id, subject_id) DO NOTHING;

-- 5B
INSERT INTO class_subjects (class_id, subject_id)
SELECT
    c.id,
    s.id
FROM classes c
JOIN subjects s ON s.subject_name IN ('Math', 'English', 'Science', 'Health & PE')
WHERE c.name = '5B'
ON CONFLICT (class_id, subject_id) DO NOTHING;

-- 6A
INSERT INTO class_subjects (class_id, subject_id)
SELECT
    c.id,
    s.id
FROM classes c
JOIN subjects s ON s.subject_name IN ('Math', 'English', 'Science', 'Health & PE', 'Art')
WHERE c.name = '6A'
ON CONFLICT (class_id, subject_id) DO NOTHING;

INSERT INTO assessments (
    subject_id,
    assessment_name,
    assessment_type,
    term,
    week_number,
    due_date,
    max_score
)
SELECT id, 'Subject Knowledge Quiz', 'Quiz', 'Term 1', 1, DATE '2026-02-09', 100
FROM subjects

UNION ALL

SELECT id, 'Skills Practice Task', 'Worksheet', 'Term 1', 3, DATE '2026-02-23', 100
FROM subjects

UNION ALL

SELECT id, 'Applied Learning Project', 'Project', 'Term 1', 6, DATE '2026-03-16', 100
FROM subjects

UNION ALL

SELECT id, 'End of Term Assessment', 'Final Task', 'Term 1', 9, DATE '2026-04-06', 100
FROM subjects;

INSERT INTO assessment_scores (
    assessment_id,
    student_id,
    score,
    grade,
    comment
)
SELECT
    a.id AS assessment_id,
    st.id AS student_id,

    -- score
    CASE
        WHEN s.subject_name = 'Math' THEN
            CASE a.week_number
                WHEN 1 THEN 62 + (st.id % 18)
                WHEN 3 THEN 60 + (st.id % 20)
                WHEN 6 THEN 58 + (st.id % 22)
                WHEN 9 THEN 64 + (st.id % 18)
            END

        WHEN s.subject_name = 'English' THEN
            CASE a.week_number
                WHEN 1 THEN 68 + (st.id % 16)
                WHEN 3 THEN 66 + (st.id % 18)
                WHEN 6 THEN 70 + (st.id % 15)
                WHEN 9 THEN 72 + (st.id % 14)
            END

        WHEN s.subject_name = 'Science' THEN
            CASE a.week_number
                WHEN 1 THEN 64 + (st.id % 17)
                WHEN 3 THEN 63 + (st.id % 18)
                WHEN 6 THEN 65 + (st.id % 16)
                WHEN 9 THEN 67 + (st.id % 15)
            END

        WHEN s.subject_name = 'Health & PE' THEN
            CASE a.week_number
                WHEN 1 THEN 72 + (st.id % 14)
                WHEN 3 THEN 74 + (st.id % 12)
                WHEN 6 THEN 73 + (st.id % 13)
                WHEN 9 THEN 75 + (st.id % 11)
            END

        WHEN s.subject_name = 'Art' THEN
            CASE a.week_number
                WHEN 1 THEN 70 + (st.id % 15)
                WHEN 3 THEN 72 + (st.id % 13)
                WHEN 6 THEN 74 + (st.id % 12)
                WHEN 9 THEN 76 + (st.id % 10)
            END
    END AS score,

    -- grade
    CASE
        WHEN
            CASE
                WHEN s.subject_name = 'Math' THEN
                    CASE a.week_number
                        WHEN 1 THEN 62 + (st.id % 18)
                        WHEN 3 THEN 60 + (st.id % 20)
                        WHEN 6 THEN 58 + (st.id % 22)
                        WHEN 9 THEN 64 + (st.id % 18)
                    END
                WHEN s.subject_name = 'English' THEN
                    CASE a.week_number
                        WHEN 1 THEN 68 + (st.id % 16)
                        WHEN 3 THEN 66 + (st.id % 18)
                        WHEN 6 THEN 70 + (st.id % 15)
                        WHEN 9 THEN 72 + (st.id % 14)
                    END
                WHEN s.subject_name = 'Science' THEN
                    CASE a.week_number
                        WHEN 1 THEN 64 + (st.id % 17)
                        WHEN 3 THEN 63 + (st.id % 18)
                        WHEN 6 THEN 65 + (st.id % 16)
                        WHEN 9 THEN 67 + (st.id % 15)
                    END
                WHEN s.subject_name = 'Health & PE' THEN
                    CASE a.week_number
                        WHEN 1 THEN 72 + (st.id % 14)
                        WHEN 3 THEN 74 + (st.id % 12)
                        WHEN 6 THEN 73 + (st.id % 13)
                        WHEN 9 THEN 75 + (st.id % 11)
                    END
                WHEN s.subject_name = 'Art' THEN
                    CASE a.week_number
                        WHEN 1 THEN 70 + (st.id % 15)
                        WHEN 3 THEN 72 + (st.id % 13)
                        WHEN 6 THEN 74 + (st.id % 12)
                        WHEN 9 THEN 76 + (st.id % 10)
                    END
            END >= 85 THEN 'A'

        WHEN
            CASE
                WHEN s.subject_name = 'Math' THEN
                    CASE a.week_number
                        WHEN 1 THEN 62 + (st.id % 18)
                        WHEN 3 THEN 60 + (st.id % 20)
                        WHEN 6 THEN 58 + (st.id % 22)
                        WHEN 9 THEN 64 + (st.id % 18)
                    END
                WHEN s.subject_name = 'English' THEN
                    CASE a.week_number
                        WHEN 1 THEN 68 + (st.id % 16)
                        WHEN 3 THEN 66 + (st.id % 18)
                        WHEN 6 THEN 70 + (st.id % 15)
                        WHEN 9 THEN 72 + (st.id % 14)
                    END
                WHEN s.subject_name = 'Science' THEN
                    CASE a.week_number
                        WHEN 1 THEN 64 + (st.id % 17)
                        WHEN 3 THEN 63 + (st.id % 18)
                        WHEN 6 THEN 65 + (st.id % 16)
                        WHEN 9 THEN 67 + (st.id % 15)
                    END
                WHEN s.subject_name = 'Health & PE' THEN
                    CASE a.week_number
                        WHEN 1 THEN 72 + (st.id % 14)
                        WHEN 3 THEN 74 + (st.id % 12)
                        WHEN 6 THEN 73 + (st.id % 13)
                        WHEN 9 THEN 75 + (st.id % 11)
                    END
                WHEN s.subject_name = 'Art' THEN
                    CASE a.week_number
                        WHEN 1 THEN 70 + (st.id % 15)
                        WHEN 3 THEN 72 + (st.id % 13)
                        WHEN 6 THEN 74 + (st.id % 12)
                        WHEN 9 THEN 76 + (st.id % 10)
                    END
            END >= 75 THEN 'B'

        WHEN
            CASE
                WHEN s.subject_name = 'Math' THEN
                    CASE a.week_number
                        WHEN 1 THEN 62 + (st.id % 18)
                        WHEN 3 THEN 60 + (st.id % 20)
                        WHEN 6 THEN 58 + (st.id % 22)
                        WHEN 9 THEN 64 + (st.id % 18)
                    END
                WHEN s.subject_name = 'English' THEN
                    CASE a.week_number
                        WHEN 1 THEN 68 + (st.id % 16)
                        WHEN 3 THEN 66 + (st.id % 18)
                        WHEN 6 THEN 70 + (st.id % 15)
                        WHEN 9 THEN 72 + (st.id % 14)
                    END
                WHEN s.subject_name = 'Science' THEN
                    CASE a.week_number
                        WHEN 1 THEN 64 + (st.id % 17)
                        WHEN 3 THEN 63 + (st.id % 18)
                        WHEN 6 THEN 65 + (st.id % 16)
                        WHEN 9 THEN 67 + (st.id % 15)
                    END
                WHEN s.subject_name = 'Health & PE' THEN
                    CASE a.week_number
                        WHEN 1 THEN 72 + (st.id % 14)
                        WHEN 3 THEN 74 + (st.id % 12)
                        WHEN 6 THEN 73 + (st.id % 13)
                        WHEN 9 THEN 75 + (st.id % 11)
                    END
                WHEN s.subject_name = 'Art' THEN
                    CASE a.week_number
                        WHEN 1 THEN 70 + (st.id % 15)
                        WHEN 3 THEN 72 + (st.id % 13)
                        WHEN 6 THEN 74 + (st.id % 12)
                        WHEN 9 THEN 76 + (st.id % 10)
                    END
            END >= 65 THEN 'C'
        ELSE 'D'
    END AS grade,

    -- comment
    CASE
        WHEN s.subject_name = 'Math' THEN 'Shows developing understanding but needs continued support with problem-solving.'
        WHEN s.subject_name = 'English' THEN 'Communicates ideas clearly and is making steady progress in literacy skills.'
        WHEN s.subject_name = 'Science' THEN 'Demonstrates curiosity and is building confidence with scientific concepts.'
        WHEN s.subject_name = 'Health & PE' THEN 'Participates actively and demonstrates positive effort during practical tasks.'
        WHEN s.subject_name = 'Art' THEN 'Shows creativity and growing confidence in visual expression.'
    END AS comment

FROM students st
JOIN classes c
    ON c.id = st.class_id
JOIN class_subjects cs
    ON cs.class_id = c.id
JOIN subjects s
    ON s.id = cs.subject_id
JOIN assessments a
    ON a.subject_id = s.id;

INSERT INTO weekly_records (
    student_id,
    week_number,
    subject,
    skill,
    score,
    teacher_comment
)
SELECT
    ascore.student_id,
    a.week_number,
    s.subject_name AS subject,
    a.assessment_name AS skill,
    ascore.score,
    ascore.comment AS teacher_comment
FROM assessment_scores ascore
JOIN assessments a
    ON a.id = ascore.assessment_id
JOIN subjects s
    ON s.id = a.subject_id
ORDER BY ascore.student_id, a.week_number, s.subject_name;

INSERT INTO weekly_observations (
    student_id,
    teacher_id,
    class_id,
    subject_id,
    term,
    week_number,
    participation,
    trend,
    concerns,
    teacher_comment,
    curriculum_ref
)
SELECT
    st.id AS student_id,
    c.teacher_id,
    c.id AS class_id,
    NULL AS subject_id,
    'Term 1' AS term,
    a.week_number,

    CASE
        WHEN AVG(ascore.score) >= 80 THEN 'Excellent'
        WHEN AVG(ascore.score) >= 70 THEN 'Good'
        WHEN AVG(ascore.score) >= 60 THEN 'Satisfactory'
        ELSE 'Needs Improvement'
    END AS participation,

    CASE
        WHEN a.week_number = 1 THEN 'Baseline established'
        WHEN AVG(ascore.score) >= 75 THEN 'Improving'
        WHEN AVG(ascore.score) >= 65 THEN 'Stable'
        ELSE 'Needs support'
    END AS trend,

    CASE
        WHEN AVG(ascore.score) < 60 THEN 'Needs additional support to build confidence and understanding.'
        WHEN AVG(ascore.score) < 70 THEN 'Would benefit from regular revision and guided practice.'
        ELSE 'No major concerns this week.'
    END AS concerns,

    CASE
        WHEN AVG(ascore.score) >= 80 THEN 'The student engaged very well this week and demonstrated strong understanding across learning tasks.'
        WHEN AVG(ascore.score) >= 70 THEN 'The student participated well this week and is making steady progress in class activities.'
        WHEN AVG(ascore.score) >= 60 THEN 'The student is showing developing understanding and would benefit from continued guided practice.'
        ELSE 'The student found some tasks challenging this week and may need extra support at home and in class.'
    END AS teacher_comment,

    'Australian Curriculum aligned weekly summary' AS curriculum_ref

FROM assessment_scores ascore
JOIN assessments a
    ON a.id = ascore.assessment_id
JOIN students st
    ON st.id = ascore.student_id
JOIN classes c
    ON c.id = st.class_id
GROUP BY
    st.id,
    c.teacher_id,
    c.id,
    a.week_number
ORDER BY
    st.id,
    a.week_number;


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