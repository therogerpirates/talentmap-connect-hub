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

const ResumeScanner = () => {
  const { signOut, profile } = useAuth();
  const { data: studentData, isLoading: studentLoading } = useStudentData();
  const updateStudentMutation = useUpdateStudentData();
  const { toast } = useToast();
  
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
      // Initialize with existing data if available
      if (studentData.skills) {
        setExtractedData(prev => ({
          ...prev,
          skills: studentData.skills || []
        }));
      }
    }
  }, [studentData]);

  const handleResumeUpload = async (success: boolean) => {
    if (success) {
      setHasResume(true);
      setIsExtracting(true);
      
      try {
        // Simulate AI extraction process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock extracted data - in real implementation, this would come from AI
        const mockExtractedData: ExtractedData = {
          skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git'],
          projects: [
            'E-commerce Platform - Built a full-stack e-commerce application using React and Node.js',
            'Task Management App - Developed a collaborative task management tool with real-time updates',
            'Data Analysis Dashboard - Created interactive dashboards using Python and D3.js'
          ],
          experience: [
            'Software Developer Intern at TechCorp (Summer 2023)',
            'Frontend Developer at StartupXYZ (Part-time, 2022-2023)',
            'Open Source Contributor to React ecosystem projects'
          ],
          cgpa: '3.8',
          tenthMark: '92%',
          twelfthMark: '88%'
        };
        
        const mockSuggestions: AISuggestions = {
          resumeImprovements: [
            'Add quantifiable achievements to your project descriptions',
            'Include specific technologies and frameworks used in each project',
            'Add a summary section highlighting your key strengths',
            'Consider adding certifications or online courses'
          ],
          skillRecommendations: [
            'TypeScript for better type safety in React projects',
            'Docker for containerization and deployment',
            'AWS or Azure cloud services',
            'GraphQL for efficient API design',
            'Testing frameworks like Jest and Cypress'
          ],
          learningPath: [
            'Master TypeScript fundamentals (2-3 weeks)',
            'Learn Docker basics and containerization (1-2 weeks)',
            'Explore cloud platforms - start with AWS free tier (3-4 weeks)',
            'Practice system design and architecture (ongoing)',
            'Contribute to open source projects (ongoing)'
          ]
        };
        
        setExtractedData(mockExtractedData);
        setAiSuggestions(mockSuggestions);
        
        toast({
          title: "Resume Analyzed Successfully!",
          description: "AI has extracted your information and provided personalized suggestions."
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

  const saveExtractedData = async () => {
    try {
      await updateStudentMutation.mutateAsync({
        skills: extractedData.skills,
        cgpa: extractedData.cgpa,
        // Add other fields as needed
      });
      
      toast({
        title: "Data Saved Successfully!",
        description: "Your extracted information has been saved to your profile."
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save extracted data.",
        variant: "destructive"
      });
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
                    Upload your resume (PDF) to extract information and get AI-powered insights
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
                        <h3 className="text-lg font-medium">Analyzing Resume...</h3>
                        <p className="text-sm text-muted-foreground">AI is extracting information and generating insights</p>
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

                    <Button onClick={saveExtractedData} className="w-full gradient-primary text-white">
                      Save to Profile
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