
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useStudentsSearch = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['students-search', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select(`
          *,
          profiles!inner(full_name, email)
        `);

      if (searchQuery) {
        // Search in department and skills
        query = query.or(`department.ilike.%${searchQuery}%,skills.cs.{${searchQuery}}`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      // Transform data to match StudentCard interface
      return data?.map(student => ({
        id: parseInt(student.id),
        name: student.profiles?.full_name || 'Unknown',
        year: student.year || 'Not specified',
        department: student.department || 'Not specified',
        skills: student.skills || [],
        gpa: student.gpa || 'N/A',
        resumeUrl: student.resume_url || '',
        email: student.profiles?.email || '',
        matchScore: searchQuery ? Math.floor(Math.random() * 30) + 70 : 85 // Mock score for now
      })) || [];
    },
    enabled: false, // Only run when explicitly called
  });
};
