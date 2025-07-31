-- Update session_candidates table to remove 'applied' status and update allowed statuses
-- Drop the existing check constraint
ALTER TABLE public.session_candidates DROP CONSTRAINT IF EXISTS session_candidates_status_check;

-- Add new check constraint with updated statuses (removed 'applied', changed default to 'shortlisted')
ALTER TABLE public.session_candidates ADD CONSTRAINT session_candidates_status_check 
  CHECK (status IN ('shortlisted', 'waitlisted', 'hired', 'rejected'));

-- Update default status to 'shortlisted' for new records
ALTER TABLE public.session_candidates ALTER COLUMN status SET DEFAULT 'shortlisted';

-- Update any existing 'applied' records to 'shortlisted'
UPDATE public.session_candidates SET status = 'shortlisted' WHERE status = 'applied';
