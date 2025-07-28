import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, User, LogOut, Sparkles, Edit3, Save, X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentData, useUpdateStudentData } from '@/hooks/useStudentData';

interface StudentDetailsData {
  skills: string[];
  projects: string[];
  experience: string[];
  cgpa: number;
  tenth_percentage: number;
  twelfth_percentage: number;
}

const StudentDetails = () => {
  const { signOut, profile } = useAuth();
  const { data: studentData, isLoading: studentLoading } = useStudentData();
  const updateStudentMutation = useUpdateStudentData();
  const { toast } = useToast();
  
  const [detailsData, setDetailsData] = useState<StudentDetailsData>({
    skills: [],
    projects: [],
    experience: [],
    cgpa: 0,
    tenth_percentage: 0,
    twelfth_percentage: 0
  });
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (studentData) {
      setDetailsData({
        skills: Array.isArray(studentData.skills) ? studentData.skills.map(String) : [],
        projects: Array.isArray(studentData.projects) ? studentData.projects.map(String) : [],
        experience: Array.isArray(studentData.experience) ? studentData.experience.map(String) : [],
        cgpa: parseFloat(studentData.gpa) || 0,
        tenth_percentage: parseFloat(studentData.tenth_percentage) || 0,
        twelfth_percentage: parseFloat(studentData.twelfth_percentage) || 0
      });
    }
  }, [studentData]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account."
    });
  };

  const startEditing = (field: string, value: string | string[]) => {
    setEditingField(field);
    setEditValue(Array.isArray(value) ? value.join('\n') : value);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveField = async () => {
    if (!editingField) return;

    setIsLoading(true);
    try {
      let valueToSave: any = editValue;
      
      // Handle array fields
      if (editingField === 'skills' || editingField === 'projects' || editingField === 'experience') {
        valueToSave = editValue.split('\n').filter(item => item.trim());
      }

      await updateStudentMutation.mutateAsync({
        [editingField]: valueToSave
      });

      setDetailsData(prev => ({
        ...prev,
        [editingField]: valueToSave
      }));

      setEditingField(null);
      setEditValue('');

      toast({
        title: "Updated Successfully!",
        description: "Your information has been saved."
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addArrayItem = (field: 'skills' | 'projects' | 'experience') => {
    const newItem = prompt(`Add new ${field.slice(0, -1)}:`);
    if (newItem && newItem.trim()) {
      setDetailsData(prev => ({
        ...prev,
        [field]: [...prev[field], newItem.trim()]
      }));
    }
  };

  const removeArrayItem = (field: 'skills' | 'projects' | 'experience', index: number) => {
    setDetailsData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const renderEditableField = (label: string, field: string, value: string | string[]) => {
    const isEditing = editingField === field;
    const isArray = Array.isArray(value);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEditing(field, value)}
              className="h-6 w-6 p-0"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          ) : (
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={saveField}
                disabled={isLoading}
                className="h-6 w-6 p-0 text-green-600"
              >
                <Save className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                className="h-6 w-6 p-0 text-red-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}...`}
              className="min-h-[100px]"
            />
          </div>
        ) : (
          <div className="p-3 bg-muted/50 rounded-lg">
            {isArray ? (
              <div className="space-y-2">
                {value.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">{item}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(field as any, index)}
                      className="h-6 w-6 p-0 text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem(field as any)}
                  className="w-full"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add {label.slice(0, -1)}
                </Button>
              </div>
            ) : (
              <p className="text-sm">{value || 'Not specified'}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSkillsField = () => {
    const isEditing = editingField === 'skills';
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Skills</Label>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEditing('skills', detailsData.skills)}
              className="h-6 w-6 p-0"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          ) : (
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={saveField}
                disabled={isLoading}
                className="h-6 w-6 p-0 text-green-600"
              >
                <Save className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                className="h-6 w-6 p-0 text-red-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter skills (one per line)..."
              className="min-h-[100px]"
            />
          </div>
        ) : (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {detailsData.skills.length > 0 ? (
                detailsData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No skills added</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('skills')}
              className="mt-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Skill
            </Button>
          </div>
        )}
      </div>
    );
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
                <Link to="/resume-scanner">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                    Scanner
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
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12 relative overflow-hidden fade-in-up">
            <div className="glass-panel p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 gradient-glass opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <User className="h-8 w-8 text-primary" />
                  <h1 className="text-5xl md:text-6xl font-bold gradient-primary bg-clip-text text-transparent tracking-tight">
                    Student Details
                  </h1>
                </div>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Manage and update your profile information, skills, projects, and experience details.
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Profile Information */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Your basic profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                      {profile?.full_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Academic Year</Label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                      {studentData?.year || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Department</Label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                      {studentData?.department || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
                  <Link to="/profile">
                    <Button className="w-full gradient-primary text-white">
                      Edit Profile Information
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>Academic Information</span>
                </CardTitle>
                <CardDescription>
                  Your academic performance details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderEditableField('CGPA', 'cgpa', detailsData.cgpa.toString())}
                {renderEditableField('10th Percentage', 'tenth_percentage', detailsData.tenth_percentage.toString())}
                {renderEditableField('12th Percentage', 'twelfth_percentage', detailsData.twelfth_percentage.toString())}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="glass-panel lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>Skills</span>
                </CardTitle>
                <CardDescription>
                  Your technical and soft skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderSkillsField()}
              </CardContent>
            </Card>

            {/* Projects */}
            <Card className="glass-panel lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>Projects</span>
                </CardTitle>
                <CardDescription>
                  Your academic and personal projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderEditableField('Projects', 'projects', detailsData.projects)}
              </CardContent>
            </Card>

            {/* Experience */}
            <Card className="glass-panel lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>Experience</span>
                </CardTitle>
                <CardDescription>
                  Your work experience and internships
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderEditableField('Experience', 'experience', detailsData.experience)}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails; 