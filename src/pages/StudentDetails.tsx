import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Plus, Trash2, Linkedin, Github, Code, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentData, useUpdateStudentData } from '@/hooks/useStudentData';
import StudentSidebar from '@/components/StudentSidebar';
import ATSScoreCircle from '@/components/ATSScoreCircle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';

interface StudentDetailsData {
  skills: string[];
  projects: string[];
  experience: string[];
  cgpa: number;
  tenth_percentage: number;
  twelfth_percentage: number;
}

const StudentDetails = () => {
  const { profile } = useAuth();
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

  // Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    year: '',
    department: '',
    cgpa: '',
  });

  // Derived state for ATS Score & Improvements
  const [atsScore, setAtsScore] = useState(0);
  const [improvements, setImprovements] = useState<string[]>([]);

  useEffect(() => {
    if (studentData) {
      setDetailsData({
        skills: Array.isArray(studentData.skills) ? studentData.skills.map(String) : [],
        projects: Array.isArray(studentData.projects) ? studentData.projects.map(String) : [],
        experience: Array.isArray(studentData.experience) ? studentData.experience.map(String) : [],
        cgpa: parseFloat(studentData.gpa || '0'),
        tenth_percentage: parseFloat(studentData.tenth_percentage || '0'),
        twelfth_percentage: parseFloat(studentData.twelfth_percentage || '0')
      });

      const score = studentData.ats_score || 0;
      setAtsScore(score);

      // Generate improvements dynamically if not persisted
      const msgs = [];
      if (score < 60) msgs.push("Resume content is sparse. Add more details to projects.");
      if ((studentData.skills?.length || 0) < 5) msgs.push("Add more technical skills to improve matching.");
      if (!studentData.summary) msgs.push("Add a professional summary to your resume.");
      if ((studentData.projects?.length || 0) < 2) msgs.push("Include at least 2 significant projects.");
      if (msgs.length === 0 && score < 100) msgs.push("Review job descriptions to tailor your keywords.");
      // Fallback text from UI mock
      if (msgs.length === 0) msgs.push("Lorem ipsum dolor sit amet, consectetur.");

      setImprovements(msgs);
    }
  }, [studentData]);

  const startEditing = (field: string, value: string | string[]) => {
    setEditingField(field);
    setEditValue(Array.isArray(value) ? value.join('\n') : value);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const openEditProfile = () => {
    setProfileForm({
      fullName: profile?.full_name || '',
      year: studentData?.year || '',
      department: studentData?.department || '',
      cgpa: studentData?.gpa || ''
    });
    setIsEditProfileOpen(true);
  };

  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      // Update student details
      await updateStudentMutation.mutateAsync({
        year: profileForm.year,
        department: profileForm.department,
        gpa: profileForm.cgpa
      });

      // Update profile name if changed
      if (profile?.id && profileForm.fullName !== profile.full_name) {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: profileForm.fullName })
          .eq('id', profile.id);

        if (error) throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
      setIsEditProfileOpen(false);

      // Reload to reflect name changes in global context if necessary
      if (profileForm.fullName !== profile?.full_name) {
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
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
      // Handle numeric fields
      if (['cgpa', 'tenth_percentage', 'twelfth_percentage'].includes(editingField)) {
        // Just keep as string for update, let standard normalization handle it or persist as string
      }

      // Map UI field names to DB column names if necessary
      const fieldMap: Record<string, string> = {
        'cgpa': 'gpa'
      };

      const dbField = fieldMap[editingField] || editingField;

      await updateStudentMutation.mutateAsync({
        [dbField]: valueToSave
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
      const updatedList = [...detailsData[field], newItem.trim()];
      // Optimistic update local
      setDetailsData(prev => ({ ...prev, [field]: updatedList }));
      // Trigger save immediately for array items added via prompt (simpler UX)
      updateStudentMutation.mutateAsync({ [field]: updatedList });
    }
  };

  const removeArrayItem = (field: 'skills' | 'projects' | 'experience', index: number) => {
    const updatedList = detailsData[field].filter((_, i) => i !== index);
    setDetailsData(prev => ({ ...prev, [field]: updatedList }));
    updateStudentMutation.mutateAsync({ [field]: updatedList });
  };

  // Helper to render editable External Profile Links
  const renderExternalProfile = (label: string, icon: any, field: string, url: string) => {
    const isEditing = editingField === field;

    return (
      <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
          {icon}
          <span className="font-medium">{label}</span>
        </div>

        <div className="flex-1 mx-4">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 text-sm"
                placeholder="https://..."
              />
              <Button size="sm" variant="ghost" onClick={saveField} className="h-8 w-8 p-0 text-green-600"><Save className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-8 w-8 p-0 text-red-600"><X className="w-4 h-4" /></Button>
            </div>
          ) : (
            <div className="flex justify-end">
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-[150px] block mr-2">
                  {label} Profile
                </a>
              ) : (
                <span className="text-sm text-slate-400 italic mr-2">Not linked</span>
              )}
              <Button variant="ghost" size="sm" onClick={() => startEditing(field, url)} className="h-6 w-6 p-0 text-slate-400 hover:text-blue-600">
                <Edit3 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (studentLoading) {
    return (
      <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden">
      <StudentSidebar />

      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
          </div>

          {/* Top Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left Column: Profile + (Skills & Links) */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              {/* Profile Card (Blue Gradient) */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-500 p-8 pb-14 text-white shadow-xl">
                <div className="absolute top-4 right-4">
                  {/* Edit Profile Info Trigger */}
                  <Button variant="ghost" size="icon" onClick={openEditProfile} className="text-white/80 hover:text-white hover:bg-white/20">
                    <Edit3 className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                  <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-4 border-white/10 shrink-0">
                    {profile?.full_name?.[0] || 'S'}
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <h2 className="text-3xl font-bold">{profile?.full_name || 'Student Name'}</h2>
                    <p className="text-blue-100 text-lg">
                      {studentData?.year || 'Academic Year'} year • {studentData?.department || 'Department'}
                    </p>
                    <p className="text-white/90 font-medium pt-2">
                      CGPA: {detailsData.cgpa || 'N/A'}
                    </p>
                  </div>
                </div>
                {/* Decorative bubble */}
                <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              </div>

              {/* Inner Grid: Skills & External Profiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Skills Card */}
                <Card className="p-6 bg-slate-100 dark:bg-slate-800/50 border-none shadow-md flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-slate-800 dark:text-white">
                      <span className="text-blue-500">❖</span>
                      <h3 className="font-semibold text-lg">Skills</h3>
                    </div>
                    {editingField === 'skills' ? (
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={saveField} className="text-green-500 p-1 h-auto"><Save className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditing} className="text-red-500 p-1 h-auto"><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => startEditing('skills', detailsData.skills)} className="text-blue-500 p-1 h-auto hover:bg-blue-50 dark:hover:bg-slate-700">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex-1">
                    {editingField === 'skills' ? (
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="min-h-[120px] bg-white dark:bg-slate-900 h-full"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2 content-start">
                        {detailsData.skills.length > 0 ? (
                          detailsData.skills.map((skill, i) => (
                            <Badge key={i} variant="secondary" className="px-3 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 border-0 shadow-sm">
                              {skill}
                              <button onClick={() => removeArrayItem('skills', i)} className="ml-2 text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-400 text-sm">No skills added yet.</span>
                        )}
                        <Button variant="outline" size="sm" onClick={() => addArrayItem('skills')} className="rounded-full border-dashed border-slate-300 dark:border-slate-600 text-slate-500">
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>

                {/* External Profiles */}
                <Card className="p-6 bg-slate-100 dark:bg-slate-800/50 border-none shadow-md flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-slate-800 dark:text-white">
                      <span className="text-blue-500">❖</span>
                      <h3 className="font-semibold text-lg">External Profiles</h3>
                    </div>
                    {/* Global edit for card isn't needed since individual rows are editable */}
                  </div>
                  <div className="space-y-1 flex-1">
                    {renderExternalProfile("LinkedIn", <Linkedin className="w-5 h-5" />, "linkedin_url", studentData?.linkedin_url || studentData?.linkedin || '')}
                    {renderExternalProfile("GitHub", <Github className="w-5 h-5" />, "github_url", studentData?.github_url || studentData?.github || '')}
                    {renderExternalProfile("LeetCode", <Code className="w-5 h-5" />, "leetcode_url", studentData?.leetcode_url || '')}
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Column: ATS Score (Spans full height of Left Column effectively) */}
            <div className="xl:col-span-1">
              <Card className="bg-white dark:bg-slate-900 border-none shadow-lg h-full">
                <ATSScoreCircle score={atsScore} improvements={improvements} />
              </Card>
            </div>
          </div>

          {/* Bottom Section: Projects */}
          <Card className="p-6 bg-slate-200 dark:bg-slate-800 border-none shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-white">
                <span className="text-blue-500">❖</span>
                <h3 className="font-semibold text-lg">Projects</h3>
              </div>
              {editingField === 'projects' ? (
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" onClick={saveField} className="text-green-500 p-1 h-auto"><Save className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={cancelEditing} className="text-red-500 p-1 h-auto"><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => startEditing('projects', detailsData.projects)} className="text-blue-500 p-1 h-auto hover:bg-slate-300 dark:hover:bg-slate-700">
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {editingField === 'projects' ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[150px] bg-white dark:bg-slate-900"
                placeholder="Enter project titles (one per line)"
              />
            ) : (
              <div className="min-h-[100px] space-y-2">
                {detailsData.projects.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                    {detailsData.projects.map((proj, i) => (
                      <li key={i} className="flex items-center justify-between group p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
                        <span>{proj.split('\n')[0]}</span> {/* Display Title only if multiple lines */}
                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('projects', i)} className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500"><Trash2 className="w-3 h-3" /></Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">No projects listed.</p>
                )}
                <Button variant="ghost" size="sm" onClick={() => addArrayItem('projects')} className="text-blue-600 hover:underline px-0">
                  + Add Project
                </Button>
              </div>
            )}
          </Card>

          {/* Experience Section */}
          <Card className="p-6 bg-slate-200 dark:bg-slate-800 border-none shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-white">
                <span className="text-blue-500">❖</span>
                <h3 className="font-semibold text-lg">Experience</h3>
              </div>
              {editingField === 'experience' ? (
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" onClick={saveField} className="text-green-500 p-1 h-auto"><Save className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={cancelEditing} className="text-red-500 p-1 h-auto"><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => startEditing('experience', detailsData.experience)} className="text-blue-500 p-1 h-auto hover:bg-slate-300 dark:hover:bg-slate-700">
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {editingField === 'experience' ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[150px] bg-white dark:bg-slate-900"
                placeholder="Enter experience details (one per line)"
              />
            ) : (
              <div className="min-h-[100px] space-y-2">
                {detailsData.experience.length > 0 ? (
                  <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                    {detailsData.experience.map((exp, i) => (
                      <li key={i} className="flex items-center justify-between group p-2 bg-white/50 dark:bg-slate-900/50 rounded hover:bg-white transition-colors">
                        <span>{exp}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('experience', i)} className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500"><Trash2 className="w-3 h-3" /></Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">No experience listed.</p>
                )}
                <Button variant="ghost" size="sm" onClick={() => addArrayItem('experience')} className="text-blue-600 hover:underline px-0">
                  + Add Experience
                </Button>
              </div>
            )}
          </Card>

        </div>
      </main>

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile information here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Year
              </Label>
              <Select
                value={profileForm.year}
                onValueChange={(value) => setProfileForm({ ...profileForm, year: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Year" />
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Dept
              </Label>
              <Select
                value={profileForm.department}
                onValueChange={(value) => setProfileForm({ ...profileForm, department: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer science and Engineering">Computer Science & Eng</SelectItem>
                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                  <SelectItem value="Artificial Intelligence and Machine Learning">AI & ML</SelectItem>
                  <SelectItem value="Artificial Intelligence and Data Science">AI & DS</SelectItem>
                  <SelectItem value="Computer Science and Engineering in Cybersecurity">CSE Cybersecurity</SelectItem>
                  <SelectItem value="Agriculuture Engineering">Agriculture Engineering</SelectItem>
                  <SelectItem value="Electrical and Electronics Engineering">EEE</SelectItem>
                  <SelectItem value="Electrical and communication Enginnerng">ECE</SelectItem>
                  <SelectItem value="civil Engineering">Civil Engineering</SelectItem>
                  <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cgpa" className="text-right">
                CGPA
              </Label>
              <Input
                id="cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={profileForm.cgpa}
                onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleProfileSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDetails;