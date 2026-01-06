import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useStudentData, useUpdateStudentData } from '@/hooks/useStudentData';
import { ThemeToggle } from '@/components/ThemeToggle';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { data: studentData, isLoading: studentLoading } = useStudentData();
  const updateStudentMutation = useUpdateStudentData();

  const [profileData, setProfileData] = useState({
    year: '',
    department: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (studentData) {
      setProfileData({
        year: studentData.year || '',
        department: studentData.department || ''
      });
    }
  }, [studentData]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateStudentMutation.mutateAsync({
        year: profileData.year,
        department: profileData.department
      });

      toast({
        title: "Profile Updated!",
        description: "Your profile information has been saved successfully."
      });
      navigate('/student-details'); // Navigate back to student details after saving
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

  if (studentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300 relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md bg-white dark:bg-gray-800 transition-colors duration-300">
        <CardHeader>
          <CardTitle>Edit Profile Information</CardTitle>
          <CardDescription>Update your academic year and department.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
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
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer science and Engineering">Computer Science and Engineering</SelectItem>
                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                  <SelectItem value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning</SelectItem>
                  <SelectItem value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science</SelectItem>
                  <SelectItem value="Computer Science and Engineering in Cybersecurity">Computer science and engineering in cybersecurity</SelectItem>
                  <SelectItem value="Agriculuture Engineering">Agriculuture Engineering</SelectItem>
                  <SelectItem value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</SelectItem>
                  <SelectItem value="Electrical and communication Enginnerng">Electrical and communication Enginnerng</SelectItem>
                  <SelectItem value="civil Engineering">civil Engineering</SelectItem>
                  <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || updateStudentMutation.isPending}>
              {isLoading || updateStudentMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage; 