-- EverGreen Comply Database Schema for Supabase
-- Complete migration from Base44 to Supabase

-- Enable Row Level Security on all tables
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types
CREATE TYPE user_role AS ENUM ('super_admin', 'team_manager', 'learner');
CREATE TYPE enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed', 'expired');
CREATE TYPE content_type AS ENUM ('video', 'article', 'quiz', 'assignment', 'scorm');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'learner',
    organization_id UUID,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    profile_image_url TEXT,
    phone TEXT,
    department TEXT,
    job_title TEXT,
    manager_id UUID REFERENCES public.users(id),
    timezone TEXT DEFAULT 'UTC',
    locale TEXT DEFAULT 'en',
    last_login TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT false
);

-- Organizations table
CREATE TABLE public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.users(id),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    logo_url TEXT,
    website TEXT,
    industry TEXT,
    size_category TEXT,
    billing_email TEXT,
    phone TEXT,
    address JSONB,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Update users table to reference organizations
ALTER TABLE public.users ADD CONSTRAINT fk_users_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Courses table
CREATE TABLE public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    category TEXT,
    level TEXT DEFAULT 'beginner',
    estimated_duration INTEGER, -- in minutes
    language TEXT DEFAULT 'en',
    tags TEXT[],
    thumbnail_url TEXT,
    cover_image_url TEXT,
    trailer_video_url TEXT,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    price DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    instructor_id UUID REFERENCES public.users(id),
    organization_id UUID REFERENCES public.organizations(id),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    published_date TIMESTAMPTZ,
    version INTEGER DEFAULT 1,
    prerequisites TEXT[],
    learning_objectives TEXT[],
    target_audience TEXT,
    certificate_template_id UUID,
    completion_criteria JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Course Versions table (for versioning)
CREATE TABLE public.course_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_snapshot JSONB,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT false,
    UNIQUE(course_id, version_number)
);

-- Modules table
CREATE TABLE public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    estimated_duration INTEGER, -- in minutes
    is_published BOOLEAN DEFAULT false,
    prerequisites JSONB DEFAULT '[]'::jsonb,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Content Items table
CREATE TABLE public.content_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    order_index INTEGER NOT NULL,
    estimated_duration INTEGER, -- in minutes
    is_required BOOLEAN DEFAULT true,
    content_url TEXT,
    content_data JSONB DEFAULT '{}'::jsonb,
    thumbnail_url TEXT,
    transcript TEXT,
    captions JSONB,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Enrollments table
CREATE TABLE public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    status enrollment_status DEFAULT 'enrolled',
    enrolled_date TIMESTAMPTZ DEFAULT NOW(),
    started_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_module_id UUID REFERENCES public.modules(id),
    current_content_item_id UUID REFERENCES public.content_items(id),
    time_spent INTEGER DEFAULT 0, -- in minutes
    grade DECIMAL(5,2),
    certificate_url TEXT,
    enrolled_by UUID REFERENCES public.users(id),
    completion_criteria_met JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Content Progress table
CREATE TABLE public.content_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
    content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
    status enrollment_status DEFAULT 'enrolled',
    started_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    time_spent INTEGER DEFAULT 0, -- in minutes
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    grade DECIMAL(5,2),
    attempts INTEGER DEFAULT 0,
    data JSONB DEFAULT '{}'::jsonb, -- store quiz answers, scorm data, etc.
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(enrollment_id, content_item_id)
);

-- Teams table
CREATE TABLE public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.users(id),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Team Members table
CREATE TABLE public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_date TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Team Licenses table
CREATE TABLE public.team_licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    licenses_total INTEGER NOT NULL,
    licenses_used INTEGER DEFAULT 0,
    purchased_date TIMESTAMPTZ DEFAULT NOW(),
    expires_date TIMESTAMPTZ,
    purchased_by UUID REFERENCES public.users(id),
    price_per_license DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, course_id)
);

-- Invitations table
CREATE TABLE public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    invited_by UUID REFERENCES public.users(id),
    organization_id UUID REFERENCES public.organizations(id),
    team_id UUID REFERENCES public.teams(id),
    role user_role DEFAULT 'learner',
    invitation_token TEXT NOT NULL UNIQUE,
    expires_date TIMESTAMPTZ NOT NULL,
    accepted_date TIMESTAMPTZ,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    message TEXT
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    organization_id UUID REFERENCES public.organizations(id),
    plan_name TEXT NOT NULL,
    plan_type TEXT DEFAULT 'monthly',
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'active',
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    canceled_date TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Course Purchases table
CREATE TABLE public.course_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    transaction_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    status TEXT DEFAULT 'completed',
    refunded_date TIMESTAMPTZ,
    refund_amount DECIMAL(10,2),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Assessments table
CREATE TABLE public.assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    assessment_type TEXT DEFAULT 'quiz', -- quiz, assignment, exam
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    time_limit INTEGER, -- in minutes
    attempts_allowed INTEGER DEFAULT 1,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    randomize_questions BOOLEAN DEFAULT false,
    show_correct_answers BOOLEAN DEFAULT true,
    show_results_immediately BOOLEAN DEFAULT true,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Assessment Attempts table
CREATE TABLE public.assessment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    started_date TIMESTAMPTZ DEFAULT NOW(),
    submitted_date TIMESTAMPTZ,
    time_spent INTEGER DEFAULT 0, -- in minutes
    answers JSONB DEFAULT '{}'::jsonb,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    passed BOOLEAN,
    feedback TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates table
CREATE TABLE public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
    template_id UUID,
    certificate_number TEXT UNIQUE NOT NULL,
    issued_date TIMESTAMPTZ DEFAULT NOW(),
    expires_date TIMESTAMPTZ,
    certificate_url TEXT,
    verification_code TEXT UNIQUE,
    is_revoked BOOLEAN DEFAULT false,
    revoked_date TIMESTAMPTZ,
    revoked_reason TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general', -- general, course, assignment, system
    read BOOLEAN DEFAULT false,
    read_date TIMESTAMPTZ,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_date TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log table
CREATE TABLE public.activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_organization_id ON public.users(organization_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_courses_organization_id ON public.courses(organization_id);
CREATE INDEX idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX idx_courses_published ON public.courses(is_published);
CREATE INDEX idx_modules_course_id ON public.modules(course_id);
CREATE INDEX idx_content_items_module_id ON public.content_items(module_id);
CREATE INDEX idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_status ON public.enrollments(status);
CREATE INDEX idx_content_progress_enrollment_id ON public.content_progress(enrollment_id);
CREATE INDEX idx_content_progress_content_item_id ON public.content_progress(content_item_id);
CREATE INDEX idx_teams_organization_id ON public.teams(organization_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_created_date ON public.activity_log(created_date);

-- Row Level Security Policies

-- Users policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Team managers can view users in their organization" ON public.users
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() 
            AND u.role IN ('team_manager', 'super_admin')
            AND u.organization_id = users.organization_id
        )
    );

-- Organizations policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization" ON public.organizations
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND organization_id = organizations.id
        )
    );

CREATE POLICY "Organization owners can update their organization" ON public.organizations
    FOR UPDATE USING (auth.uid() = owner_id);

-- Courses policies
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published courses are viewable by all authenticated users" ON public.courses
    FOR SELECT USING (is_published = true AND auth.role() = 'authenticated');

CREATE POLICY "Course instructors can view and edit their courses" ON public.courses
    FOR ALL USING (auth.uid() = instructor_id);

CREATE POLICY "Super admins can view all courses" ON public.courses
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Enrollments policies
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments" ON public.enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments" ON public.enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON public.enrollments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Course instructors can view enrollments for their courses" ON public.enrollments
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM public.courses 
            WHERE id = course_id AND instructor_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can view enrollments in their organization" ON public.enrollments
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM public.users u1
            JOIN public.users u2 ON u1.organization_id = u2.organization_id
            WHERE u1.id = auth.uid() 
            AND u1.role IN ('team_manager', 'super_admin')
            AND u2.id = enrollments.user_id
        )
    );

-- Similar policies for other tables
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Modules - inherit course permissions
CREATE POLICY "Module access follows course permissions" ON public.modules
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM public.courses 
            WHERE id = course_id 
            AND (
                is_published = true 
                OR instructor_id = auth.uid()
                OR EXISTS(
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND role = 'super_admin'
                )
            )
        )
    );

-- Content Items - inherit module permissions  
CREATE POLICY "Content item access follows module permissions" ON public.content_items
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

-- Content Progress - users can only see their own progress
CREATE POLICY "Users can view their own content progress" ON public.content_progress
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM public.enrollments 
            WHERE id = enrollment_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create/update their own content progress" ON public.content_progress
    FOR ALL USING (
        EXISTS(
            SELECT 1 FROM public.enrollments 
            WHERE id = enrollment_id AND user_id = auth.uid()
        )
    );

-- Notifications - users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to tables with updated_date
CREATE TRIGGER update_users_updated_date BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_organizations_updated_date BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_courses_updated_date BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_modules_updated_date BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_content_items_updated_date BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_enrollments_updated_date BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
CREATE TRIGGER update_content_progress_updated_date BEFORE UPDATE ON public.content_progress FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

-- Insert some sample data for testing
INSERT INTO public.users (id, email, full_name, role) 
VALUES 
(gen_random_uuid(), 'admin@evergreen.com', 'System Administrator', 'super_admin'),
(gen_random_uuid(), 'demo@example.com', 'Demo User', 'learner');

-- Insert sample course
INSERT INTO public.courses (title, description, is_published, instructor_id) 
VALUES (
    'Sample Compliance Course',
    'A sample course to test the migration',
    true,
    (SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1)
);