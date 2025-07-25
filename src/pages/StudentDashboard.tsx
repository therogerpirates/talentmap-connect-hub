import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, User, FileText, CheckCircle, LogOut, Sparkles, Award, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ResumeScanner from '@/components/ResumeScanner';
import StudentDetailsForm from '@/components/StudentDetailsForm';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentData } from '@/hooks/useStudentData';

const StudentDashboard = () => {
  const { signOut, profile } = useAuth();
  const { data: studentData, isLoading: studentLoading } = useStudentData();
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    year: '',
    department: ''
  });
  const [hasResume, setHasResume] = useState(false);
  const [parsedResumeData, setParsedResumeData] = useState<any>(null);
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

  const handleScanComplete = (parsedData: any) => {
    setParsedResumeData(parsedData);
    setHasResume(true);
    toast({
      title: "Resume Scanned!",
      description: "Your resume has been analyzed and information has been extracted automatically."
    });
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-accent/5 to-secondary/10" />
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-floating" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-floating-delayed" />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-secondary/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <header className="glass-card border-b border-glass sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">TalentMap</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome, {profileData.fullName}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="glass-button">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent mb-4 animate-fade-in">
              Student Dashboard
            </h1>
            <p className="text-muted-foreground text-lg animate-fade-in animation-delay-200">
              Manage your profile and showcase your talents to recruiters
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card border-glass hover:scale-105 transition-all duration-300 animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/30 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Profile Status</p>
                    <p className="text-xl font-bold text-foreground">
                      {profileData.fullName && profileData.year && profileData.department ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Complete
                        </span>
                      ) : (
                        <span className="text-amber-500">Incomplete</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-glass hover:scale-105 transition-all duration-300 animate-fade-in animation-delay-100">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-emerald-600/30 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resume Status</p>
                    <p className="text-xl font-bold text-foreground">
                      {hasResume ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Scanned
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not Uploaded</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-glass hover:scale-105 transition-all duration-300 animate-fade-in animation-delay-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-400/20 to-violet-600/30 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Visibility</p>
                    <p className="text-xl font-bold text-foreground">
                      {hasResume && profileData.fullName && profileData.year && profileData.department ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <Sparkles className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Hidden</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-8 text-center">
            <p className="text-sm text-muted-foreground bg-glass-fill/50 rounded-lg px-4 py-2 inline-block">
              <Award className="w-4 h-4 inline mr-2" />
              Complete your profile to be visible to recruiters
            </p>
          </div>
          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Profile Quick View */}
            <Card className="glass-card border-glass animate-fade-in animation-delay-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground/90">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Keep your profile updated to attract the right opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs font-medium">Full Name</p>
                      <p className="font-medium text-foreground text-sm leading-snug">{profileData.fullName || 'N/A'}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs font-medium">Academic Year</p>
                      <p className="font-medium text-foreground text-sm leading-snug">{profileData.year || 'N/A'}</p>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <p className="text-muted-foreground text-xs font-medium">Department</p>
                      <p className="font-medium text-foreground text-sm leading-snug">{profileData.department || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-glass">
                    <Link to="/profile">
                      <Button className="w-full glass-button">
                        Edit Profile Information
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resume Scanner */}
            <div className="animate-fade-in animation-delay-400">
              <ResumeScanner onScanComplete={handleScanComplete} hasExistingResume={hasResume} />
            </div>
          </div>

          {/* Student Details Form */}
          <div className="mt-8 animate-fade-in animation-delay-500">
            <StudentDetailsForm parsedData={parsedResumeData} />
          </div>

          {/* Resume Summary */}
          {studentData?.summary && hasResume && (
            <Card className="mt-8 glass-card border-glass animate-fade-in animation-delay-600">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground/90">
                  <Sparkles className="w-5 h-5" />
                  <span>Resume Summary</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  An AI-generated summary of your resume highlighting your key qualifications and experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="prose max-w-none dark:prose-invert">
                <div className="glass-card border-glass p-6 bg-glass-fill/30">
                  {formatResumeSummary(studentData.summary)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
