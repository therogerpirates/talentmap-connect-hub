-- Temporary fix: Create more permissive RLS policies for debugging
-- WARNING: This should be removed in production

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Recruiters can view candidates in their sessions" ON public.session_candidates;
DROP POLICY IF EXISTS "Recruiters can manage candidates in their sessions" ON public.session_candidates;
DROP POLICY IF EXISTS "Students can view their own applications" ON public.session_candidates;

-- Create more permissive policies for debugging
CREATE POLICY "Allow all authenticated users to view session candidates" ON public.session_candidates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users to manage session candidates" ON public.session_candidates
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Similarly for hiring_sessions if needed
DROP POLICY IF EXISTS "Recruiters can view their own sessions" ON public.hiring_sessions;
DROP POLICY IF EXISTS "Recruiters can create sessions" ON public.hiring_sessions;
DROP POLICY IF EXISTS "Recruiters can update their own sessions" ON public.hiring_sessions;

CREATE POLICY "Allow all authenticated users to view hiring sessions" ON public.hiring_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users to create hiring sessions" ON public.hiring_sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users to update hiring sessions" ON public.hiring_sessions
  FOR UPDATE USING (auth.uid() IS NOT NULL);
