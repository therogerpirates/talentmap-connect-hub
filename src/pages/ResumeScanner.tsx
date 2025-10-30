import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Upload, FileText, CheckCircle, LogOut, Sparkles, Lightbulb, Target, TrendingUp, Award, GraduationCap, BookMarked } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useHiringSessions, HiringSession } from '@/hooks/useHiringSessions';
import ResumeUpload from '@/components/ResumeUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentData, useUpdateStudentData } from '@/hooks/useStudentData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface ExtractedData {
  skills: string[];
  projects: string[];
  experience: string[];
  cgpa: string;
  tenthMark: string;
  twelfthMark: string;
}

interface AISuggestions {
  resumeImprovements: string[];
  skillRecommendations: string[];
  learningPath: string[];
}

// Helper functions to generate intelligent suggestions based on real data
const generateSkillRecommendations = (currentSkills: string[]): string[] => {
  const skillCategories = {
    frontend: ['React', 'Vue', 'Angular', 'TypeScript', 'Next.js'],
    backend: ['Node.js', 'Express', 'FastAPI', 'Django', 'Spring Boot'],
    database: ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL'],
    cloud: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes'],
    tools: ['Git', 'CI/CD', 'Testing', 'Monitoring']
  };

  const recommendations = [];
  const skillsLower = currentSkills.map(s => s.toLowerCase());
  
  // Suggest complementary skills
  if (skillsLower.includes('react') && !skillsLower.includes('typescript')) {
    recommendations.push('TypeScript for better type safety in React projects');
  }
  if (skillsLower.includes('python') && !skillsLower.includes('docker')) {
    recommendations.push('Docker for containerization and deployment');
  }
  if ((skillsLower.includes('react') || skillsLower.includes('node.js')) && !skillsLower.some(s => s.includes('aws') || s.includes('cloud'))) {
    recommendations.push('AWS or Azure cloud services');
  }
  
  // Add general recommendations
  recommendations.push('GraphQL for efficient API design');
  recommendations.push('Testing frameworks like Jest and Cypress');
  
  return recommendations.slice(0, 5);
};

const generateLearningPath = (currentSkills: string[]): string[] => {
  const paths = [
    'Master TypeScript fundamentals (2-3 weeks)',
    'Learn Docker basics and containerization (1-2 weeks)',
    'Explore cloud platforms - start with AWS free tier (3-4 weeks)',
    'Practice system design and architecture (ongoing)',
    'Contribute to open source projects (ongoing)'
  ];
  
  return paths;
};

const ResumeScanner = () => {
  const { signOut, profile, user } = useAuth();
  const { data: studentData, isLoading: studentLoading, error: studentError } = useStudentData();
  const updateStudentMutation = useUpdateStudentData();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Debug logging
  useEffect(() => {
    console.log('ResumeScanner mounted');
    console.log('User:', user);
    console.log('Profile:', profile);
    console.log('Student Data:', studentData);
    console.log('Student Loading:', studentLoading);
    console.log('Student Error:', studentError);
  }, [user, profile, studentData, studentLoading, studentError]);
  
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    skills: [],
    projects: [],
    experience: [],
    cgpa: '',
    tenthMark: '',
    twelfthMark: ''
  });
  
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions>({
    resumeImprovements: [],
    skillRecommendations: [],
    learningPath: []
  });
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const { data: sessions, isLoading: sessionsLoading } = useHiringSessions();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [sessionQuery, setSessionQuery] = useState('');
  const [onlyShowGaps, setOnlyShowGaps] = useState(false);

  // Helper function to convert project/experience objects to strings
  // This is needed because the backend returns structured objects for Resume Builder,
  // but Resume Scanner needs to display them as strings
  const convertToStringArray = (arr: any[]): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        // If it's a project object
        if (item.title) {
          return `${item.title}${item.technologies ? ` [${item.technologies}]` : ''}${item.description ? `: ${item.description}` : ''}${item.link ? ` (${item.link})` : ''}`;
        }
        // If it's an experience object
        if (item.jobTitle) {
          return `${item.jobTitle} at ${item.company || ''}${item.duration ? ` (${item.duration})` : ''}${item.description ? `: ${item.description}` : ''}`;
        }
        // Fallback: convert to JSON string
        return JSON.stringify(item);
      }
      return String(item);
    });
  };

  useEffect(() => {
    if (studentData) {
      setHasResume(!!studentData.resume_url);
      
      // Only load data if it actually exists in the database
      const extractedData = {
        skills: Array.isArray(studentData.skills) && studentData.skills.length > 0 ? studentData.skills as string[] : [],
        projects: convertToStringArray((studentData.projects || []) as any[]),
        experience: convertToStringArray((studentData.experience || []) as any[]),
        cgpa: studentData.gpa || '',
        tenthMark: (studentData as any).tenth_percentage?.toString() || '',
        twelfthMark: (studentData as any).twelfth_percentage?.toString() || ''
      };
      
      // Only set extracted data if there's actual data from the database
      setExtractedData(extractedData);
      
      // Generate AI suggestions only if we have real skills data
      if (extractedData.skills.length > 0) {
        setAiSuggestions({
          resumeImprovements: [
            'Add quantifiable achievements to your project descriptions',
            'Include specific technologies and frameworks used in each project',
            studentData.summary ? 'Great! Your resume has a good summary section' : 'Add a summary section highlighting your key strengths',
            studentData.ats_score && studentData.ats_score > 80 ? `Your ATS score is excellent: ${studentData.ats_score}/100!` : `Consider improving your ATS compatibility (current score: ${studentData.ats_score || 0}/100)`
          ],
          skillRecommendations: generateSkillRecommendations(extractedData.skills),
          learningPath: generateLearningPath(extractedData.skills)
        });
      } else {
        // Clear suggestions if no real data
        setAiSuggestions({
          resumeImprovements: [],
          skillRecommendations: [],
          learningPath: []
        });
      }
    }
  }, [studentData]);

  // New useEffect to listen for data changes and refresh
  useEffect(() => {
    if (user?.id && !isExtracting) {
      // Set up a listener for real-time changes
      const channel = supabase
        .channel('student-data-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'students',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            // The studentData query should automatically refetch due to React Query
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, isExtracting]);

  const handleResumeUpload = async (success: boolean) => {
    if (success) {
      setHasResume(true);
      setIsExtracting(true);
      
      try {
        // Clear previous extracted data when uploading new resume
        setExtractedData({
          skills: [],
          projects: [],
          experience: [],
          cgpa: '',
          tenthMark: '',
          twelfthMark: ''
        });
        
        setAiSuggestions({
          resumeImprovements: [],
          skillRecommendations: [],
          learningPath: []
        });
        
        // Wait longer for the backend processing to complete
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Invalidate the query cache to force a refetch
        await queryClient.invalidateQueries({ queryKey: ['student-data', user?.id] });
        
        // Wait a bit more for the invalidation to take effect
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force a fresh fetch from the database
        const { data: updatedStudentData, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (updatedStudentData) {
          // Use the real extracted data from the backend
          const realExtractedData: ExtractedData = {
            skills: Array.isArray(updatedStudentData.skills) ? updatedStudentData.skills as string[] : [],
            projects: convertToStringArray((updatedStudentData.projects || []) as any[]),
            experience: convertToStringArray((updatedStudentData.experience || []) as any[]),
            cgpa: updatedStudentData.gpa || '',
            tenthMark: (updatedStudentData as any).tenth_percentage || '',
            twelfthMark: (updatedStudentData as any).twelfth_percentage || ''
          };
          
          // Generate AI suggestions based on the real data
          const realSuggestions: AISuggestions = {
            resumeImprovements: [
              'Add quantifiable achievements to your project descriptions',
              'Include specific technologies and frameworks used in each project',
              updatedStudentData.summary ? 'Great! Your resume has a good summary section' : 'Add a summary section highlighting your key strengths',
              updatedStudentData.ats_score && updatedStudentData.ats_score > 80 ? `Your ATS score is excellent: ${updatedStudentData.ats_score}/100!` : `Consider improving your ATS compatibility (current score: ${updatedStudentData.ats_score || 0}/100)`,
              'Use action verbs to describe your accomplishments',
              'Include metrics and numbers to showcase impact'
            ].slice(0, 4),
            skillRecommendations: generateSkillRecommendations(Array.isArray(updatedStudentData.skills) ? updatedStudentData.skills as string[] : []),
            learningPath: generateLearningPath(Array.isArray(updatedStudentData.skills) ? updatedStudentData.skills as string[] : [])
          };
          
          setExtractedData(realExtractedData);
          setAiSuggestions(realSuggestions);
          
        } else {
          throw new Error('Failed to fetch updated student data');
        }
        
        toast({
          title: "Resume Re-Analyzed Successfully!",
          description: "Your profile has been updated with the latest information from your new resume."
        });
      } catch (error) {
        toast({
          title: "Analysis Failed",
          description: "There was an error analyzing your resume. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account."
    });
  };

  // Quick actions removed per request

  // Comment out the old saveExtractedData function since we auto-save now
  // const saveExtractedData = async () => {
  //   try {
  //     await updateStudentMutation.mutateAsync({
  //       skills: extractedData.skills,
  //       cgpa: extractedData.cgpa,
  //       // Add other fields as needed
  //     });
      
  //     toast({
  //       title: "Data Saved Successfully!",
  //       description: "Your extracted information has been saved to your profile."
  //     });
  //   } catch (error: any) {
  //     toast({
  //       title: "Save Failed",
  //       description: error.message || "Failed to save extracted data.",
  //       variant: "destructive"
  //     });
  //   }
  // };

  // New function to manually refresh analysis
  const refreshAnalysis = async () => {
    if (hasResume && user?.id) {
      setIsExtracting(true);
      
      try {
        // Force a fresh fetch from the database
        const { data: freshData, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single();

        if (freshData && !error) {
          const refreshedData: ExtractedData = {
            skills: Array.isArray(freshData.skills) ? freshData.skills as string[] : [],
            projects: convertToStringArray((freshData.projects || []) as any[]),
            experience: convertToStringArray((freshData.experience || []) as any[]),
            cgpa: freshData.gpa || '',
            tenthMark: (freshData as any).tenth_percentage || '',
            twelfthMark: (freshData as any).twelfth_percentage || ''
          };

          const refreshedSuggestions: AISuggestions = {
            resumeImprovements: [
              'Add quantifiable achievements to your project descriptions',  
              'Include specific technologies and frameworks used in each project',
              freshData.summary ? 'Great! Your resume has a good summary section' : 'Add a summary section highlighting your key strengths',
              freshData.ats_score && freshData.ats_score > 80 ? `Your ATS score is excellent: ${freshData.ats_score}/100!` : `Consider improving your ATS compatibility (current score: ${freshData.ats_score || 0}/100)`
            ],
            skillRecommendations: generateSkillRecommendations(Array.isArray(freshData.skills) ? freshData.skills as string[] : []),
            learningPath: generateLearningPath(Array.isArray(freshData.skills) ? freshData.skills as string[] : [])
          };

          setExtractedData(refreshedData);
          setAiSuggestions(refreshedSuggestions);
          
          toast({
            title: "Analysis Refreshed!",
            description: "Your resume analysis has been updated with the latest data."
          });
        }
      } catch (error) {
        toast({
          title: "Refresh Failed",
          description: "Could not refresh analysis. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsExtracting(false);
      }
    }
  };

  // Helper to compute missing skills for a given hiring session
  const computeMissingSkills = (required: any[] | undefined, studentSkills: string[]) => {
    try {
      if (!Array.isArray(required) || required.length === 0) return [] as string[];
      const studentLower = (studentSkills || []).map(s => String(s).toLowerCase().trim());
      // Normalize required skills to strings
      const reqSkills = required.map((r: any) => typeof r === 'string' ? r : String(r)).filter(Boolean) as string[];
      const missing = reqSkills.filter(rs => !studentLower.includes(rs.toLowerCase().trim()));
      return missing;
    } catch (e) {
      console.warn('Error computing missing skills', e);
      return [] as string[];
    }
  };

  // LLM suggestions state
  const [llmSuggestions, setLlmSuggestions] = useState<Record<string, string>>({});
  const [llmLoading, setLlmLoading] = useState<Record<string, boolean>>({});

  // Fetch concise LLM suggestion for a session using a local backend endpoint
  const fetchLLMSuggestion = async (session: HiringSession) => {
    if (!session || !user?.id) return;
    // Avoid duplicate requests
    if (llmLoading[session.id]) return;

    setLlmLoading(prev => ({ ...prev, [session.id]: true }));
    try {
      const payload = {
        session_id: session.id,
        required_skills: session?.requirements?.required_skills || [],
        student_skills: extractedData.skills || [],
        description: session.description || '',
        // Instructions: concise, 2-4 short bullets, no filler words like 'here' or 'absolutely'
        instructions: 'Provide 2 short bullets: 1) Improvements the student should make; 2) What to focus on now. Keep it very short, direct, and avoid filler words.'
      };

      const res = await fetch('http://localhost:8000/session-llm-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`LLM request failed: ${res.status}`);
      }

      const data = await res.json();
      // Expecting { suggestion: string }
      const suggestion = typeof data === 'string' ? data : data?.suggestion || data?.result || '';
      setLlmSuggestions(prev => ({ ...prev, [session.id]: suggestion }));
    } catch (err) {
      console.error('LLM suggestion error', err);
      setLlmSuggestions(prev => ({ ...prev, [session.id]: 'Unable to fetch suggestion' }));
    } finally {
      setLlmLoading(prev => ({ ...prev, [session.id]: false }));
    }
  };

  if (studentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (studentError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Profile</div>
          <p className="text-muted-foreground mb-4">{(studentError as Error)?.message || 'Unknown error'}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 gradient-primary opacity-10 rounded-full blur-3xl float-animation"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 gradient-accent opacity-10 rounded-full blur-3xl float-animation" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 gradient-glass opacity-20 rounded-full blur-2xl float-animation" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Modern Header */}
      <header className="glass-panel backdrop-blur-xl border-b border-white/15 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  TalentMap
                </span>
                <div className="text-xs text-muted-foreground">Student Portal</div>
              </div>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/student-dashboard">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/student-details">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                    Details
                  </Button>
                </Link>
                <Link to="/resume-builder">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                    Resume Builder
                  </Button>
                </Link>
              </div>
              <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'S'}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{profile?.full_name}</div>
                  <div className="text-xs text-muted-foreground">Student</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12 relative overflow-hidden fade-in-up">
            <div className="glass-panel p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 gradient-glass opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                  <h1 className="text-5xl md:text-6xl font-bold gradient-primary bg-clip-text text-transparent tracking-tight">
                    Resume Scanner
                  </h1>
                </div>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Upload your resume and let AI extract key information, then get personalized suggestions to improve your profile and skills.
                </p>
              </div>
            </div>
          </div>

          {/* Tabbed content for clarity */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="fade-in-up">
            <TabsList className="glass-panel p-1 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sessions" disabled={!extractedData.skills.length}>Sessions</TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Upload + Status */}
                <div className="space-y-6">
                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Upload className="w-5 h-5 text-primary" />
                        <span>Upload Resume</span>
                      </CardTitle>
                      <CardDescription>
                        Upload your resume (PDF) to extract information and get AI-powered insights.
                        {hasResume && (
                          <span className="block mt-2 text-orange-600 font-medium">
                            💡 Re-uploading will update: Skills, Projects, Experience, Academic scores, ATS score, and AI summary
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResumeUpload onUploadSuccess={handleResumeUpload} hasExistingResume={hasResume} />
                    </CardContent>
                  </Card>

                  {isExtracting && (
                    <Card className="glass-panel">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <Sparkles className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium">
                              {hasResume ? 'Re-analyzing Resume...' : 'Analyzing Resume...'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {hasResume
                                ? 'Processing your updated resume and refreshing all extracted information...'
                                : 'Our AI is extracting skills, projects, experience, and generating insights...'}
                            </p>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                {/* ATS + Extracted side by side */}
                {(studentData?.ats_score !== undefined || extractedData.skills.length > 0) && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* ATS Score (if available) */}
                    {studentData?.ats_score !== undefined && (
                      <Card className="glass-panel">
                        <CardHeader>
                          <CardTitle className="text-base">ATS Score</CardTitle>
                          <CardDescription>Automated tracking system compatibility</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            <div
                              className="relative w-20 h-20 rounded-full"
                              style={{
                                background: `conic-gradient(var(--primary) ${Math.min(Number(studentData?.ats_score || 0), 100)}%, hsl(var(--muted-foreground)) 0)`
                              }}
                              aria-label={`ATS score ${studentData?.ats_score}/100`}
                            >
                              <div className="absolute inset-1 bg-background rounded-full flex items-center justify-center text-sm font-semibold">
                                {studentData?.ats_score ?? 0}%
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">Aim for 80+ for excellent ATS performance. Use clear headings and standard section names.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Extracted Information */}
                    {extractedData.skills.length > 0 && (
                      <Card className="glass-panel">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <span>Extracted Information</span>
                          </CardTitle>
                          <CardDescription>Information from your resume</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Skills */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Skills</Label>
                            <div className="flex flex-wrap gap-2">
                              {extractedData.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">{skill}</Badge>
                              ))}
                            </div>
                          </div>

                          {/* Academics */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-1 block">CGPA</Label>
                              <p className="text-lg font-semibold">{extractedData.cgpa}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-1 block">10th Mark</Label>
                              <p className="text-lg font-semibold">{extractedData.tenthMark}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-1 block">12th Mark</Label>
                              <p className="text-lg font-semibold">{extractedData.twelfthMark}</p>
                            </div>
                          </div>

                          {/* Projects */}
                          {extractedData.projects.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Projects</Label>
                              <div className="space-y-2">
                                {extractedData.projects.map((project, index) => (
                                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm">{project}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Experience */}
                          {extractedData.experience.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Experience</Label>
                              <div className="space-y-2">
                                {extractedData.experience.map((exp, index) => (
                                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm">{exp}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* SESSIONS */}
            <TabsContent value="sessions">
              {sessionsLoading ? (
                <Card className="glass-panel">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      Loading sessions...
                    </div>
                  </CardContent>
                </Card>
              ) : (
                sessions && sessions.length > 0 && extractedData.skills.length > 0 ? (
                  <div className="space-y-4">
                    <Card className="glass-panel">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <Input
                            placeholder="Search sessions by title or role"
                            value={sessionQuery}
                            onChange={(e) => setSessionQuery(e.target.value)}
                            className="md:max-w-sm"
                          />
                          <div className="flex items-center gap-2">
                            <Checkbox id="only-gaps" checked={!!onlyShowGaps} onCheckedChange={(v:any)=> setOnlyShowGaps(!!v)} />
                            <Label htmlFor="only-gaps" className="text-sm text-muted-foreground">Only show sessions with gaps</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-4">
                      {sessions
                        .filter((s: HiringSession) => {
                          const q = sessionQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            s.title?.toLowerCase().includes(q) ||
                            s.role?.toLowerCase().includes(q) ||
                            s.description?.toLowerCase().includes(q)
                          );
                        })
                        .filter((s: HiringSession) => {
                          if (!onlyShowGaps) return true;
                          const req = s?.requirements?.required_skills || [];
                          const missing = computeMissingSkills(req, extractedData.skills || []);
                          return missing.length > 0;
                        })
                        .map((session: HiringSession) => {
                          const requiredSkills = session?.requirements?.required_skills || [];
                          const missing = computeMissingSkills(requiredSkills, extractedData.skills || []);
                          return (
                            <Card key={session.id} className="glass-panel">
                              <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                  <span className="font-medium">{session.title}</span>
                                  <span className="text-sm text-muted-foreground">{session.role}</span>
                                </CardTitle>
                                <div className="mt-1 text-xs text-muted-foreground">{session.status}</div>
                              </CardHeader>
                              <CardContent>
                                {Array.isArray(requiredSkills) && requiredSkills.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">Missing Skills</div>
                                    <div className="flex flex-wrap gap-2">
                                      {missing.length > 0 ? (
                                        missing.map((m, idx) => (
                                          <Badge key={idx} variant="outline" className="bg-destructive/5 text-destructive">{m}</Badge>
                                        ))
                                      ) : (
                                        <Badge variant="secondary" className="bg-green-50 text-green-700">All required skills matched</Badge>
                                      )}
                                    </div>
                                    <div className="mt-3">
                                      <Button
                                        variant="outline"
                                        className="text-sm"
                                        onClick={() => fetchLLMSuggestion(session)}
                                        disabled={!!llmLoading[session.id]}
                                      >
                                        {llmLoading[session.id] ? 'Thinking...' : 'LLM Suggestion'}
                                      </Button>

                                      {llmSuggestions[session.id] && (
                                        <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                                          {llmSuggestions[session.id]}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">No required skills listed for this session.</div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">No sessions to display.</div>
                )
              )}
            </TabsContent>

            {/* Suggestions tab removed per request */}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ResumeScanner; 