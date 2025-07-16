# 🔧 Fix Storage Upload Permissions

## The Problem
You're getting "new row violates row-level security policy" when uploading videos because Supabase Storage needs specific Row Level Security (RLS) policies to allow file uploads.

## 🚀 Quick Fix - Run This SQL in Supabase Dashboard

1. **Go to your Supabase Dashboard:** https://supabase.com/dashboard
2. **Navigate to:** SQL Editor
3. **Copy and paste this SQL code:**

```sql
-- Fix Storage Permissions for File Uploads
-- Run this entire script in Supabase SQL Editor

-- Ensure the course-content bucket exists
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
DROP POLICY IF EXISTS "Allow authenticated uploads to course-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to course-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to course-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from course-content" ON storage.objects;

-- Create new, working storage policies

-- 1. Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to course-content" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'course-content' 
        AND auth.role() = 'authenticated'
    );

-- 2. Allow public read access to files
CREATE POLICY "Allow public read access to course-content" ON storage.objects
    FOR SELECT USING (bucket_id = 'course-content');

-- 3. Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates to course-content" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'course-content' 
        AND auth.role() = 'authenticated'
    );

-- 4. Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from course-content" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'course-content' 
        AND auth.role() = 'authenticated'
    );

-- Update bucket configuration
UPDATE storage.buckets 
SET 
    public = true,
    file_size_limit = 104857600, -- 100MB limit
    allowed_mime_types = ARRAY[
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/quicktime',
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'image/jpeg', 'image/png'
    ]
WHERE id = 'course-content';
```

4. **Click "RUN" to execute the SQL**

## ✅ What This Does

- ✅ Creates the `course-content` storage bucket (if it doesn't exist)
- ✅ Removes any conflicting security policies
- ✅ Creates proper Row Level Security policies for:
  - **File uploads** (authenticated users only)
  - **File downloads** (public access)
  - **File updates/deletes** (authenticated users only)
- ✅ Sets bucket configuration:
  - Public access enabled
  - 100MB file size limit
  - Allows video, PDF, and document file types

## 🧪 Test After Running SQL

1. **Go back to your Course Builder**
2. **Try uploading a video** in a lesson
3. **Should work without the security policy error**

## 🆘 If It Still Doesn't Work

If you're still getting errors, check:

1. **Make sure you're logged in** to the app (magic link authentication)
2. **Refresh the page** after running the SQL
3. **Check the browser console** for any other errors
4. **Try a smaller video file** (under 100MB)

## 📂 File Location

This fix is saved in your project at:
`/Users/davidshapiro/Desktop/evergreen-deploy/fix-storage-permissions.sql`

## 🎯 Expected Result

After running this SQL, video uploads in the Course Builder should work perfectly! You'll be able to:
- ✅ Upload videos to lessons
- ✅ Upload PDF assets to lessons  
- ✅ Create complete courses with media content