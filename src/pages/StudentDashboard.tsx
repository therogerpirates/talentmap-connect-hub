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
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center transition-colors duration-300">
              <BookOpen className="w-5 h-5 text-white dark:text-black transition-colors duration-300" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">TalentMap</span>
          </Link>
          
          <div className="flex items-center space-x-4">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Student Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Manage your profile and showcase your talents to recruiters</p>
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
          <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">*Complete your profile to be visible to recruiters</p>
          
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            <Card className="bg-white dark:bg-gray-800 transition-colors duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white transition-colors duration-300">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                  Keep your profile updated to attract the right opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600 dark:text-gray-300 text-sm transition-colors duration-300">Full Name:</Label>
                      <p className="font-medium text-gray-900 dark:text-white text-lg leading-snug transition-colors duration-300">{profileData.fullName || 'N/A'}</p>
                    </div>

                    <div>
                      <Label className="text-gray-600 dark:text-gray-300 text-sm transition-colors duration-300">Academic Year:</Label>
                      <p className="font-medium text-gray-900 dark:text-white text-lg leading-snug transition-colors duration-300">{profileData.year || 'N/A'}</p>
                    </div>

                    <div className="col-span-2">
                      <Label className="text-gray-600 dark:text-gray-300 text-sm transition-colors duration-300">Department:</Label>
                      <p className="font-medium text-gray-900 dark:text-white text-lg leading-snug transition-colors duration-300">{profileData.department || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 transition-colors duration-300">
                    <Link to="/profile">
                      <Button className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300">
                        Edit Profile Information
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 transition-colors duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white transition-colors duration-300">
                  <Upload className="w-5 h-5" />
                  <span>Resume Upload</span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                  Upload your resume to get discovered by recruiters
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-900 dark:text-white transition-colors duration-300">
                <ResumeUpload onUploadSuccess={handleResumeUpload} hasExistingResume={hasResume} />
              </CardContent>
            </Card>

            {studentData?.skills && studentData.skills.length > 0 && hasResume && (
              <Card className="mt-8 lg:col-span-2 bg-white dark:bg-gray-800 transition-colors duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white transition-colors duration-300">
                    <FileText className="w-5 h-5" />
                    <span>Skills</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                    Key skills extracted from your resume.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {studentData.skills.map((skill, index) => (
                      <span key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium px-2.5 py-0.5 rounded transition-colors duration-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {studentData?.summary && hasResume && (
              <Card className="mt-8 lg:col-span-2 bg-white dark:bg-gray-800 transition-colors duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white transition-colors duration-300">
                    <FileText className="w-5 h-5" />
                    <span>Resume Summary</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                    An AI-generated summary of your resume highlighting your key qualifications and experience.
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose max-w-none dark:prose-invert">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                    {formatResumeSummary(studentData.summary)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
