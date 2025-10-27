-- Add resume_form_data column to students table for storing extracted resume data
-- This replaces resume_builder_data with a more consistent naming convention
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS resume_form_data JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN students.resume_form_data IS 'Structured resume data extracted from uploaded PDF, formatted for Resume Builder form. Contains personal, education, skills, experience, projects, achievements, extracurricular, and summary fields.';

-- Create GIN index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_students_resume_form_data ON students USING GIN (resume_form_data);

-- Optional: If you want to migrate data from old column to new column (uncomment if needed)
-- UPDATE students 
-- SET resume_form_data = resume_builder_data 
-- WHERE resume_builder_data IS NOT NULL AND resume_form_data IS NULL;

-- Optional: Drop old column if you want to clean up (uncomment if needed)
-- ALTER TABLE students DROP COLUMN IF EXISTS resume_builder_data;
-- DROP INDEX IF EXISTS idx_students_resume_builder_data;
