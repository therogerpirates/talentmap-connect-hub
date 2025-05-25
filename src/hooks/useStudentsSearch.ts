import { useQuery } from '@tanstack/react-query';

export const useStudentsSearch = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['students-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const response = await fetch('http://localhost:8000/search-students/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch matching students');
      }
      const data = await response.json();
      // Map backend results to StudentCard props
      return (data.results || []).map((student: any) => ({
        id: student.id,
        name: student.full_name || 'Unknown',
        year: student.year || 'Not specified',
        department: student.department || 'Not specified',
        skills: Array.isArray(student.skills) ? student.skills : (student.skills ? student.skills.split(',') : []),
        gpa: student.gpa !== undefined && student.gpa !== null ? String(student.gpa) : 'N/A',
        resumeUrl: student.resume_url || '',
        email: student.email || '',
        matchScore: student.similarity ? Math.round(student.similarity * 100) : 0,
      }));
    },
    enabled: false, // Only run when explicitly called
  });
};
