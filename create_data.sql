-- =========================================================
-- AUSTRALIAN SCHOOL DUMMY DATA (SYDNEY/MELBOURNE CONTEXT)
-- =========================================================

-- 1. TEACHERS (Họ phổ biến tại Úc)
INSERT INTO teachers (name, email) VALUES
('Lachlan Macquarie', 'l.macquarie@st-andrews.edu.au'),
('Siobhan O''Reilly', 's.oreilly@st-andrews.edu.au'),
('Kylie Minogue', 'k.minogue@st-andrews.edu.au');

-- 2. PARENTS (Kết hợp giữa Anglo-Saxon, Asian và European - đặc trưng dân số Úc)
INSERT INTO parents (name, email, phone, preferred_language, prefers_voice) VALUES
('David Richardson', 'd.richardson@optusnet.com.au', '+61 412 345 678', 'en', FALSE),
('Priya Sharma', 'priya.sharma@gmail.com', '+61 488 777 999', 'en', TRUE),
('Hieu Nguyen', 'hieu.nguyen@outlook.com.au', '+61 455 000 111', 'vi', FALSE);

-- 3. CLASSES (Theo Year Level của Úc)
INSERT INTO classes (name, grade_level, teacher_id) VALUES
('Year 3 Blue', 'Year 3', 1),
('Year 3 Gold', 'Year 3', 2),
('Year 4 Eucalyptus', 'Year 4', 3);

-- 4. SUBJECTS (Môn học theo chuẩn ACARA)
INSERT INTO subjects (subject_name) VALUES
('Mathematics (Numeracy)'),
('English (Literacy)'),
('Science & Technology'),
('HSIE (History & Geography)'),
('PDHPE'), -- Personal Development, Health and Physical Education
('Creative Arts');

-- 5. CLASS_SUBJECTS
INSERT INTO class_subjects (class_id, subject_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 5),
(2, 1), (2, 2), (2, 3),
(3, 1), (3, 2), (3, 4);

-- 6. STUDENTS
INSERT INTO students (student_code, name, class_id, class_name, grade_level, parent_id) VALUES
('AUS-101', 'Oliver Richardson', 1, 'Year 3 Blue', 'Year 3', 1),
('AUS-102', 'Aarav Sharma', 1, 'Year 3 Blue', 'Year 3', 2),
('AUS-103', 'Chloe Nguyen', 2, 'Year 3 Gold', 'Year 3', 3);

-- 7. ASSESSMENTS (Bao gồm cả NAPLAN practice)
INSERT INTO assessments (class_id, subject_id, teacher_id, assessment_name, assessment_type, term, week_number, due_date, max_score) VALUES
(1, 1, 1, 'NAPLAN Practice: Numeracy', 'Standardized Test', 'Term 1', 5, '2026-03-15', 50.0),
(1, 2, 1, 'Creative Writing: The Outback', 'Assignment', 'Term 1', 7, '2026-03-30', 20.0);

-- 8. ASSESSMENT_SCORES
INSERT INTO assessment_scores (assessment_id, student_id, score, grade, comment) VALUES
(1, 1, 45.0, 'A', 'Excellent problem-solving skills in mental arithmetic.'),
(1, 2, 38.0, 'B+', 'Aarav showed great effort, needs a bit more focus on long division.'),
(2, 1, 18.5, 'A+', 'Incredible vocabulary and use of Australian metaphors.');

-- 9. WEEKLY_OBSERVATIONS
INSERT INTO weekly_observations (student_id, teacher_id, class_id, subject_id, term, week_number, participation, trend, concerns, teacher_comment) VALUES
(1, 1, 1, 1, 'Term 1', 9, 'Outstanding', 'Upward', 'None', 'Oliver was very helpful during the Group Science project.'),
(3, 2, 2, 2, 'Term 1', 9, 'Developing', 'Stable', 'Reading fluency', 'Chloe is working hard on her phonics, but needs more practice at home.');

-- 10. AI_REPORTS (Nội dung đậm chất Úc)
INSERT INTO ai_reports (student_id, week_number, term, summary, strengths, support_areas, risk_level, status, teacher_approved, sent_to_parent) VALUES
(1, 9, 'Term 1', 'Oliver has had a productive week. He especially enjoyed the Athletics Carnival and showed great sportsmanship.', 
'["Numerical reasoning", "Team leadership"]', '["Handwriting legibility"]', 'Low', 'published', TRUE, TRUE);

-- 11. ACTIVITIES (Gợi ý hoạt động ngoài trời - đúng kiểu Úc)
INSERT INTO activities (student_id, ai_report_id, title, activity_type, duration, difficulty, description) VALUES
(1, 1, 'Weekend Cricket Maths', 'Physical/Maths', '30 mins', 'Easy', 'Practice addition by keeping the score during a backyard cricket game.');

-- 12. PARENT_QUESTIONS (Vấn đề phụ huynh Úc hay quan tâm)
INSERT INTO parent_questions (parent_id, student_id, content, priority, status, ai_suggested_response) VALUES
(1, 1, 'Hi Lachlan, will there be a Parent-Teacher Interview before the Easter holidays?', 'orange', 'open', 'Hi David, yes, interviews are scheduled for Week 11. You can book via the portal soon.');

-- 13. CHAT_MESSAGES
INSERT INTO chat_messages (student_id, parent_id, role, content) VALUES
(1, 1, 'parent', 'How did Oliver go at the swimming carnival today?'),
(1, 1, 'ai', 'Oliver did great! He placed 2nd in the 50m Freestyle heat.');

-- 14. CANVAS_SYNC_LOGS (Giả lập sync với hệ thống Canvas phổ biến ở Úc)
INSERT INTO canvas_sync_logs (records_count, status, trigger_type) VALUES
(142, 'success', 'nightly_cron');


-- 1. Thêm bà mẹ Sarah Jenkins (Parent ID: 4)
INSERT INTO parents (name, email, phone, preferred_language, prefers_voice) 
VALUES ('Sarah Jenkins', 'sarah.j@bigpond.com.au', '+61 422 111 222', 'en', FALSE);

-- 2. Thêm 2 con của Sarah vào các lớp khác nhau
-- Đứa con thứ nhất: Jack Jenkins (Year 3 Gold)
INSERT INTO students (student_code, name, class_id, class_name, grade_level, parent_id) 
VALUES ('AUS-201', 'Jack Jenkins', 2, 'Year 3 Gold', 'Year 3', 4);

-- Đứa con thứ hai: Isla Jenkins (Year 4 Eucalyptus)
INSERT INTO students (student_code, name, class_id, class_name, grade_level, parent_id) 
VALUES ('AUS-202', 'Isla Jenkins', 3, 'Year 4 Eucalyptus', 'Year 4', 4);

-- 3. Thêm dữ liệu tương tác để test tính năng "Multi-child"
-- Chat của Sarah hỏi về Jack
INSERT INTO chat_messages (student_id, parent_id, role, content) VALUES 
(4, 4, 'parent', 'How is Jack doing in his Year 3 NAPLAN prep?'),
(4, 4, 'ai', 'Jack is doing great in Numeracy, but he could use more practice with persuasive writing.');

-- Chat của Sarah hỏi về Isla (ngay sau đó)
INSERT INTO chat_messages (student_id, parent_id, role, content) VALUES 
(5, 4, 'parent', 'And what about Isla? Did she finish her Science project?'),
(5, 4, 'ai', 'Yes, Isla submitted "The Life Cycle of a Koala" project yesterday. It was very creative!');

-- 4. Một câu hỏi gửi trực tiếp cho giáo viên (Parent Question) cho đứa lớn
INSERT INTO parent_questions (parent_id, student_id, content, priority, status)
VALUES (4, 5, 'Hi Ms. Hạnh, Isla will be away next Tuesday for a dental appointment.', 'yellow', 'open');

-- Fix priority values in original question (Medium → orange)
-- (Already inserted above with 'yellow'; original data used 'Medium' which is now fixed)

-- =========================================================
-- WEEKLY RECORDS — Oliver Richardson (student_id=1, weeks 5–8)
-- =========================================================
INSERT INTO weekly_records (student_id, week_number, subject, skill, score, teacher_comment) VALUES
(1, 5, 'Mathematics', 'Number & Algebra',  82.0, 'Oliver is confident with mental arithmetic.'),
(1, 5, 'English',     'Reading & Viewing', 78.0, 'Strong reading comprehension skills.'),
(1, 5, 'Science',     'Science Understanding', 75.0, 'Good participation in group experiments.'),
(1, 6, 'Mathematics', 'Number & Algebra',  85.0, 'Excellent performance in fractions.'),
(1, 6, 'English',     'Reading & Viewing', 80.0, 'Vocabulary is expanding well.'),
(1, 6, 'Science',     'Science Understanding', 78.0, 'Asked great questions this week.'),
(1, 7, 'Mathematics', 'Number & Algebra',  88.0, 'Outstanding problem solving.'),
(1, 7, 'English',     'Reading & Viewing', 82.0, 'Creative writing was impressive.'),
(1, 7, 'Science',     'Science Understanding', 80.0, 'Oliver was very helpful during the group project.'),
(1, 8, 'Mathematics', 'Number & Algebra',  90.0, 'Top of the class in this week''s assessment.'),
(1, 8, 'English',     'Reading & Viewing', 85.0, 'Excellent vocabulary and Australian metaphors.'),
(1, 8, 'Science',     'Science Understanding', 82.0, 'Showed initiative in science fair preparation.');

-- =========================================================
-- WEEKLY RECORDS — Aarav Sharma (student_id=2, weeks 5–8)
-- =========================================================
INSERT INTO weekly_records (student_id, week_number, subject, skill, score, teacher_comment) VALUES
(2, 5, 'Mathematics', 'Number & Algebra',  68.0, 'Aarav needs more practice with long division.'),
(2, 5, 'English',     'Reading & Viewing', 72.0, 'Good effort in reading tasks.'),
(2, 5, 'Science',     'Science Understanding', 70.0, 'Actively engages with experiments.'),
(2, 6, 'Mathematics', 'Number & Algebra',  70.0, 'Improvement shown in multiplication.'),
(2, 6, 'English',     'Reading & Viewing', 74.0, 'Written expression is developing well.'),
(2, 6, 'Science',     'Science Understanding', 72.0, 'Good scientific vocabulary use.'),
(2, 7, 'Mathematics', 'Number & Algebra',  72.0, 'Aarav showed great effort this week.'),
(2, 7, 'English',     'Reading & Viewing', 75.0, 'Persuasive writing piece was well structured.'),
(2, 7, 'Science',     'Science Understanding', 74.0, 'Contributed well to group discussions.'),
(2, 8, 'Mathematics', 'Number & Algebra',  75.0, 'Solid improvement across the term.'),
(2, 8, 'English',     'Reading & Viewing', 78.0, 'Growing confidence in written tasks.'),
(2, 8, 'Science',     'Science Understanding', 76.0, 'Engaged and curious learner.');

-- =========================================================
-- WEEKLY RECORDS — Chloe Nguyen (student_id=3, weeks 5–8)
-- =========================================================
INSERT INTO weekly_records (student_id, week_number, subject, skill, score, teacher_comment) VALUES
(3, 5, 'Mathematics', 'Number & Algebra',  58.0, 'Chloe is working on number fluency.'),
(3, 5, 'English',     'Reading & Viewing', 55.0, 'Reading fluency needs more home practice.'),
(3, 6, 'Mathematics', 'Number & Algebra',  62.0, 'Showing improvement with addition strategies.'),
(3, 6, 'English',     'Reading & Viewing', 60.0, 'Phonics practice is paying off.'),
(3, 7, 'Mathematics', 'Number & Algebra',  65.0, 'Good effort in this week''s tasks.'),
(3, 7, 'English',     'Reading & Viewing', 63.0, 'Chloe is working hard on her phonics.'),
(3, 8, 'Mathematics', 'Number & Algebra',  68.0, 'Building confidence with written strategies.'),
(3, 8, 'English',     'Reading & Viewing', 66.0, 'Steady improvement, keep encouraging reading at home.');

-- =========================================================
-- WEEKLY RECORDS — Jack Jenkins (student_id=4, weeks 5–8)
-- =========================================================
INSERT INTO weekly_records (student_id, week_number, subject, skill, score, teacher_comment) VALUES
(4, 5, 'Mathematics', 'Number & Algebra',   72.0, 'Jack is working well with number patterns.'),
(4, 5, 'English',     'Reading & Viewing',  68.0, 'Good effort in reading comprehension.'),
(4, 6, 'Mathematics', 'Number & Algebra',   75.0, 'Showing improvement in multiplication.'),
(4, 6, 'English',     'Reading & Viewing',  65.0, 'Needs more practice with persuasive writing.'),
(4, 7, 'Mathematics', 'Number & Algebra',   78.0, 'Jack shows good number sense.'),
(4, 7, 'English',     'Reading & Viewing',  65.0, 'Working on his persuasive writing.'),
(4, 8, 'Mathematics', 'Number & Algebra',   80.0, 'Great progress — Jack understands place value well.'),
(4, 8, 'English',     'Reading & Viewing',  70.0, 'Jack has improved his sentence structure significantly.');

-- =========================================================
-- WEEKLY RECORDS — Isla Jenkins (student_id=5, weeks 5–8)
-- =========================================================
INSERT INTO weekly_records (student_id, week_number, subject, skill, score, teacher_comment) VALUES
(5, 5, 'Mathematics', 'Measurement & Geometry', 80.0, 'Isla is strong with fractions.'),
(5, 5, 'English',     'Writing',                85.0, 'Excellent creative writing.'),
(5, 5, 'Science',     'Science Understanding',  78.0, 'Shows curiosity in science experiments.'),
(5, 6, 'Mathematics', 'Measurement & Geometry', 83.0, 'Good understanding of area and perimeter.'),
(5, 6, 'English',     'Writing',                87.0, 'Vivid storytelling in creative tasks.'),
(5, 6, 'Science',     'Science Understanding',  80.0, 'Strong research skills.'),
(5, 7, 'Mathematics', 'Measurement & Geometry', 82.0, 'Isla is performing well above average.'),
(5, 7, 'English',     'Writing',                88.0, 'Excellent creative writing skills.'),
(5, 7, 'Science',     'Science Understanding',  84.0, 'Koala life cycle project was very creative.'),
(5, 8, 'Mathematics', 'Measurement & Geometry', 85.0, 'Isla excels in geometry and spatial reasoning.'),
(5, 8, 'English',     'Writing',                90.0, 'Outstanding persuasive essay this week.'),
(5, 8, 'Science',     'Science Understanding',  88.0, 'Science Fair project shows excellent inquiry skills.');

-- =========================================================
-- AI REPORTS — Oliver Richardson (student_id=1, week 8)
-- =========================================================
INSERT INTO ai_reports (student_id, week_number, term, summary, strengths, support_areas, recommendations, curriculum_ref, risk_level, status, teacher_approved, sent_to_parent) VALUES
(1, 8, 'Term 2',
 'Oliver has had an outstanding week. He especially excelled in Mathematics and showed great leadership during the Science group project.',
 '["Numerical reasoning", "Team leadership", "Creative writing"]',
 '["Handwriting legibility"]',
 '["Practice cursive writing for 10 minutes daily", "Challenge Oliver with extension maths problems", "Encourage him to read aloud to younger siblings"]',
 'ACMNA079 – Apply strategies to solve problems involving whole numbers',
 'Low', 'published', TRUE, TRUE);

-- =========================================================
-- AI REPORTS — Aarav Sharma (student_id=2, week 8)
-- =========================================================
INSERT INTO ai_reports (student_id, week_number, term, summary, strengths, support_areas, recommendations, curriculum_ref, risk_level, status, teacher_approved, sent_to_parent) VALUES
(2, 8, 'Term 2',
 'Aarav has shown consistent improvement across all subjects this term. He is developing well in Mathematics and his writing confidence is growing.',
 '["Enthusiasm", "Science inquiry", "Oral communication"]',
 '["Long division", "Extended writing tasks"]',
 '["Use the Mathletics app for 15 min of division practice", "Write a short daily journal entry", "Practise times tables with a family member"]',
 'ACMNA076 – Investigate and use the properties of odd and even numbers',
 'Low', 'pending', FALSE, FALSE);

-- =========================================================
-- AI REPORTS — Chloe Nguyen (student_id=3, week 8)
-- =========================================================
INSERT INTO ai_reports (student_id, week_number, term, summary, strengths, support_areas, recommendations, curriculum_ref, risk_level, status, teacher_approved, sent_to_parent) VALUES
(3, 8, 'Term 2',
 'Chloe is making steady progress this term. Her phonics has improved noticeably and she is building confidence in Mathematics.',
 '["Persistence", "Phonics improvement"]',
 '["Reading fluency", "Number operations"]',
 '["Read together for 15 minutes every evening", "Use Reading Eggs app daily", "Practice counting by 2s and 5s using everyday objects"]',
 'ACELY1668 – Read and view a range of literary texts',
 'Medium', 'pending', FALSE, FALSE);

-- =========================================================
-- AI REPORTS — Jack (student_id=4, week 8)
-- =========================================================
INSERT INTO ai_reports (student_id, week_number, term, summary, strengths, support_areas, recommendations, curriculum_ref, risk_level, status, teacher_approved, sent_to_parent) VALUES
(4, 8, 'Term 2',
 'Jack has had a strong week in Mathematics, showing real improvement in place value and number operations. His English is progressing steadily.',
 '["Number sense", "Enthusiasm in Maths"]',
 '["Persuasive writing", "Reading fluency"]',
 '["Practice writing a short opinion piece each day", "Use Reading Eggs for 15 min daily", "Play Times Tables Rockstars for 10 minutes"]',
 'ACMNA072 – Apply place-value understanding to solve problems',
 'Low', 'published', TRUE, TRUE);

-- =========================================================
-- AI REPORTS — Isla (student_id=5, week 8)
-- =========================================================
INSERT INTO ai_reports (student_id, week_number, term, summary, strengths, support_areas, recommendations, curriculum_ref, risk_level, status, teacher_approved, sent_to_parent) VALUES
(5, 8, 'Term 2',
 'Isla has had an outstanding week across all subjects. Her Science Fair project on the Koala life cycle was exceptional, and her English writing continues to impress.',
 '["Creative writing", "Scientific inquiry", "Spatial reasoning"]',
 '["Mental arithmetic under timed conditions"]',
 '["Practise 5-minute maths drills to build speed", "Explore the local library science section", "Write a short story with a scientific theme"]',
 'ACELY1714 – Use comprehension strategies to interpret complex texts',
 'Low', 'published', TRUE, TRUE);

-- =========================================================
-- ACTIVITIES — Jack (student_id=4, ai_report_id=5)
-- =========================================================
INSERT INTO activities (student_id, ai_report_id, subject_id, title, activity_type, duration, difficulty, description, steps, curriculum_ref, completed) VALUES
(4, 5, 1, 'Supermarket Maths Challenge', 'Maths/Real World', '25 mins', 'Easy',
 'Take Jack to the supermarket and ask him to estimate the total cost of items before reaching the checkout.',
 '["Pick 5 items from the shelves", "Ask Jack to round each price to the nearest dollar", "Add them up together", "Compare your estimate to the actual receipt"]',
 'ACMNA072', FALSE),
(4, 5, 2, 'Persuasive Letter Writing', 'Writing', '30 mins', 'Medium',
 'Help Jack write a short persuasive letter to a family member about why they should visit a place he loves.',
 '["Choose a favourite place (e.g. the park, the beach)", "List 3 reasons why it is great", "Write one paragraph for each reason", "Read the letter aloud to the family"]',
 'ACELY1714', FALSE);

-- =========================================================
-- ACTIVITIES — Isla (student_id=5, ai_report_id=6)
-- =========================================================
INSERT INTO activities (student_id, ai_report_id, subject_id, title, activity_type, duration, difficulty, description, steps, curriculum_ref, completed) VALUES
(5, 6, 1, 'Backyard Geometry Hunt', 'Maths/Outdoor', '20 mins', 'Easy',
 'Ask Isla to find and name 5 different 2D shapes and 2 3D shapes around the backyard or home.',
 '["Walk through the garden together", "Take photos of shapes you find", "Label each shape and list its properties", "Bonus: measure the perimeter of one shape"]',
 'ACMMG088', FALSE),
(5, 6, 2, 'Nature Science Journal', 'Science/Writing', '30 mins', 'Medium',
 'Isla writes a journal entry as a young scientist observing nature in the backyard, linking to her Koala life cycle project.',
 '["Go outside for 10 minutes of quiet observation", "Sketch one living thing you notice", "Write 3 observations using scientific vocabulary", "Share your journal entry with the class next week"]',
 'ACSIS066', FALSE);