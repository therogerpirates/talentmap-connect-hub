import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Target, BookOpen, Users, Clock, GraduationCap, Edit2, Save, X, Plus, Brain } from 'lucide-react';

interface JobRequirementsDisplayProps {
  requirements?: {
    required_skills?: string[];
  };
  eligibility_criteria?: {
    education?: string[];
    experience_years?: number;
    cgpa_minimum?: number;
    specific_requirements?: string[];
    eligible_years?: number[];
  };
  description?: string;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: (data: any) => void;
  onCancel?: () => void;
  showExtractButton?: boolean;
  onExtractFromDescription?: () => void;
}

export const JobRequirementsDisplay = ({
  requirements,
  eligibility_criteria,
  description,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  showExtractButton = false,
  onExtractFromDescription
}: JobRequirementsDisplayProps) => {
  const [editableData, setEditableData] = useState({
    required_skills: requirements?.required_skills || [],
    eligibility_criteria: {
      education: eligibility_criteria?.education || [],
      experience_years: eligibility_criteria?.experience_years || 0,
      cgpa_minimum: eligibility_criteria?.cgpa_minimum || 0,
      specific_requirements: eligibility_criteria?.specific_requirements || [],
      eligible_years: eligibility_criteria?.eligible_years || []
    }
  });

  const [newSkill, setNewSkill] = useState('');
  const [newEducation, setNewEducation] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newYear, setNewYear] = useState('');

  const addSkill = () => {
    if (newSkill.trim() && !editableData.required_skills.includes(newSkill.trim())) {
      setEditableData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setEditableData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addEducation = () => {
    if (newEducation.trim() && !editableData.eligibility_criteria.education.includes(newEducation.trim())) {
      setEditableData(prev => ({
        ...prev,
        eligibility_criteria: {
          ...prev.eligibility_criteria,
          education: [...prev.eligibility_criteria.education, newEducation.trim()]
        }
      }));
      setNewEducation('');
    }
  };

  const removeEducation = (eduToRemove: string) => {
    setEditableData(prev => ({
      ...prev,
      eligibility_criteria: {
        ...prev.eligibility_criteria,
        education: prev.eligibility_criteria.education.filter(edu => edu !== eduToRemove)
      }
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim() && !editableData.eligibility_criteria.specific_requirements.includes(newRequirement.trim())) {
      setEditableData(prev => ({
        ...prev,
        eligibility_criteria: {
          ...prev.eligibility_criteria,
          specific_requirements: [...prev.eligibility_criteria.specific_requirements, newRequirement.trim()]
        }
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (reqToRemove: string) => {
    setEditableData(prev => ({
      ...prev,
      eligibility_criteria: {
        ...prev.eligibility_criteria,
        specific_requirements: prev.eligibility_criteria.specific_requirements.filter(req => req !== reqToRemove)
      }
    }));
  };

  const addYear = () => {
    const year = parseInt(newYear);
    if (year >= 1 && year <= 4 && !editableData.eligibility_criteria.eligible_years.includes(year)) {
      setEditableData(prev => ({
        ...prev,
        eligibility_criteria: {
          ...prev.eligibility_criteria,
          eligible_years: [...prev.eligibility_criteria.eligible_years, year].sort()
        }
      }));
      setNewYear('');
    }
  };

  const removeYear = (yearToRemove: number) => {
    setEditableData(prev => ({
      ...prev,
      eligibility_criteria: {
        ...prev.eligibility_criteria,
        eligible_years: prev.eligibility_criteria.eligible_years.filter(year => year !== yearToRemove)
      }
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        requirements: {
          required_skills: editableData.required_skills
        },
        eligibility_criteria: {
          ...editableData.eligibility_criteria,
          eligible_years: editableData.eligibility_criteria.eligible_years
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Job Requirements & Eligibility</h3>
        <div className="flex items-center space-x-2">
          {showExtractButton && onExtractFromDescription && description && (
            <Button
              onClick={onExtractFromDescription}
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <Brain className="h-4 w-4 mr-2" />
              Auto-Extract from Description
            </Button>
          )}
          {!isEditing ? (
            <Button onClick={onEdit} variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSave} size="sm" className="gradient-primary text-white">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={onCancel} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Required Skills */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span>Required Skills</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="flex flex-wrap gap-2">
              {(requirements?.required_skills || []).map((skill, index) => (
                <Badge key={index} variant="default" className="bg-blue-100 text-blue-800">
                  {skill}
                </Badge>
              )) || <span className="text-muted-foreground">No skills specified</span>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {editableData.required_skills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    <span className="text-sm">{skill}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-blue-200"
                      onClick={() => removeSkill(skill)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add required skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  className="flex-1"
                />
                <Button onClick={addSkill} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eligibility Criteria */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-green-500" />
            <span>Eligibility Criteria</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Education Requirements */}
          <div>
            <Label className="text-sm font-medium mb-2 block flex items-center space-x-2">
              <GraduationCap className="h-4 w-4 text-green-600" />
              <span>Education Requirements</span>
            </Label>
            {!isEditing ? (
              <div className="flex flex-wrap gap-2">
                {(eligibility_criteria?.education || []).map((edu, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                    {edu}
                  </Badge>
                )) || <span className="text-muted-foreground text-sm">No education requirements specified</span>}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {editableData.eligibility_criteria.education.map((edu, index) => (
                    <div key={index} className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      <span className="text-sm">{edu}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-green-200"
                        onClick={() => removeEducation(edu)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add education requirement"
                    value={newEducation}
                    onChange={(e) => setNewEducation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEducation()}
                    className="flex-1"
                  />
                  <Button onClick={addEducation} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Experience & CGPA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>Experience Required (Years)</span>
              </Label>
              {!isEditing ? (
                <div className="text-lg font-semibold">
                  {eligibility_criteria?.experience_years || 0} year{(eligibility_criteria?.experience_years || 0) !== 1 ? 's' : ''}
                </div>
              ) : (
                <Input
                  type="number"
                  min="0"
                  value={editableData.eligibility_criteria.experience_years}
                  onChange={(e) => setEditableData(prev => ({
                    ...prev,
                    eligibility_criteria: {
                      ...prev.eligibility_criteria,
                      experience_years: parseInt(e.target.value) || 0
                    }
                  }))}
                />
              )}
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block flex items-center space-x-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span>Minimum CGPA</span>
              </Label>
              {!isEditing ? (
                <div className="text-lg font-semibold">
                  {eligibility_criteria?.cgpa_minimum || 0}
                </div>
              ) : (
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={editableData.eligibility_criteria.cgpa_minimum}
                  onChange={(e) => setEditableData(prev => ({
                    ...prev,
                    eligibility_criteria: {
                      ...prev.eligibility_criteria,
                      cgpa_minimum: parseFloat(e.target.value) || 0
                    }
                  }))}
                />
              )}
            </div>
          </div>

          {/* Specific Requirements */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Additional Requirements</Label>
            {!isEditing ? (
              <div className="space-y-2">
                {(eligibility_criteria?.specific_requirements || []).map((req, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{req}</span>
                  </div>
                )) || <span className="text-muted-foreground text-sm">No additional requirements</span>}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-2">
                  {editableData.eligibility_criteria.specific_requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                      <span className="text-sm flex-1">{req}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-orange-200"
                        onClick={() => removeRequirement(req)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add additional requirement"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                    className="flex-1"
                  />
                  <Button onClick={addRequirement} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Eligible Years */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span>Eligible Academic Years</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="flex space-x-3">
              {(eligibility_criteria?.eligible_years || []).map((year, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-purple-600">{year}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Year {year}</span>
                </div>
              )) || <span className="text-muted-foreground">All years eligible</span>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex space-x-3">
                {editableData.eligibility_criteria.eligible_years.map((year, index) => (
                  <div key={index} className="text-center relative">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2 relative">
                      <span className="text-lg font-bold text-purple-600">{year}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-100 hover:bg-red-200 rounded-full"
                        onClick={() => removeYear(year)}
                      >
                        <X className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">Year {year}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="1"
                  max="4"
                  placeholder="Year (1-4)"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addYear()}
                  className="w-32"
                />
                <Button onClick={addYear} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobRequirementsDisplay;
