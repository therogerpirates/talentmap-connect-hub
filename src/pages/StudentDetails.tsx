import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useStudentData } from '@/hooks/useStudentData';
import StudentSidebar from '@/components/StudentSidebar';
import ATSScoreCircle from '@/components/ATSScoreCircle';
import { ProfileHeaderCard } from '@/components/student-profile/ProfileHeaderCard';
import { SkillsCard } from '@/components/student-profile/SkillsCard';
import { ExternalProfilesCard } from '@/components/student-profile/ExternalProfilesCard';
import { ProjectsCard } from '@/components/student-profile/ProjectsCard';
import { ExperienceCard } from '@/components/student-profile/ExperienceCard';
import { CertificationsCard } from '@/components/student-profile/CertificationsCard';

interface StudentDetailsData {
  skills: string[];
  skillSections?: { heading: string; items: string[] }[];
  projects: string[];
  experience: string[];
  certifications: string[];
  cgpa: number;
  tenth_percentage: number;
  twelfth_percentage: number;
}

const StudentDetails = () => {
  const { data: studentData, isLoading: studentLoading } = useStudentData();

  const [detailsData, setDetailsData] = useState<StudentDetailsData>({
    skills: [],
    skillSections: [],
    projects: [],
    experience: [],
    certifications: [],
    cgpa: 0,
    tenth_percentage: 0,
    twelfth_percentage: 0
  });

  // Derived state for ATS Score & Improvements
  const [atsScore, setAtsScore] = useState(0);
  const [improvements, setImprovements] = useState<string[]>([]);

  useEffect(() => {
    if (studentData) {
      const resumeFormData = (studentData as any).resume_form_data;
      setDetailsData({
        skills: Array.isArray(studentData.skills) ? studentData.skills.map(String) : [],
        skillSections: resumeFormData?.skillSections || [],
        projects: Array.isArray(studentData.projects) ? studentData.projects.map(String) : [],
        experience: Array.isArray(studentData.experience) ? studentData.experience.map(String) : [],
        certifications: Array.isArray(studentData.certifications) ? studentData.certifications.map(String) : [],
        cgpa: parseFloat(studentData.gpa || '0'),
        tenth_percentage: parseFloat((studentData as any).tenth_percentage || '0'),
        twelfth_percentage: parseFloat((studentData as any).twelfth_percentage || '0')
      });

      const score = studentData.ats_score || 0;
      setAtsScore(score);

      const aiSuggestions = (studentData as any).resume_form_data?.suggestions;

      if (Array.isArray(aiSuggestions) && aiSuggestions.length > 0) {
        setImprovements(aiSuggestions);
      } else {
        // Generate improvements dynamically if not persisted or empty
        const msgs = [];
        if (score < 60) msgs.push("Resume content is sparse. Add more details to projects.");
        if (((studentData.skills as any)?.length || 0) < 5) msgs.push("Add more technical skills to improve matching.");
        if (!studentData.summary) msgs.push("Add a professional summary to your resume.");
        if (((studentData.projects as any)?.length || 0) < 2) msgs.push("Include at least 2 significant projects.");
        if (msgs.length === 0 && score < 100) msgs.push("Review job descriptions to tailor your keywords.");
        // Fallback text from UI mock
        if (msgs.length === 0) msgs.push("Resume looks great! Keep updating with new achievements.");

        setImprovements(msgs);
      }
    }
  }, [studentData]);

  if (studentLoading) {
    return (
      <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden">
      <StudentSidebar />

      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
          </div>

          {/* Top Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left Column: Profile + (Skills & Links) */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              {/* Profile Card */}
              <ProfileHeaderCard studentData={studentData} detailsData={detailsData} />

              {/* Inner Grid: Skills & External Profiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Skills Card */}
                <SkillsCard skills={detailsData.skills} skillSections={detailsData.skillSections} />

                {/* External Profiles */}
                <ExternalProfilesCard studentData={studentData} />
              </div>
            </div>

            {/* Right Column: ATS Score */}
            <div className="xl:col-span-1">
              <Card className="bg-white dark:bg-slate-900 border-none shadow-lg h-full">
                <ATSScoreCircle score={atsScore} improvements={improvements} />
              </Card>
            </div>
          </div>

          {/* Bottom Section: Projects */}
          <ProjectsCard projects={detailsData.projects} />

          {/* Experience Section */}
          <ExperienceCard experience={detailsData.experience} />

          {/* Certifications Section */}
          <CertificationsCard certifications={detailsData.certifications} />


        </div>
      </main>
    </div>
  );
};

export default StudentDetails;