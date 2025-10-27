-- Add resume_builder_data column to students table for storing extracted resume data
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS resume_builder_data JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN students.resume_builder_data IS 'Structured resume data extracted from uploaded PDF for use in Resume Builder';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_students_resume_builder_data ON students USING GIN (resume_builder_data);
