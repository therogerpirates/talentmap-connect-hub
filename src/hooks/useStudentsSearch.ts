import { useQuery } from '@tanstack/react-query';

// Define an interface for the student data returned by the search
interface SearchResultStudent {
  id: string;
  name: string; // Assuming 'name' is derived from full_name
  year: string;
  department: string;
  skills: string[];
  gpa: string;
  resumeUrl: string;
  email: string;
  matchScore: number; // Assuming similarity is mapped to matchScore
  ats_score?: number; // Added ats_score
  has_internship?: boolean; // Added has_internship
  // Add other fields you might need from the search results
}

export const useStudentsSearch = (searchQuery?: string, selectedSkills: string[] = []) => {
  return useQuery({
    queryKey: ['students-search', searchQuery, selectedSkills],
    queryFn: async () => {
      if (!searchQuery && selectedSkills.length === 0) return [];
      const response = await fetch('http://localhost:8000/search-students/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          skills: selectedSkills
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch matching students');
      }
      const data = await response.json();
      // Map backend results to SearchResultStudent interface
      return (data.results || []).map((student: any): SearchResultStudent => ({
        id: student.id,
        name: student.full_name || 'Unknown',
        year: student.year || 'Not specified',
        department: student.department || 'Not specified',
        skills: Array.isArray(student.skills) ? student.skills : (student.skills ? student.skills.split(',') : []),
        gpa: student.gpa !== undefined && student.gpa !== null ? String(student.gpa) : 'N/A',
        resumeUrl: student.resume_url || '',
        email: student.email || '',
        matchScore: student.similarity ? Math.round(student.similarity * 100) : 0,
        ats_score: student.ats_score, // Map ats_score
        has_internship: student.has_internship, // Map has_internship
      }));
    },
    enabled: false, // Only run when explicitly called
  });
};
