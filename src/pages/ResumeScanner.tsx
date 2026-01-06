import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentData, useUpdateStudentData } from '@/hooks/useStudentData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import ResumeUpload from '@/components/ResumeUpload';
import StudentSidebar from '@/components/StudentSidebar';
import ATSScoreCircle from '@/components/ATSScoreCircle';

interface ExtractedData {
  skills: string[];
  projects: string[];
  experience: string[];
  cgpa: string;
  tenthMark: string;
  twelfthMark: string;
}

const ResumeScanner = () => {
  const { signOut, user } = useAuth();
  const { data: studentData, isLoading: studentLoading } = useStudentData();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [extractedData, setExtractedData] = useState<ExtractedData>({
    skills: [],
    projects: [],
    experience: [],
    cgpa: '',
    tenthMark: '',
    twelfthMark: ''
  });

  const [hasResume, setHasResume] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [atsScore, setAtsScore] = useState(0);
  const [improvements, setImprovements] = useState<string[]>([]);

  // Convert complex objects to strings for display
  const convertToStringArray = (arr: any[]): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        if (item.title) return item.title;
        if (item.jobTitle) return `${item.jobTitle} at ${item.company || ''}`;
        return JSON.stringify(item);
      }
      return String(item);
    });
  };

  useEffect(() => {
    if (studentData) {
      setHasResume(!!studentData.resume_url);

      setExtractedData({
        skills: Array.isArray(studentData.skills) ? studentData.skills.map(String) : [],
        projects: convertToStringArray(studentData.projects as any[]),
        experience: convertToStringArray(studentData.experience as any[]),
        cgpa: studentData.gpa || '',
        tenthMark: (studentData as any).tenth_percentage?.toString() || '',
        twelfthMark: (studentData as any).twelfth_percentage?.toString() || ''
      });

      const score = studentData.ats_score || 0;
      setAtsScore(score);

      // Simple improvements generation (or use backend provided)
      const msgs = [];
      if (score < 60) msgs.push("Resume content is sparse. Add more details.");
      if ((studentData.skills?.length || 0) < 5) msgs.push("Add more technical skills.");
      if (!studentData.summary) msgs.push("Add a professional summary.");
      if (msgs.length === 0) msgs.push("Lorem ipsum dolor sit amet, consectetur.");
      setImprovements(msgs);
    }
  }, [studentData]);

  // Handle successful upload from the child component
  const handleResumeUpload = async (success: boolean) => {
    if (success) {
      setIsExtracting(true);

      try {
        // Wait for backend processing (simulated or real)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Refresh data
        await queryClient.invalidateQueries({ queryKey: ['student-data', user?.id] });

        const { data: updatedStudent, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (updatedStudent) {
          setHasResume(true);
          // Logic to update local state immediately if needed, 
          // but the query invalidation should trigger the useEffect above
        }

        toast({
          title: "Resume Analyzed!",
          description: "Your profile has been updated."
        });

      } catch (error) {
        console.error("Analysis error:", error);
      } finally {
        setIsExtracting(false);
        // The sub-component created nicely handles the 'Success' -> 'Idle' transition or shows 'Uploaded' state
      }
    }
  };

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
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <h1 className="text-4xl font-bold text-blue-500">Resume Scanner</h1>
          </div>

          {/* Top Section: Upload & ATS Score */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Upload Section (2/3) */}
            <div className="xl:col-span-2 h-full">
              {/* ResumeUpload now contains the dashed border UI internally */}
              <ResumeUpload onUploadSuccess={handleResumeUpload} hasExistingResume={hasResume} />
            </div>

            {/* ATS Score Section (1/3) */}
            <div className="xl:col-span-1 h-full">
              <Card className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm h-full max-h-[400px]">
                <ATSScoreCircle score={atsScore} improvements={improvements} />
              </Card>
            </div>
          </div>

          {/* Extracted Information Section */}
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-none shadow-sm p-8">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Extracted Information</h3>
            </div>
            <p className="text-sm text-slate-500 mb-8 pl-7">Information from your Resume</p>

            {hasResume ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h4 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">Skills</h4>
                  <div className="flex flex-wrap gap-3">
                    {extractedData.skills.length > 0 ? (
                      extractedData.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-full px-4 py-1 font-normal shadow-sm hover:bg-slate-50">
                          {skill}
                        </Badge>
                      ))
                    ) : <span className="text-slate-400 text-sm">No skills found</span>}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">Education & Projects</h4>
                  <div className="space-y-6">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">
                        CGPA: <span className="font-bold text-slate-900 dark:text-white text-lg">{extractedData.cgpa || 'N/A'}</span>
                      </p>
                    </div>
                    <div>
                      <h5 className="text-slate-600 dark:text-slate-400 mb-2">Projects:</h5>
                      {extractedData.projects.length > 0 ? (
                        <ul className="space-y-3">
                          {extractedData.projects.slice(0, 4).map((p, i) => (
                            <li key={i} className="flex items-start text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0"></span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 text-sm italic">No projects found</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400 italic">
                No resume uploaded yet.
              </div>
            )}
          </Card>

        </div>
      </main>
    </div>
  );
};

export default ResumeScanner;