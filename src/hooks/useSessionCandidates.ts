import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SessionCandidate {
  id: string;
  session_id: string;
  student_id: string;
  status: 'applied' | 'shortlisted' | 'waitlisted' | 'hired' | 'rejected';
  match_score: number;
  recruiter_notes?: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    year?: string;
    department?: string;
    gpa?: string;
    skills?: string[];
    profile?: {
      full_name: string;
      email: string;
      college?: string;
      gender?: string;
      tenth_percentage?: number;
      twelfth_percentage?: number;
    };
  };
}

export const useSessionCandidates = (sessionId: string) => {
  return useQuery({
    queryKey: ['session-candidates', sessionId],
    queryFn: async () => {
      // First get the session candidates
      const { data: candidates, error: candidatesError } = await supabase
        .from('session_candidates')
        .select('*')
        .eq('session_id', sessionId)
        .order('match_score', { ascending: false });
      
      // Handle RLS policy errors gracefully
      if (candidatesError) {
        console.warn('Error fetching session candidates:', candidatesError);
        // Return empty array for RLS errors instead of throwing
        if (candidatesError.code === '42501' || candidatesError.message?.includes('policy')) {
          return [];
        }
        throw candidatesError;
      }
      if (!candidates || candidates.length === 0) return [];
      
      // Get student IDs
      const studentIds = candidates.map(c => c.student_id);
      
      // Fetch students data
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, year, department, gpa, skills, linkedin_url, github_url, leetcode_url, summary, projects, experience, ats_score, resume_url')
        .in('id', studentIds);
      
      if (studentsError) throw studentsError;
      
      // Fetch profiles data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, college, gender, tenth_percentage, twelfth_percentage')
        .in('id', studentIds);
        
      if (profilesError) throw profilesError;
      
      // Combine the data
      const candidatesWithStudentData = candidates.map(candidate => {
        const student = students?.find(s => s.id === candidate.student_id);
        const profile = profiles?.find(p => p.id === candidate.student_id);
        
        return {
          ...candidate,
          student: student ? {
            ...student,
            profile: profile || null
          } : null
        };
      });
      
      return candidatesWithStudentData as unknown as SessionCandidate[];
    },
    enabled: !!sessionId,
  });
};

export const useUpdateCandidateStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      recruiter_notes 
    }: { 
      id: string; 
      status: SessionCandidate['status']; 
      recruiter_notes?: string; 
    }) => {
      const { data, error } = await supabase
        .from('session_candidates')
        .update({ status, recruiter_notes })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Get the session_id from the updated candidate
      queryClient.invalidateQueries({ queryKey: ['session-candidates'] });
      
      // If hiring someone, update session current_hires count
      if (variables.status === 'hired') {
        queryClient.invalidateQueries({ queryKey: ['hiring-sessions'] });
      }
    },
  });
};

export const useAddCandidateToSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      studentId, 
      matchScore 
    }: { 
      sessionId: string; 
      studentId: string; 
      matchScore: number; 
    }) => {
      const { data, error } = await supabase
        .from('session_candidates')
        .insert({
          session_id: sessionId,
          student_id: studentId,
          match_score: matchScore,
          status: 'applied'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-candidates'] });
    },
  });
};