-- Create hiring_sessions table
CREATE TABLE public.hiring_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  requirements JSONB NOT NULL DEFAULT '{}',
  eligibility_criteria JSONB NOT NULL DEFAULT '{}',
  target_hires INTEGER NOT NULL DEFAULT 1,
  current_hires INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session_candidates table
CREATE TABLE public.session_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.hiring_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'waitlisted', 'hired', 'rejected')),
  match_score DECIMAL(5,2) DEFAULT 0,
  recruiter_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_id)
);

-- Add missing fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenth_percentage DECIMAL(5,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twelfth_percentage DECIMAL(5,2);

-- Enable RLS on new tables
ALTER TABLE public.hiring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_candidates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hiring_sessions
CREATE POLICY "Recruiters can view their own sessions" ON public.hiring_sessions
  FOR SELECT USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can create sessions" ON public.hiring_sessions
  FOR INSERT WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can update their own sessions" ON public.hiring_sessions
  FOR UPDATE USING (recruiter_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON public.hiring_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for session_candidates
CREATE POLICY "Recruiters can view candidates in their sessions" ON public.session_candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hiring_sessions 
      WHERE id = session_id AND recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can manage candidates in their sessions" ON public.session_candidates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hiring_sessions 
      WHERE id = session_id AND recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own applications" ON public.session_candidates
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can view all session candidates" ON public.session_candidates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_hiring_sessions_recruiter_id ON public.hiring_sessions(recruiter_id);
CREATE INDEX idx_hiring_sessions_status ON public.hiring_sessions(status);
CREATE INDEX idx_session_candidates_session_id ON public.session_candidates(session_id);
CREATE INDEX idx_session_candidates_student_id ON public.session_candidates(student_id);
CREATE INDEX idx_session_candidates_status ON public.session_candidates(status);
CREATE INDEX idx_session_candidates_match_score ON public.session_candidates(match_score DESC);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_hiring_sessions_updated_at
  BEFORE UPDATE ON public.hiring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_candidates_updated_at
  BEFORE UPDATE ON public.session_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();