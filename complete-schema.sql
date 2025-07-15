-- EverGreen Comply: Complete Database Schema for Supabase
-- Includes original schema + new feature updates

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

-- Courses table (with new SKU and language features)
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
    settings JSONB DEFAULT '{}'::jsonb,
    -- NEW: Enhanced features
    sku TEXT UNIQUE,
    available_languages TEXT[] DEFAULT ARRAY['en']::TEXT[],
    default_language TEXT DEFAULT 'en'
);

-- Course Versions table (enhanced for versioning workflow)
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
    -- NEW: Enhanced versioning features
    version_string TEXT NOT NULL DEFAULT '1.0',
    version_type TEXT DEFAULT 'major',
    is_live BOOLEAN DEFAULT false,
    change_summary TEXT,
    active_learners_count INTEGER DEFAULT 0,
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

-- Enrollments table (enhanced with version tracking)
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
    -- NEW: Enhanced tracking features
    course_version_id UUID REFERENCES public.course_versions(id),
    final_exam_score DECIMAL(5,2),
    selected_language TEXT DEFAULT 'en',
    language_selected_date TIMESTAMPTZ,
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

-- Assessments table (enhanced with final exam features)
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
    passing_score DECIMAL(5,2) DEFAULT 80.00, -- Updated default to 80%
    randomize_questions BOOLEAN DEFAULT false,
    show_correct_answers BOOLEAN DEFAULT true,
    show_results_immediately BOOLEAN DEFAULT true,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    -- NEW: Final exam features
    is_final_exam BOOLEAN DEFAULT false,
    required_pass_percentage DECIMAL(5,2) DEFAULT 80.00
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

-- NEW: Purchase Orders table (for bulk purchases)
CREATE TABLE public.purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_session_id TEXT,
    status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- NEW: Purchase Order Items table
CREATE TABLE public.purchase_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW()
);

-- NEW: Course Licenses table (tracks individual licenses)
CREATE TABLE public.course_licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_item_id UUID REFERENCES public.purchase_order_items(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    purchased_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_date TIMESTAMPTZ,
    invitation_sent BOOLEAN DEFAULT false,
    invitation_accepted BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'available', -- available, assigned, used
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
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
CREATE INDEX idx_courses_sku ON public.courses(sku);
CREATE INDEX idx_modules_course_id ON public.modules(course_id);
CREATE INDEX idx_content_items_module_id ON public.content_items(module_id);
CREATE INDEX idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_status ON public.enrollments(status);
CREATE INDEX idx_enrollments_course_version ON public.enrollments(course_version_id);
CREATE INDEX idx_content_progress_enrollment_id ON public.content_progress(enrollment_id);
CREATE INDEX idx_content_progress_content_item_id ON public.content_progress(content_item_id);
CREATE INDEX idx_purchase_orders_user_status ON public.purchase_orders(user_id, status);
CREATE INDEX idx_course_licenses_purchased_by ON public.course_licenses(purchased_by);
CREATE INDEX idx_course_licenses_assigned_to ON public.course_licenses(assigned_to);
CREATE INDEX idx_course_licenses_status ON public.course_licenses(status);
CREATE INDEX idx_assessments_final_exam ON public.assessments(is_final_exam);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_created_date ON public.activity_log(created_date);

-- Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_licenses ENABLE ROW LEVEL SECURITY;

-- Users policies
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

-- Organizations policies
CREATE POLICY "Users can view their organization" ON public.organizations
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND organization_id = organizations.id
        )
    );

-- Courses policies
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
CREATE POLICY "Users can view their own enrollments" ON public.enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments" ON public.enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON public.enrollments
    FOR UPDATE USING (auth.uid() = user_id);

-- Purchase orders policies
CREATE POLICY "Users can view their own purchase orders" ON public.purchase_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase orders" ON public.purchase_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Course licenses policies
CREATE POLICY "Users can view their purchased or assigned licenses" ON public.course_licenses
    FOR SELECT USING (
        auth.uid() = purchased_by OR 
        auth.uid() = assigned_to OR
        EXISTS(
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Team managers can manage their purchased licenses" ON public.course_licenses
    FOR UPDATE USING (auth.uid() = purchased_by);

-- Notifications policies
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

-- Function for automatic role assignment based on purchase count
CREATE OR REPLACE FUNCTION update_user_role_based_on_purchases()
RETURNS TRIGGER AS $$
DECLARE
    purchase_count INTEGER;
    user_role_current user_role;
BEGIN
    -- Count unique courses purchased by the user
    SELECT COUNT(DISTINCT poi.course_id)
    INTO purchase_count
    FROM public.purchase_order_items poi
    JOIN public.purchase_orders po ON poi.purchase_order_id = po.id
    WHERE po.user_id = NEW.user_id AND po.status = 'completed';
    
    -- Get current user role
    SELECT role INTO user_role_current 
    FROM public.users 
    WHERE id = NEW.user_id;
    
    -- Update role based on purchase count (only if not super_admin)
    IF user_role_current != 'super_admin' THEN
        IF purchase_count >= 2 THEN
            UPDATE public.users 
            SET role = 'team_manager', updated_date = NOW()
            WHERE id = NEW.user_id AND role != 'team_manager';
        ELSIF purchase_count = 1 THEN
            UPDATE public.users 
            SET role = 'learner', updated_date = NOW()
            WHERE id = NEW.user_id AND role = 'learner';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic role assignment
CREATE TRIGGER trigger_update_user_role
    AFTER INSERT OR UPDATE ON public.purchase_orders
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_user_role_based_on_purchases();

-- Add SKUs to any existing courses
UPDATE public.courses SET sku = 'COURSE-' || UPPER(SUBSTRING(id::text, 1, 8)) WHERE sku IS NULL;

-- Create sample course versions for existing courses
INSERT INTO public.course_versions (course_id, version_string, title, description, is_active, is_live)
SELECT 
    id, 
    '1.0', 
    title, 
    description, 
    true,
    true
FROM public.courses 
WHERE NOT EXISTS (
    SELECT 1 FROM public.course_versions WHERE course_id = courses.id
);

-- Update existing enrollments with version references
UPDATE public.enrollments 
SET course_version_id = (
    SELECT cv.id 
    FROM public.course_versions cv 
    WHERE cv.course_id = enrollments.course_id 
    AND cv.is_live = true 
    LIMIT 1
)
WHERE course_version_id IS NULL;

-- Insert sample data for testing
INSERT INTO public.users (id, email, full_name, role) 
VALUES 
(gen_random_uuid(), 'admin@evergreen.com', 'System Administrator', 'super_admin')
ON CONFLICT (id) DO NOTHING;

-- Insert sample course
INSERT INTO public.courses (title, description, is_published, instructor_id, sku) 
VALUES (
    'Sample Compliance Course',
    'A sample course to test the migration',
    true,
    (SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1),
    'SAMPLE-001'
)
ON CONFLICT (sku) DO NOTHING;