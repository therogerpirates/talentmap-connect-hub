import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Upload, User, FileText, CheckCircle, LogOut, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ResumeUpload from '@/components/ResumeUpload';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentData, useUpdateStudentData } from '@/hooks/useStudentData';
import GaugeChart from 'react-gauge-chart';

const StudentDashboard = () => {
  const { signOut, profile } = useAuth();
  const { data: studentData, isLoading: studentLoading } = useStudentData();
  const updateStudentMutation = useUpdateStudentData();
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    year: '',
    department: ''
  });
  const [hasResume, setHasResume] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setProfileData(prev => ({
        ...prev,
        fullName: profile.full_name || ''
      }));
    }
    
    if (studentData) {
      setProfileData(prev => ({
        ...prev,
        year: studentData.year || '',
        department: studentData.department || ''
      }));
      setHasResume(!!studentData.resume_url);
    }
  }, [profile, studentData]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update student-specific data in students table
      await updateStudentMutation.mutateAsync({
        year: profileData.year,
        department: profileData.department
      });

      toast({
        title: "Profile Updated!",
        description: "Your profile information has been saved successfully."
      });
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResumeUpload = (success: boolean) => {
    if (success) {
      setHasResume(true);
      toast({
        title: "Resume Uploaded!",
        description: "Your resume has been uploaded successfully and is now available to recruiters."
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account."
    });
  };

  const formatResumeSummary = (summary: string) => {
    // Split the summary into sections based on common patterns
    const sections = summary.split(/\n\s*\n/);
    
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      
      return (
        <div key={index} className="mb-6 last:mb-0">
          {lines.map((line, lineIndex) => {
            const trimmedLine = line.trim();
            
            // Check if line is a header (contains **text** or is all caps)
            if (trimmedLine.match(/^\*\*(.*?)\*\*/) || trimmedLine === trimmedLine.toUpperCase()) {
              return (
                <h3 key={lineIndex} className="text-lg font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-1 transition-colors duration-300">
                  {trimmedLine.replace(/\*\*(.*?)\*\*/g, '$1')}
                </h3>
              );
            }
            
            // Check if line starts with a bullet point or dash
            if (trimmedLine.match(/^[-•*]\s/)) {
              return (
                <div key={lineIndex} className="flex items-start mb-2">
                  <div className="w-2 h-2 bg-black dark:bg-white rounded-full mt-2 mr-3 flex-shrink-0 transition-colors duration-300"></div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                    {trimmedLine.replace(/^[-•*]\s/, '')}
                  </p>
                </div>
              );
            }
            
            // Regular paragraph
            return (
              <p key={lineIndex} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2 transition-colors duration-300">
                {trimmedLine}
              </p>
            );
          })}
        </div>
      );
    });
  };

  if (studentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-900 border-b transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
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
            <ThemeToggle />
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/resume-scanner">
                <Button variant="ghost" size="sm" className="text-gray-900 dark:text-white hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-300">
                  Resume Scanner
                </Button>
              </Link>
              <Link to="/student-details">
                <Button variant="ghost" size="sm" className="text-gray-900 dark:text-white hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-300">
                  Student Details
                </Button>
              </Link>
              <Link to="/resume-builder">
                <Button variant="ghost" size="sm" className="text-gray-900 dark:text-white hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-300">
                  Resume Builder
                </Button>
              </Link>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">Welcome, {profileData.fullName}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-900 dark:text-white hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-300">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
          <div className="mb-12 relative overflow-hidden fade-in-up">
            <div className="glass-panel p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 gradient-glass opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <h1 className="text-5xl md:text-6xl font-bold gradient-primary bg-clip-text text-transparent tracking-tight">
                    Student DashBoard
                  </h1>
                </div>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Manage Your profile and showcase your talent to the Recruiters 
                </p>
              </div>
            </div>
          </div>
            
            {/* Navigation Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <Link to="/resume-scanner">
                <Card className="bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center transition-colors duration-300">
                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-300 transition-colors duration-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Resume Scanner</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">Upload and analyze your resume with AI</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/student-details">
                <Card className="bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center transition-colors duration-300">
                        <User className="w-6 h-6 text-green-600 dark:text-green-300 transition-colors duration-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Student Details</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">Manage your profile and information</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/resume-builder">
                <Card className="bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center transition-colors duration-300">
                        <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-300 transition-colors duration-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Resume Builder</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">Create and download your resume</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300">
                    <User className="w-6 h-6 text-gray-900 dark:text-white transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">Profile Status</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                      {profileData.fullName && profileData.year && profileData.department ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center transition-colors duration-300">
                    <FileText className="w-6 h-6 text-green-600 dark:text-green-300 transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">Resume Status</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                      {hasResume ? 'Uploaded' : 'Not Uploaded'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center transition-colors duration-300">
                    <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-300 transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">Visibility</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                      {hasResume && profileData.fullName && profileData.year && profileData.department ? 'Active' : 'Hidden'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
