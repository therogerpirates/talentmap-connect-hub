import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useHiringSessions } from '@/hooks/useHiringSessions';
import { useSessionCandidates, useUpdateCandidateStatus } from '@/hooks/useSessionCandidates';
import { ArrowLeft, Users, Target, Calendar } from 'lucide-react';
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
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{session.description || 'No description provided'}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {session.requirements.required_skills?.map((skill: string, index: number) => (
                      <Badge key={index} variant="default">{skill}</Badge>
                    )) || <span className="text-muted-foreground">None specified</span>}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Preferred Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {session.requirements.preferred_skills?.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    )) || <span className="text-muted-foreground">None specified</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Eligibility Criteria</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {session.eligibility_criteria.min_gpa && (
                        <li>Minimum GPA: {session.eligibility_criteria.min_gpa}</li>
                      )}
                      {session.eligibility_criteria.min_tenth_percentage && (
                        <li>Minimum 10th %: {session.eligibility_criteria.min_tenth_percentage}</li>
                      )}
                      {session.eligibility_criteria.min_twelfth_percentage && (
                        <li>Minimum 12th %: {session.eligibility_criteria.min_twelfth_percentage}</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Eligible Years & Departments</h4>
                    <div className="space-y-2">
                      {session.eligibility_criteria.eligible_years?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">Years:</p>
                          <div className="flex flex-wrap gap-1">
                            {session.eligibility_criteria.eligible_years.map((year: string, index: number) => (
                              <Badge key={index} variant="outline">{year}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {session.eligibility_criteria.eligible_departments?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">Departments:</p>
                          <div className="flex flex-wrap gap-1">
                            {session.eligibility_criteria.eligible_departments.map((dept: string, index: number) => (
                              <Badge key={index} variant="outline">{dept}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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