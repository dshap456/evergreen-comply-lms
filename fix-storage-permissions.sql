-- Fix Supabase Storage Permissions for File Uploads
-- This script creates the proper Row Level Security policies for the course-content bucket

-- First, ensure the course-content bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-content', 'course-content', true)
ON CONFLICT (id) DO NOTHING;

-- Remove any existing conflicting policies
DROP POLICY IF EXISTS "Authenticated users can upload course content" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course content" ON storage.objects;
DROP POLICY IF EXISTS "Course instructors can delete their course content" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their files" ON storage.objects;

-- Create comprehensive storage policies for course-content bucket

-- 1. Allow authenticated users to upload files to course-content bucket
CREATE POLICY "Allow authenticated uploads to course-content" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'course-content' 
        AND auth.role() = 'authenticated'
    );

-- 2. Allow public read access to course-content files
CREATE POLICY "Allow public read access to course-content" ON storage.objects
    FOR SELECT USING (bucket_id = 'course-content');

-- 3. Allow authenticated users to update their uploaded files
CREATE POLICY "Allow authenticated updates to course-content" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'course-content' 
        AND auth.role() = 'authenticated'
    );

-- 4. Allow authenticated users to delete files from course-content
CREATE POLICY "Allow authenticated deletes from course-content" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'course-content' 
        AND auth.role() = 'authenticated'
    );

-- Also ensure the bucket has the right configuration
UPDATE storage.buckets 
SET 
    public = true,
    file_size_limit = 104857600, -- 100MB limit
    allowed_mime_types = ARRAY[
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
WHERE id = 'course-content';

-- Grant necessary permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;