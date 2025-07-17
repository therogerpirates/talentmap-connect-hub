import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useHiringSessions } from '@/hooks/useHiringSessions';
import { useSessionCandidates, useUpdateCandidateStatus } from '@/hooks/useSessionCandidates';
import { ArrowLeft, Users, Target, Calendar, Edit2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: sessions } = useHiringSessions();
  const { data: candidates } = useSessionCandidates(sessionId!);
  const updateCandidateStatus = useUpdateCandidateStatus();

  const session = sessions?.find(s => s.id === sessionId);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editableSession, setEditableSession] = useState({
    required_skills: session?.requirements?.required_skills || [],
    eligibility_criteria: {
      min_gpa: session?.eligibility_criteria?.min_gpa || '',
      min_tenth_percentage: session?.eligibility_criteria?.min_tenth_percentage || '',
      min_twelfth_percentage: session?.eligibility_criteria?.min_twelfth_percentage || '',
    },
    eligible_years: session?.eligibility_criteria?.eligible_years || [],
  });
  const [newSkill, setNewSkill] = useState('');
  const [newYear, setNewYear] = useState('');

  const filteredCandidates = candidates?.filter(candidate => 
    selectedStatus === 'all' || candidate.status === selectedStatus
  ) || [];

  const statusCounts = {
    applied: candidates?.filter(c => c.status === 'applied').length || 0,
    shortlisted: candidates?.filter(c => c.status === 'shortlisted').length || 0,
    waitlisted: candidates?.filter(c => c.status === 'waitlisted').length || 0,
    hired: candidates?.filter(c => c.status === 'hired').length || 0,
    rejected: candidates?.filter(c => c.status === 'rejected').length || 0,
  };

  const handleStatusUpdate = async (candidateId: string, newStatus: string) => {
    try {
      await updateCandidateStatus.mutateAsync({
        id: candidateId,
        status: newStatus as any,
      });
      
      toast({
        title: "Success",
        description: `Candidate status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating candidate status:', error);
      toast({
        title: "Error",
        description: "Failed to update candidate status",
        variant: "destructive",
      });
    }
  };

  const handleSaveSession = async () => {
    try {
      const { error } = await supabase
        .from('hiring_sessions')
        .update({
          requirements: {
            required_skills: editableSession.required_skills,
          },
          eligibility_criteria: {
            ...editableSession.eligibility_criteria,
            eligible_years: editableSession.eligible_years,
          },
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session details updated successfully",
      });
      setIsEditing(false);
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update session details",
        variant: "destructive",
      });
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !editableSession.required_skills.includes(newSkill.trim())) {
      setEditableSession(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setEditableSession(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addYear = () => {
    if (newYear.trim() && !editableSession.eligible_years.includes(newYear.trim())) {
      setEditableSession(prev => ({
        ...prev,
        eligible_years: [...prev.eligible_years, newYear.trim()]
      }));
      setNewYear('');
    }
  };

  const removeYear = (yearToRemove: string) => {
    setEditableSession(prev => ({
      ...prev,
      eligible_years: prev.eligible_years.filter(year => year !== yearToRemove)
    }));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'hired': return 'default';
      case 'shortlisted': return 'secondary';
      case 'waitlisted': return 'outline';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  if (!session) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="text-center">Session not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin-dashboard')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{session.title}</h1>
              <p className="text-muted-foreground mt-1">{session.role}</p>
            </div>
            <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
              {session.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Candidates</p>
                  <p className="text-2xl font-bold">{candidates?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Target Hires</p>
                  <p className="text-2xl font-bold">{session.target_hires}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Hired</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.hired}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm">{new Date(session.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="candidates" className="w-full">
          <TabsList>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="details">Session Details</TabsTrigger>
          </TabsList>

          <TabsContent value="candidates" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline">Applied: {statusCounts.applied}</Badge>
                <Badge variant="secondary">Shortlisted: {statusCounts.shortlisted}</Badge>
                <Badge variant="outline">Waitlisted: {statusCounts.waitlisted}</Badge>
                <Badge variant="default">Hired: {statusCounts.hired}</Badge>
                <Badge variant="destructive">Rejected: {statusCounts.rejected}</Badge>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Candidates</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredCandidates.map((candidate) => (
                <Card key={candidate.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold">{candidate.student?.profile?.full_name}</h3>
                          <Badge variant={getStatusBadgeVariant(candidate.status)}>
                            {candidate.status}
                          </Badge>
                          <Badge variant="outline" className="bg-primary/10">
                            {candidate.match_score}% match
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <p className="font-medium">Email</p>
                            <p>{candidate.student?.profile?.email}</p>
                          </div>
                          <div>
                            <p className="font-medium">Department</p>
                            <p>{candidate.student?.department || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Year</p>
                            <p>{candidate.student?.year || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium">GPA</p>
                            <p>{candidate.student?.gpa || 'N/A'}</p>
                          </div>
                        </div>

                        {candidate.student?.skills && candidate.student.skills.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {candidate.student.skills.slice(0, 5).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {candidate.student.skills.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{candidate.student.skills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        <Select
                          value={candidate.status}
                          onValueChange={(value) => handleStatusUpdate(candidate.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="shortlisted">Shortlisted</SelectItem>
                            <SelectItem value="waitlisted">Waitlisted</SelectItem>
                            <SelectItem value="hired">Hired</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCandidates.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No candidates found for the selected filter.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Session Information</CardTitle>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveSession}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{session.description || 'No description provided'}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Required Skills</h4>
                  {!isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {session.requirements?.required_skills?.map((skill: string, index: number) => (
                        <Badge key={index} variant="default">{skill}</Badge>
                      )) || <span className="text-muted-foreground">None specified</span>}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {editableSession.required_skills.map((skill, index) => (
                          <div key={index} className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                            <span className="text-sm">{skill}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
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
                        />
                        <Button onClick={addSkill}>Add</Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Eligibility Criteria</h4>
                    {!isEditing ? (
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {session.eligibility_criteria?.min_gpa && (
                          <li>Minimum GPA: {session.eligibility_criteria.min_gpa}</li>
                        )}
                        {session.eligibility_criteria?.min_tenth_percentage && (
                          <li>Minimum 10th %: {session.eligibility_criteria.min_tenth_percentage}</li>
                        )}
                        {session.eligibility_criteria?.min_twelfth_percentage && (
                          <li>Minimum 12th %: {session.eligibility_criteria.min_twelfth_percentage}</li>
                        )}
                      </ul>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="min_gpa">Minimum GPA</Label>
                          <Input
                            id="min_gpa"
                            type="number"
                            step="0.1"
                            placeholder="e.g., 7.0"
                            value={editableSession.eligibility_criteria.min_gpa}
                            onChange={(e) => setEditableSession(prev => ({
                              ...prev,
                              eligibility_criteria: {
                                ...prev.eligibility_criteria,
                                min_gpa: e.target.value
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="min_tenth">Minimum 10th %</Label>
                          <Input
                            id="min_tenth"
                            type="number"
                            placeholder="e.g., 85"
                            value={editableSession.eligibility_criteria.min_tenth_percentage}
                            onChange={(e) => setEditableSession(prev => ({
                              ...prev,
                              eligibility_criteria: {
                                ...prev.eligibility_criteria,
                                min_tenth_percentage: e.target.value
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="min_twelfth">Minimum 12th %</Label>
                          <Input
                            id="min_twelfth"
                            type="number"
                            placeholder="e.g., 80"
                            value={editableSession.eligibility_criteria.min_twelfth_percentage}
                            onChange={(e) => setEditableSession(prev => ({
                              ...prev,
                              eligibility_criteria: {
                                ...prev.eligibility_criteria,
                                min_twelfth_percentage: e.target.value
                              }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Eligible Years</h4>
                    {!isEditing ? (
                      <div>
                        {session.eligibility_criteria?.eligible_years?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {session.eligibility_criteria.eligible_years.map((year: string, index: number) => (
                              <Badge key={index} variant="outline">{year}</Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">None specified</span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {editableSession.eligible_years.map((year, index) => (
                            <div key={index} className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded">
                              <span className="text-sm">{year}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0"
                                onClick={() => removeYear(year)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add eligible year (e.g., 2024, 3rd Year)"
                            value={newYear}
                            onChange={(e) => setNewYear(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addYear()}
                          />
                          <Button onClick={addYear}>Add</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}