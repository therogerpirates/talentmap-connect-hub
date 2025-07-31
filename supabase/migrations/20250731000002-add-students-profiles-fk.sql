-- Add missing foreign key relationship between students and profiles
-- Both tables should reference the same user ID (auth.users.id)

-- Add foreign key constraint to students table referencing profiles
-- Note: This assumes both tables already have the same id values
ALTER TABLE public.students 
ADD CONSTRAINT students_id_fkey 
FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update the students table relationships in Supabase types
-- This will allow proper joins between students and profiles tables
