-- EverGreen Comply: Schema Updates for New Feature Set
-- Updates to support: role automation, course versioning, bulk purchases, language support

-- =============================================================================
-- 1. COURSE UPDATES: Add SKU and enhanced versioning
-- =============================================================================

-- Add SKU to courses table (constant across all versions)
ALTER TABLE public.courses 
ADD COLUMN sku TEXT UNIQUE,
ADD COLUMN available_languages TEXT[] DEFAULT ARRAY['en']::TEXT[],
ADD COLUMN default_language TEXT DEFAULT 'en';

-- Update course_versions table for enhanced versioning workflow
ALTER TABLE public.course_versions 
ADD COLUMN version_string TEXT NOT NULL DEFAULT '1.0', -- e.g., "2.1", "3.0"
ADD COLUMN version_type TEXT DEFAULT 'major', -- 'hotswap' or 'major'
ADD COLUMN is_live BOOLEAN DEFAULT false, -- which version is live for new enrollments
ADD COLUMN change_summary TEXT, -- description of changes made
ADD COLUMN active_learners_count INTEGER DEFAULT 0; -- cached count for GUI

-- =============================================================================
-- 2. ENHANCED PURCHASE SYSTEM: Support bulk purchases and license tracking
-- =============================================================================

-- Create purchase orders table (replaces individual course_purchases for bulk)
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

-- Create purchase order items (individual course purchases within an order)
CREATE TABLE public.purchase_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    sku TEXT NOT NULL, -- store SKU at time of purchase
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create course licenses table (tracks individual licenses from purchases)
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

-- =============================================================================
-- 3. LANGUAGE SUPPORT: Per-user, per-course language preferences
-- =============================================================================

-- Add language tracking to enrollments
ALTER TABLE public.enrollments 
ADD COLUMN selected_language TEXT DEFAULT 'en',
ADD COLUMN language_selected_date TIMESTAMPTZ;

-- Create content items language variants
CREATE TABLE public.content_item_languages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL, -- 'en', 'es', etc.
    title TEXT,
    description TEXT,
    content_url TEXT,
    content_data JSONB DEFAULT '{}'::jsonb,
    transcript TEXT,
    captions JSONB,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_item_id, language_code)
);

-- =============================================================================
-- 4. ENHANCED ASSESSMENTS: Final exam designation and 80% requirement
-- =============================================================================

-- Update assessments table
ALTER TABLE public.assessments 
ADD COLUMN is_final_exam BOOLEAN DEFAULT false,
ADD COLUMN required_pass_percentage DECIMAL(5,2) DEFAULT 80.00;

-- Update passing score default to 80%
ALTER TABLE public.assessments 
ALTER COLUMN passing_score SET DEFAULT 80.00;

-- =============================================================================
-- 5. ENHANCED PROGRESS TRACKING: Version compliance and sequential enforcement
-- =============================================================================

-- Add version tracking to enrollments (for compliance)
ALTER TABLE public.enrollments 
ADD COLUMN course_version_id UUID REFERENCES public.course_versions(id),
ADD COLUMN final_exam_score DECIMAL(5,2),
ADD COLUMN all_videos_completed BOOLEAN DEFAULT false,
ADD COLUMN all_quizzes_passed BOOLEAN DEFAULT false,
ADD COLUMN sequential_completion_enforced BOOLEAN DEFAULT true;

-- Update content progress for sequential tracking
ALTER TABLE public.content_progress 
ADD COLUMN can_access BOOLEAN DEFAULT false, -- based on previous completion
ADD COLUMN minimum_score_met BOOLEAN DEFAULT false; -- for 80% requirement

-- =============================================================================
-- 6. USER ROLE AUTOMATION: Track purchase counts for role assignment
-- =============================================================================

-- Function to automatically assign roles based on purchase count
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
            WHERE id = NEW.user_id AND role = 'learner'; -- keep existing team_managers
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

-- =============================================================================
-- 7. ENHANCED COURSE VERSIONING: Functions for version management
-- =============================================================================

-- Function to create new course version
CREATE OR REPLACE FUNCTION create_course_version(
    p_course_id UUID,
    p_version_string TEXT,
    p_version_type TEXT DEFAULT 'major',
    p_change_summary TEXT DEFAULT '',
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_version_id UUID;
    current_content JSONB;
BEGIN
    -- Get current course content structure
    SELECT jsonb_build_object(
        'modules', jsonb_agg(
            jsonb_build_object(
                'id', m.id,
                'title', m.title,
                'order_index', m.order_index,
                'content_items', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', ci.id,
                            'title', ci.title,
                            'content_type', ci.content_type,
                            'order_index', ci.order_index
                        )
                    )
                    FROM public.content_items ci
                    WHERE ci.module_id = m.id
                    ORDER BY ci.order_index
                )
            )
            ORDER BY m.order_index
        )
    ) INTO current_content
    FROM public.modules m
    WHERE m.course_id = p_course_id;
    
    -- Create new version
    INSERT INTO public.course_versions (
        course_id, 
        version_string, 
        version_type,
        title, 
        description, 
        content_snapshot,
        change_summary,
        created_by,
        is_active
    )
    SELECT 
        p_course_id,
        p_version_string,
        p_version_type,
        title,
        description,
        current_content,
        p_change_summary,
        p_created_by,
        false -- new versions start inactive
    FROM public.courses 
    WHERE id = p_course_id
    RETURNING id INTO new_version_id;
    
    RETURN new_version_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. INDEXES for performance
-- =============================================================================

CREATE INDEX idx_courses_sku ON public.courses(sku);
CREATE INDEX idx_purchase_orders_user_status ON public.purchase_orders(user_id, status);
CREATE INDEX idx_course_licenses_purchased_by ON public.course_licenses(purchased_by);
CREATE INDEX idx_course_licenses_assigned_to ON public.course_licenses(assigned_to);
CREATE INDEX idx_course_licenses_status ON public.course_licenses(status);
CREATE INDEX idx_enrollments_course_version ON public.enrollments(course_version_id);
CREATE INDEX idx_content_item_languages_item_lang ON public.content_item_languages(content_item_id, language_code);
CREATE INDEX idx_assessments_final_exam ON public.assessments(is_final_exam);

-- =============================================================================
-- 9. UPDATE ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Policies for new tables
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_item_languages ENABLE ROW LEVEL SECURITY;

-- Purchase orders - users can view their own
CREATE POLICY "Users can view their own purchase orders" ON public.purchase_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase orders" ON public.purchase_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Course licenses - users can view licenses they purchased or were assigned
CREATE POLICY "Users can view their purchased or assigned licenses" ON public.course_licenses
    FOR SELECT USING (
        auth.uid() = purchased_by OR 
        auth.uid() = assigned_to OR
        EXISTS(
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Team managers can view licenses they purchased
CREATE POLICY "Team managers can manage their purchased licenses" ON public.course_licenses
    FOR UPDATE USING (auth.uid() = purchased_by);

-- Content item languages inherit from content items
CREATE POLICY "Content language access follows content item permissions" ON public.content_item_languages
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM public.content_items ci
            JOIN public.modules m ON ci.module_id = m.id
            JOIN public.courses c ON m.course_id = c.id
            WHERE ci.id = content_item_id 
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

-- =============================================================================
-- 10. SAMPLE DATA for testing
-- =============================================================================

-- Add SKUs to existing courses (if any)
UPDATE public.courses SET sku = 'course-' || id::text WHERE sku IS NULL;

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