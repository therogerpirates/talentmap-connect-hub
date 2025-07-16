import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HiringSession {
  id: string;
  recruiter_id: string;
  title: string;
  role: string;
  description?: string;
  requirements: Record<string, any>;
  eligibility_criteria: Record<string, any>;
  target_hires: number;
  current_hires: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateSessionData {
  title: string;
  role: string;
  description?: string;
  requirements: Record<string, any>;
  eligibility_criteria: Record<string, any>;
  target_hires: number;
}

export const useHiringSessions = () => {
  return useQuery({
    queryKey: ['hiring-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hiring_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as HiringSession[];
    },
  });
};

export const useCreateHiringSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionData: CreateSessionData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('hiring_sessions')
        .insert({
          ...sessionData,
          recruiter_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hiring-sessions'] });
    },
  });
};

export const useUpdateHiringSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HiringSession> & { id: string }) => {
      const { data, error } = await supabase
        .from('hiring_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hiring-sessions'] });
    },
  });
};