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
      const { data, error } = await supabase
        .from('session_candidates')
        .select(`
          *,
          student:students(
            id,
            year,
            department,
            gpa,
            skills,
            profile:profiles(
              full_name,
              email,
              college,
              gender,
              tenth_percentage,
              twelfth_percentage
            )
          )
        `)
        .eq('session_id', sessionId)
        .order('match_score', { ascending: false });
      
      if (error) throw error;
      return data as unknown as SessionCandidate[];
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