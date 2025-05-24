
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Upload, User, FileText, CheckCircle, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ResumeUpload from '@/components/ResumeUpload';

const StudentDashboard = () => {
  const [profileData, setProfileData] = useState({
    fullName: 'John Smith',
    year: '3',
    department: 'Computer Science'
  });
  const [hasResume, setHasResume] = useState(false);
  const { toast } = useToast();

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would integrate with Supabase to update profile
    toast({
      title: "Profile Updated!",
      description: "Your profile information has been saved successfully."
    });
    console.log('Profile data:', profileData);
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
            <Link to="/login">
              <Button variant="ghost" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
            <p className="text-gray-600">Manage your profile and showcase your talents to potential recruiters</p>
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
                      {hasResume && profileData.fullName ? 'Active' : 'Hidden'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
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
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="year">Academic Year</Label>
                    <Select value={profileData.year} onValueChange={(value) => handleInputChange('year', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                        <SelectItem value="graduate">Graduate</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select value={profileData.department} onValueChange={(value) => handleInputChange('department', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Business">Business Administration</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                        <SelectItem value="Psychology">Psychology</SelectItem>
                        <SelectItem value="Economics">Economics</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full">
                    Update Profile
                  </Button>
                </form>
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
          </div>

          {/* Tips Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Tips for Success</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Keep Your Profile Current</h4>
                    <p className="text-sm text-gray-600">Regular updates help recruiters find the most relevant information.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Upload a Quality Resume</h4>
                    <p className="text-sm text-gray-600">A well-formatted PDF resume increases your visibility.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Highlight Your Skills</h4>
                    <p className="text-sm text-gray-600">Make sure your resume clearly showcases your technical and soft skills.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Professional Email</h4>
                    <p className="text-sm text-gray-600">Use a professional email address for the best first impression.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
