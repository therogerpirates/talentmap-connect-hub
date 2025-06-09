import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StudentStats {
  totalStudents: number;
  studentsWithResumes: number;
}

export const useStudentStats = () => {
  return useQuery({
    queryKey: ['student-stats'],
    queryFn: async () => {
      // Get total students count
      const { count: totalStudents, error: totalError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get count of students with resumes
      const { count: studentsWithResumes, error: resumeError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .not('resume_url', 'is', null);

      if (resumeError) throw resumeError;

      return {
        totalStudents: totalStudents || 0,
        studentsWithResumes: studentsWithResumes || 0
      };
    }
  });
}; 