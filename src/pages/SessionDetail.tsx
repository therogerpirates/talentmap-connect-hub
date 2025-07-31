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
import { JobRequirementsDisplay } from '@/components/JobRequirementsDisplay';

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
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtractFromDescription = async () => {
    if (!session?.description) {
      toast({
        title: "No Description",
        description: "No job description found to extract from",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    
    try {
      const response = await fetch('http://localhost:8000/process-hiring-session/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          session_id: sessionId!,
          description: session.description
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        toast({
          title: "Extraction Successful!",
          description: `Extracted ${data.extracted_data.required_skills.length} skills and requirements from job description`,
        });
        
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        throw new Error(data.message || 'Failed to extract job information');
      }
    } catch (error) {
      console.error('Error extracting job information:', error);
      toast({
        title: "Extraction Failed",
        description: "Unable to extract job information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

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

  const handleSaveSessionFromJobDisplay = async (data: any) => {
    try {
      const { error } = await supabase
        .from('hiring_sessions')
        .update({
          requirements: data.requirements,
          eligibility_criteria: data.eligibility_criteria,
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
        <Card className="glass-panel hover-lift border-0 shadow-glass overflow-hidden group relative fade-in-up">
          <CardContent className="p-8 relative flex flex-col justify-between h-full">
            <div className="absolute inset-0 gradient-primary opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Total Candidates</p>
                <p className="text-4xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  {candidates?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Registered in this session</p>
              </div>
              <div className="gradient-primary p-4 rounded-2xl shadow-glow group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="glass-panel hover-lift border-0 shadow-glass overflow-hidden group relative fade-in-up">
          <CardContent className="p-8 relative flex flex-col justify-between h-full">
            <div className="absolute inset-0 gradient-primary opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Target Hires</p>
                <p className="text-4xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  {session.target_hires}
                </p>
                <p className="text-sm text-muted-foreground">Target hires for this session</p>
              </div>
              <div className="gradient-primary p-4 rounded-2xl shadow-glow group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="glass-panel hover-lift border-0 shadow-glass overflow-hidden group relative fade-in-up">
          <CardContent className="p-8 relative flex flex-col justify-between h-full">
            <div className="absolute inset-0 gradient-primary opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Hired</p>
                <p className="text-4xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  {statusCounts.hired}
                </p>
                <p className="text-sm text-muted-foreground">Hired candidates for this session</p>
              </div>
              <div className="gradient-primary p-4 rounded-2xl shadow-glow group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="glass-panel hover-lift border-0 shadow-glass overflow-hidden group relative fade-in-up">
          <CardContent className="p-8 relative flex flex-col justify-between h-full">
            <div className="absolute inset-0 gradient-primary opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Created</p>
                <p className="text-sm text-muted-foreground">{new Date(session.created_at).toLocaleDateString()}</p>
              </div>
              <div className="gradient-primary p-4 rounded-2xl shadow-glow group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-8 w-8 text-white" />
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
                <div className="p-2">Applied: {statusCounts.applied}</div>
                <div className="p-2">Shortlisted: {statusCounts.shortlisted}</div>
                <div className="p-2">Waitlisted: {statusCounts.waitlisted}</div>
                <div className="p-2">Hired: {statusCounts.hired}</div>
                <div className="p-2">Rejected: {statusCounts.rejected}</div>
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
            <JobRequirementsDisplay
              requirements={session.requirements}
              eligibility_criteria={session.eligibility_criteria}
              description={session.description}
              isEditing={isEditing}
              onEdit={() => setIsEditing(true)}
              onSave={(data) => {
                // Handle save with the new JobRequirementsDisplay data structure
                handleSaveSessionFromJobDisplay(data);
              }}
              onCancel={() => setIsEditing(false)}
              showExtractButton={true}
              onExtractFromDescription={handleExtractFromDescription}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}