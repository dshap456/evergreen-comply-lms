-- Updated Course Structure Schema for Lessons and Quiz Questions
-- This extends the existing schema to support the Course Builder functionality

-- Create lessons table to replace content_items for simplified lesson management
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'quiz', 'asset')),
    order_index INTEGER NOT NULL DEFAULT 0,
    estimated_duration INTEGER, -- in minutes
    is_required BOOLEAN DEFAULT true,
    video_url TEXT,
    asset_url TEXT,
    is_final_quiz BOOLEAN DEFAULT false,
    passing_score INTEGER DEFAULT 80 CHECK (passing_score >= 0 AND passing_score <= 100),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Create quiz_questions table for lesson quizzes
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create lesson_progress table for tracking student progress through lessons
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    time_spent INTEGER DEFAULT 0, -- in minutes
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Create quiz_attempts table for tracking quiz attempts and scores
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    started_date TIMESTAMPTZ DEFAULT NOW(),
    completed_date TIMESTAMPTZ,
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    passed BOOLEAN DEFAULT false,
    answers JSONB DEFAULT '{}'::jsonb, -- store user answers
    time_spent INTEGER DEFAULT 0, -- in minutes
    created_date TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_content_type ON public.lessons(content_type);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON public.lessons(order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson_id ON public.quiz_questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order_index ON public.quiz_questions(order_index);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_lesson_id ON public.quiz_attempts(lesson_id);

-- Add update triggers for timestamps
CREATE TRIGGER IF NOT EXISTS update_lessons_updated_date 
    BEFORE UPDATE ON public.lessons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

CREATE TRIGGER IF NOT EXISTS update_quiz_questions_updated_date 
    BEFORE UPDATE ON public.quiz_questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

CREATE TRIGGER IF NOT EXISTS update_lesson_progress_updated_date 
    BEFORE UPDATE ON public.lesson_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

-- Row Level Security Policies

-- Lessons policies - inherit module permissions
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lesson access follows module permissions" ON public.lessons
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM public.modules m
            JOIN public.courses c ON m.course_id = c.id
            WHERE m.id = module_id 
            AND (
                c.is_published = true 
                OR c.instructor_id = auth.uid()
                OR EXISTS(
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND role = 'super_admin'
                )
            )
        )
    );

CREATE POLICY "Course instructors can manage lessons in their courses" ON public.lessons
    FOR ALL USING (
        EXISTS(
            SELECT 1 FROM public.modules m
            JOIN public.courses c ON m.course_id = c.id
            WHERE m.id = module_id 
            AND (
                c.instructor_id = auth.uid()
                OR EXISTS(
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND role = 'super_admin'
                )
            )
        )
    );

-- Quiz Questions policies - inherit lesson permissions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quiz question access follows lesson permissions" ON public.quiz_questions
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM public.lessons l
            JOIN public.modules m ON l.module_id = m.id
            JOIN public.courses c ON m.course_id = c.id
            WHERE l.id = lesson_id 
            AND (
                c.is_published = true 
                OR c.instructor_id = auth.uid()
                OR EXISTS(
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND role = 'super_admin'
                )
            )
        )
    );

CREATE POLICY "Course instructors can manage quiz questions in their courses" ON public.quiz_questions
    FOR ALL USING (
        EXISTS(
            SELECT 1 FROM public.lessons l
            JOIN public.modules m ON l.module_id = m.id
            JOIN public.courses c ON m.course_id = c.id
            WHERE l.id = lesson_id 
            AND (
                c.instructor_id = auth.uid()
                OR EXISTS(
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND role = 'super_admin'
                )
            )
        )
    );

-- Lesson Progress policies - users can only see their own progress
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lesson progress" ON public.lesson_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create/update their own lesson progress" ON public.lesson_progress
    FOR ALL USING (auth.uid() = user_id);

-- Quiz Attempts policies - users can only see their own attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for course content
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-content', 'course-content', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Authenticated users can upload course content" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'course-content' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Anyone can view course content" ON storage.objects
    FOR SELECT USING (bucket_id = 'course-content');

CREATE POLICY "Course instructors can delete their course content" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'course-content' 
        AND auth.role() = 'authenticated'
    );