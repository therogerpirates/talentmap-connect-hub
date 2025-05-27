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
                <h3 key={lineIndex} className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                  {trimmedLine.replace(/\*\*(.*?)\*\*/g, '$1')}
                </h3>
              );
            }
            
            // Check if line starts with a bullet point or dash
            if (trimmedLine.match(/^[-•*]\s/)) {
              return (
                <div key={lineIndex} className="flex items-start mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700 leading-relaxed">
                    {trimmedLine.replace(/^[-•*]\s/, '')}
                  </p>
                </div>
              );
            }
            
            // Regular paragraph
            return (
              <p key={lineIndex} className="text-gray-700 leading-relaxed mb-2">
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
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TalentMap</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {profileData.fullName}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
            <p className="text-gray-600">Manage your profile and showcase your talents to recruiters</p>
          </div>

          {/* Dashboard Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Profile Status</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {profileData.fullName && profileData.year && profileData.department ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Resume Status</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {hasResume ? 'Uploaded' : 'Not Uploaded'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Visibility</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {hasResume && profileData.fullName && profileData.year && profileData.department ? 'Active' : 'Hidden'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <p className="text-sm text-black-250">*Complete your profile to be visible to recruiters</p>
          
          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Keep your profile updated to attract the right opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Static profile data display with improved design */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600 text-sm">Full Name:</Label>
                      <p className="font-medium text-gray-900 text-lg leading-snug">{profileData.fullName || 'N/A'}</p>
                    </div>

                    <div>
                      <Label className="text-gray-600 text-sm">Academic Year:</Label>
                      <p className="font-medium text-gray-900 text-lg leading-snug">{profileData.year || 'N/A'}</p>
                    </div>

                    <div className="col-span-2">
                      <Label className="text-gray-600 text-sm">Department:</Label>
                      <p className="font-medium text-gray-900 text-lg leading-snug">{profileData.department || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Add a link to the separate profile edit page */}
                  <div className="pt-4 border-t mt-4">
                    <Link to="/profile">
                      <Button className="w-full">Edit Profile Information</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resume Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Resume Upload</span>
                </CardTitle>
                <CardDescription>
                  Upload your resume to get discovered by recruiters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResumeUpload onUploadSuccess={handleResumeUpload} hasExistingResume={hasResume} />
              </CardContent>
            </Card>

            {/* Skills - Full Width */}
            {studentData?.skills && studentData.skills.length > 0 && hasResume && (
              <Card className="mt-8 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Skills</span>
                  </CardTitle>
                  <CardDescription>
                    Key skills extracted from your resume.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {studentData.skills.map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ATS Score - Add a Card for ATS Score */}
            {studentData?.ats_score !== undefined && hasResume && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>ATS Score</span>
                  </CardTitle>
                  <CardDescription>
                    An estimate of how well your resume might be parsed by Applicant Tracking Systems.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center w-48 mx-auto">
                    {studentData.ats_score !== undefined && (
                      <GaugeChart
                        id="ats-score-gauge"
                        nrOfLevels={20}
                        percent={studentData.ats_score / 100}
                        arcWidth={0.3}
                        colors={['#FF5F6D', '#FFC371', '#4CAF50']}
                        textColor="#000000"
                      />
                    )}
                    <p className="text-sm text-gray-600 mt-2">ATS Score: {studentData.ats_score}/100</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Experience - Add a Card for Experience/Internship */}
            {studentData?.has_internship !== undefined && hasResume && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Experience</span>
                  </CardTitle>
                  <CardDescription>
                    Information about your work and internship experience.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="flex items-center">
                    Has Internship: 
                    {studentData.has_internship ? 
                      <CheckCircle className="w-5 h-5 text-green-500 ml-2" /> 
                      : 
                      <X className="w-5 h-5 text-red-500 ml-2" />
                    }
                  </p>
                </CardContent>
              </Card>
            )}

          {/* Resume Summary - Full Width - Move this section down */}
          {studentData?.summary && hasResume && (
            <Card className="mt-8 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Resume Summary</span>
                </CardTitle>
                <CardDescription>
                  An AI-generated summary of your resume highlighting your key qualifications and experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  {formatResumeSummary(studentData.summary)}
                </div>
              </CardContent>
            </Card>
          )}

          </div> {/* Closing div for Main Content Grid */}

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
