import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Upload, FileText, CheckCircle, LogOut, Sparkles, Lightbulb, Target, TrendingUp, Award, GraduationCap, BookMarked } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const { data: studentData, isLoading: studentLoading } = useStudentData();
  const updateStudentMutation = useUpdateStudentData();
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
  
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions>({
    resumeImprovements: [],
    skillRecommendations: [],
    learningPath: []
  });
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  useEffect(() => {
    if (studentData) {
      setHasResume(!!studentData.resume_url);
      
      // Only load data if it actually exists in the database
      const extractedData = {
        skills: Array.isArray(studentData.skills) && studentData.skills.length > 0 ? studentData.skills as string[] : [],
        projects: Array.isArray(studentData.projects) && studentData.projects.length > 0 ? studentData.projects as string[] : [],
        experience: Array.isArray(studentData.experience) && studentData.experience.length > 0 ? studentData.experience as string[] : [],
        cgpa: studentData.gpa || '',
        tenthMark: studentData.tenth_percentage?.toString() || '',
        twelfthMark: studentData.twelfth_percentage?.toString() || ''
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
            projects: Array.isArray(updatedStudentData.projects) ? updatedStudentData.projects as string[] : [],
            experience: Array.isArray(updatedStudentData.experience) ? updatedStudentData.experience as string[] : [],
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
            projects: Array.isArray(freshData.projects) ? freshData.projects as string[] : [],
            experience: Array.isArray(freshData.experience) ? freshData.experience as string[] : [],
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

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Resume Upload Section */}
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

              {/* Extraction Status */}
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
                            : 'Our AI is extracting skills, projects, experience, and generating insights...'
                          }
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

            {/* Extracted Information */}
            {extractedData.skills.length > 0 && (
              <div className="space-y-6">
                <Card className="glass-panel">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <span>Extracted Information</span>
                    </CardTitle>
                    <CardDescription>
                      Information extracted from your resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Skills */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Skills</Label>
                      <div className="flex flex-wrap gap-2">
                        {extractedData.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Academic Information */}
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

                    {/* Experience */}
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

                    {/* Comment out the old save button since we auto-save now */}
                    {/* <Button onClick={saveExtractedData} className="w-full gradient-primary text-white">
                      Save to Profile
                    </Button> */}
                    
                    {/* New refresh analysis button */}
                    <Button onClick={refreshAnalysis} variant="outline" className="w-full" disabled={isExtracting}>
                      {isExtracting ? 'Re-analyzing...' : 'Refresh Analysis'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* AI Suggestions Section */}
          {aiSuggestions.resumeImprovements.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
                  AI-Powered Suggestions
                </h2>
                <p className="text-muted-foreground">
                  Personalized recommendations to improve your resume and career growth
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Resume Improvements */}
                <Card className="glass-panel">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <span>Resume Improvements</span>
                    </CardTitle>
                    <CardDescription>
                      Suggestions to enhance your resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiSuggestions.resumeImprovements.map((improvement, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-muted-foreground">{improvement}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Skill Recommendations */}
                <Card className="glass-panel">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      <span>Skill Recommendations</span>
                    </CardTitle>
                    <CardDescription>
                      Skills to learn next for career growth
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiSuggestions.skillRecommendations.map((skill, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-muted-foreground">{skill}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Path */}
                <Card className="glass-panel">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span>Learning Path</span>
                    </CardTitle>
                    <CardDescription>
                      Structured learning recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiSuggestions.learningPath.map((path, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-muted-foreground">{path}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeScanner; 