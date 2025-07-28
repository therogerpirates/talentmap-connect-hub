import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StudentData {
  id: string;
  year?: string;
  department?: string;
  gpa?: string;
  skills?: string[];
  projects?: string[];
  experience?: string[];
  cgpa?: string;
  tenth_mark?: string;
  twelfth_mark?: string;
  summary?: string;
  resume_url?: string;
  ats_score?: number;
  has_internship?: boolean;
}

export const useStudentData = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['student-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useUpdateStudentData = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<StudentData>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('students')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-data', user?.id] });
    },
  });
};
