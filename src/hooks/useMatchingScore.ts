import { useMemo } from 'react';

interface StudentProfile {
  gpa?: string;
  skills?: string[];
  year?: string;
  department?: string;
  profile?: {
    tenth_percentage?: number;
    twelfth_percentage?: number;
  };
}

interface SessionCriteria {
  min_gpa?: number;
  required_skills?: string[];
  preferred_skills?: string[];
  min_tenth_percentage?: number;
  min_twelfth_percentage?: number;
  eligible_years?: string[];
  eligible_departments?: string[];
}

export const useMatchingScore = (student: StudentProfile, criteria: SessionCriteria) => {
  return useMemo(() => {
    let score = 0;
    let maxScore = 0;

    // GPA scoring (weight: 25%)
    maxScore += 25;
    if (criteria.min_gpa && student.gpa) {
      const studentGpa = parseFloat(student.gpa);
      if (studentGpa >= criteria.min_gpa) {
        score += 25;
      } else {
        // Partial score based on how close they are
        score += Math.max(0, (studentGpa / criteria.min_gpa) * 25);
      }
    } else if (student.gpa) {
      // If no minimum specified, give full points for having GPA
      score += 25;
    }

    // Required skills scoring (weight: 30%)
    maxScore += 30;
    if (criteria.required_skills && criteria.required_skills.length > 0 && student.skills) {
      const matchedSkills = criteria.required_skills.filter(skill => 
        student.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      );
      score += (matchedSkills.length / criteria.required_skills.length) * 30;
    } else if (student.skills && student.skills.length > 0) {
      score += 30;
    }

    // Preferred skills scoring (weight: 15%)
    maxScore += 15;
    if (criteria.preferred_skills && criteria.preferred_skills.length > 0 && student.skills) {
      const matchedPreferred = criteria.preferred_skills.filter(skill => 
        student.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      );
      score += (matchedPreferred.length / criteria.preferred_skills.length) * 15;
    } else if (student.skills && student.skills.length > 0) {
      score += 15;
    }

    // Academic marks scoring (weight: 15%)
    maxScore += 15;
    let marksScore = 0;
    if (criteria.min_tenth_percentage && student.profile?.tenth_percentage) {
      if (student.profile.tenth_percentage >= criteria.min_tenth_percentage) {
        marksScore += 7.5;
      } else {
        marksScore += (student.profile.tenth_percentage / criteria.min_tenth_percentage) * 7.5;
      }
    } else if (student.profile?.tenth_percentage) {
      marksScore += 7.5;
    }

    if (criteria.min_twelfth_percentage && student.profile?.twelfth_percentage) {
      if (student.profile.twelfth_percentage >= criteria.min_twelfth_percentage) {
        marksScore += 7.5;
      } else {
        marksScore += (student.profile.twelfth_percentage / criteria.min_twelfth_percentage) * 7.5;
      }
    } else if (student.profile?.twelfth_percentage) {
      marksScore += 7.5;
    }
    score += marksScore;

    // Year and department eligibility (weight: 15%)
    maxScore += 15;
    let eligibilityScore = 0;
    
    if (criteria.eligible_years && criteria.eligible_years.length > 0) {
      if (student.year && criteria.eligible_years.includes(student.year)) {
        eligibilityScore += 7.5;
      }
    } else if (student.year) {
      eligibilityScore += 7.5;
    }

    if (criteria.eligible_departments && criteria.eligible_departments.length > 0) {
      if (student.department && criteria.eligible_departments.includes(student.department)) {
        eligibilityScore += 7.5;
      }
    } else if (student.department) {
      eligibilityScore += 7.5;
    }
    score += eligibilityScore;

    // Return percentage score
    return Math.min(100, Math.round((score / maxScore) * 100));
  }, [student, criteria]);
};