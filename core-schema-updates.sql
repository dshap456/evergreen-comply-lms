-- Core Schema Updates for EverGreen Comply (Essential only)

-- 1. Add SKU to courses
ALTER TABLE public.courses 
ADD COLUMN sku TEXT UNIQUE,
ADD COLUMN available_languages TEXT[] DEFAULT ARRAY['en']::TEXT[],
ADD COLUMN default_language TEXT DEFAULT 'en';

-- 2. Create purchase orders table
CREATE TABLE public.purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    stripe_payment_intent_id TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    created_date TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create purchase order items
CREATE TABLE public.purchase_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- 4. Create course licenses table
CREATE TABLE public.course_licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_item_id UUID REFERENCES public.purchase_order_items(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    purchased_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'available',
    created_date TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add final exam designation to assessments
ALTER TABLE public.assessments 
ADD COLUMN is_final_exam BOOLEAN DEFAULT false,
ADD COLUMN required_pass_percentage DECIMAL(5,2) DEFAULT 80.00;

-- 6. Add version tracking to enrollments
ALTER TABLE public.enrollments 
ADD COLUMN course_version_id UUID REFERENCES public.course_versions(id),
ADD COLUMN final_exam_score DECIMAL(5,2);

-- 7. Add SKUs to existing courses
UPDATE public.courses SET sku = 'COURSE-' || UPPER(SUBSTRING(id::text, 1, 8)) WHERE sku IS NULL;