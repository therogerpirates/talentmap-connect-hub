import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCreateHiringSession } from '@/hooks/useHiringSessions';
import { X, Plus } from 'lucide-react';
import { Layout } from '@/components/Layout';

export default function CreateSession() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createSession = useCreateHiringSession();

  const [formData, setFormData] = useState({
    title: '',
    role: '',
    description: '',
    target_hires: 1,
    min_gpa: '',
    min_tenth_percentage: '',
    min_twelfth_percentage: '',
    eligible_years: [] as string[],
    eligible_departments: [] as string[],
    required_skills: [] as string[],
    preferred_skills: [] as string[],
  });

  const [newSkill, setNewSkill] = useState('');
  const [newPreferredSkill, setNewPreferredSkill] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  const addSkill = (skill: string, type: 'required' | 'preferred') => {
    if (!skill.trim()) return;
    const field = type === 'required' ? 'required_skills' : 'preferred_skills';
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], skill.trim()]
    }));
    if (type === 'required') setNewSkill('');
    else setNewPreferredSkill('');
  };

  const removeSkill = (index: number, type: 'required' | 'preferred') => {
    const field = type === 'required' ? 'required_skills' : 'preferred_skills';
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addYear = () => {
    if (!newYear.trim()) return;
    setFormData(prev => ({
      ...prev,
      eligible_years: [...prev.eligible_years, newYear.trim()]
    }));
    setNewYear('');
  };

  const removeYear = (index: number) => {
    setFormData(prev => ({
      ...prev,
      eligible_years: prev.eligible_years.filter((_, i) => i !== index)
    }));
  };

  const addDepartment = () => {
    if (!newDepartment.trim()) return;
    setFormData(prev => ({
      ...prev,
      eligible_departments: [...prev.eligible_departments, newDepartment.trim()]
    }));
    setNewDepartment('');
  };

  const removeDepartment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      eligible_departments: prev.eligible_departments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const eligibility_criteria = {
        min_gpa: formData.min_gpa ? parseFloat(formData.min_gpa) : undefined,
        min_tenth_percentage: formData.min_tenth_percentage ? parseFloat(formData.min_tenth_percentage) : undefined,
        min_twelfth_percentage: formData.min_twelfth_percentage ? parseFloat(formData.min_twelfth_percentage) : undefined,
        eligible_years: formData.eligible_years,
        eligible_departments: formData.eligible_departments,
      };

      const requirements = {
        required_skills: formData.required_skills,
        preferred_skills: formData.preferred_skills,
      };

      await createSession.mutateAsync({
        title: formData.title,
        role: formData.role,
        description: formData.description,
        target_hires: formData.target_hires,
        eligibility_criteria,
        requirements,
      });

      toast({
        title: "Success",
        description: "Hiring session created successfully",
      });

      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create hiring session",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Hiring Session</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Session Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Software Engineer Internship"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Software Engineer"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the role and requirements..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="target_hires">Target Number of Hires</Label>
                <Input
                  id="target_hires"
                  type="number"
                  min="1"
                  value={formData.target_hires}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_hires: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="min_gpa">Minimum GPA</Label>
                  <Input
                    id="min_gpa"
                    type="number"
                    step="0.01"
                    value={formData.min_gpa}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_gpa: e.target.value }))}
                    placeholder="e.g., 3.0"
                  />
                </div>
                <div>
                  <Label htmlFor="min_tenth">Minimum 10th %</Label>
                  <Input
                    id="min_tenth"
                    type="number"
                    step="0.01"
                    value={formData.min_tenth_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_tenth_percentage: e.target.value }))}
                    placeholder="e.g., 85"
                  />
                </div>
                <div>
                  <Label htmlFor="min_twelfth">Minimum 12th %</Label>
                  <Input
                    id="min_twelfth"
                    type="number"
                    step="0.01"
                    value={formData.min_twelfth_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_twelfth_percentage: e.target.value }))}
                    placeholder="e.g., 85"
                  />
                </div>
              </div>

              {/* Required Skills */}
              <div>
                <Label>Required Skills</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add required skill"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill, 'required'))}
                  />
                  <Button type="button" onClick={() => addSkill(newSkill, 'required')} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.required_skills.map((skill, index) => (
                    <Badge key={index} variant="default" className="flex items-center gap-1">
                      {skill}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeSkill(index, 'required')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Preferred Skills */}
              <div>
                <Label>Preferred Skills</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newPreferredSkill}
                    onChange={(e) => setNewPreferredSkill(e.target.value)}
                    placeholder="Add preferred skill"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newPreferredSkill, 'preferred'))}
                  />
                  <Button type="button" onClick={() => addSkill(newPreferredSkill, 'preferred')} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.preferred_skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeSkill(index, 'preferred')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Eligible Years */}
              <div>
                <Label>Eligible Years</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="Add eligible year (e.g., 2024)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addYear())}
                  />
                  <Button type="button" onClick={addYear} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.eligible_years.map((year, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {year}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeYear(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Eligible Departments */}
              <div>
                <Label>Eligible Departments</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="Add eligible department"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDepartment())}
                  />
                  <Button type="button" onClick={addDepartment} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.eligible_departments.map((dept, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {dept}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeDepartment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={createSession.isPending}>
                  {createSession.isPending ? 'Creating...' : 'Create Session'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin-dashboard')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}