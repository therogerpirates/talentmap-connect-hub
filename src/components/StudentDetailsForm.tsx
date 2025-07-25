import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Edit3, Save, User, Award, Briefcase, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStudentData, useUpdateStudentData } from '@/hooks/useStudentData';

interface Project {
  title: string;
  description: string;
}

interface StudentDetailsFormProps {
  parsedData?: {
    skills?: string[];
    experience?: string;
    cgpa?: string;
    tenth_percentage?: string;
    twelfth_percentage?: string;
    projects?: Project[];
  };
}

const StudentDetailsForm = ({ parsedData }: StudentDetailsFormProps) => {
  const { data: studentData } = useStudentData();
  const updateStudentData = useUpdateStudentData();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    skills: [] as string[],
    experience: '',
    cgpa: '',
    tenth_percentage: '',
    twelfth_percentage: '',
    projects: [] as Project[]
  });
  const [newSkill, setNewSkill] = useState('');
  const [newProject, setNewProject] = useState<Project>({ title: '', description: '' });

  useEffect(() => {
    if (parsedData) {
      setFormData({
        skills: parsedData.skills || [],
        experience: parsedData.experience || '',
        cgpa: parsedData.cgpa || '',
        tenth_percentage: parsedData.tenth_percentage || '',
        twelfth_percentage: parsedData.twelfth_percentage || '',
        projects: parsedData.projects || []
      });
      setIsEditing(true);
    } else if (studentData) {
      setFormData({
        skills: studentData.skills || [],
        experience: (studentData.experience as any)?.description || '',
        cgpa: studentData.gpa || '',
        tenth_percentage: '',
        twelfth_percentage: '',
        projects: Array.isArray(studentData.projects) ? (studentData.projects as unknown as Project[]) : []
      });
    }
  }, [parsedData, studentData]);

  const handleSave = async () => {
    try {
      await updateStudentData.mutateAsync({
        skills: formData.skills,
        gpa: formData.cgpa
      });

      toast({
        title: "Details Updated!",
        description: "Your profile details have been saved successfully."
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update details",
        variant: "destructive"
      });
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addProject = () => {
    if (newProject.title.trim() && newProject.description.trim()) {
      setFormData(prev => ({
        ...prev,
        projects: [...prev.projects, newProject]
      }));
      setNewProject({ title: '', description: '' });
    }
  };

  const removeProject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card className="glass-card border-glass">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2 text-foreground/90">
          <User className="w-5 h-5" />
          <span>Student Details</span>
        </CardTitle>
        <Button
          variant={isEditing ? "default" : "ghost"}
          size="sm"
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className="glass-button"
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Academic Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <GraduationCap className="w-4 h-4 text-accent-foreground" />
            <h3 className="text-sm font-medium text-foreground/80">Academic Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cgpa" className="text-xs font-medium text-muted-foreground">CGPA</Label>
              <Input
                id="cgpa"
                type="number"
                step="0.01"
                max="10"
                value={formData.cgpa}
                onChange={(e) => setFormData(prev => ({ ...prev, cgpa: e.target.value }))}
                disabled={!isEditing}
                className="glass-input mt-1"
                placeholder="8.5"
              />
            </div>
            
            <div>
              <Label htmlFor="tenth" className="text-xs font-medium text-muted-foreground">10th Percentage</Label>
              <Input
                id="tenth"
                type="number"
                step="0.01"
                max="100"
                value={formData.tenth_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, tenth_percentage: e.target.value }))}
                disabled={!isEditing}
                className="glass-input mt-1"
                placeholder="95.5"
              />
            </div>
            
            <div>
              <Label htmlFor="twelfth" className="text-xs font-medium text-muted-foreground">12th Percentage</Label>
              <Input
                id="twelfth"
                type="number"
                step="0.01"
                max="100"
                value={formData.twelfth_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, twelfth_percentage: e.target.value }))}
                disabled={!isEditing}
                className="glass-input mt-1"
                placeholder="92.0"
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-accent-foreground" />
            <h3 className="text-sm font-medium text-foreground/80">Skills</h3>
          </div>
          
          <div className="flex flex-wrap gap-2 min-h-[2rem]">
            {formData.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="glass-badge text-xs">
                {skill}
                {isEditing && (
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-2 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          
          {isEditing && (
            <div className="flex space-x-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                className="glass-input flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              />
              <Button onClick={addSkill} size="sm" className="glass-button">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Work Experience */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-accent-foreground" />
            <h3 className="text-sm font-medium text-foreground/80">Work Experience</h3>
          </div>
          
          <Textarea
            value={formData.experience}
            onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
            disabled={!isEditing}
            className="glass-input min-h-[80px] resize-none"
            placeholder="Describe your work experience, internships, or relevant projects..."
          />
        </div>

        {/* Projects */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-accent-foreground" />
            <h3 className="text-sm font-medium text-foreground/80">Projects</h3>
          </div>
          
          <div className="space-y-3">
            {formData.projects.map((project, index) => (
              <div key={index} className="glass-card border-glass p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-sm text-foreground">{project.title}</h4>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProject(index)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{project.description}</p>
              </div>
            ))}
          </div>
          
          {isEditing && (
            <div className="glass-card border-glass p-3 space-y-3">
              <Input
                value={newProject.title}
                onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Project title..."
                className="glass-input"
              />
              <Textarea
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Project description..."
                className="glass-input min-h-[60px] resize-none"
              />
              <Button onClick={addProject} size="sm" className="glass-button w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentDetailsForm;