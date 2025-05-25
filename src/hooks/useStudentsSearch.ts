
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useStudentsSearch = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['students-search', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      if (searchQuery) {
        // Search in department and other fields
        query = query.or(`department.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      // Transform data to match StudentCard interface
      return data?.map((profile, index) => ({
        id: index + 1, // Using index as id since we need a number
        name: profile.full_name || 'Unknown',
        year: profile.year || 'Not specified',
        department: profile.department || 'Not specified',
        skills: ['JavaScript', 'React', 'TypeScript'], // Mock skills for now
        gpa: 'N/A', // Mock GPA for now
        resumeUrl: '', // Mock resume URL for now
        email: profile.email || '',
        matchScore: searchQuery ? Math.floor(Math.random() * 30) + 70 : 85 // Mock score for now
      })) || [];
    },
    enabled: false, // Only run when explicitly called
  });
};
