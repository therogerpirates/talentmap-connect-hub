-- Add missing fields to students table for resume scanner functionality
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS projects TEXT[];
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS experience TEXT[];
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS cgpa TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS tenth_mark TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS twelfth_mark TEXT;

-- Add summary field for AI-generated resume summary
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS summary TEXT;

-- Create index for better performance on skills search
CREATE INDEX IF NOT EXISTS idx_students_skills ON public.students USING GIN (skills);

-- Create index for better performance on projects search
CREATE INDEX IF NOT EXISTS idx_students_projects ON public.students USING GIN (projects);

-- Create index for better performance on experience search
CREATE INDEX IF NOT EXISTS idx_students_experience ON public.students USING GIN (experience); 