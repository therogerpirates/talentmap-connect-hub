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
import { ArrowLeft, Users, Target, Calendar, Edit2, Save, X, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { JobRequirementsDisplay } from '@/components/JobRequirementsDisplay';
import CandidateMatchingSystem from '@/components/CandidateMatchingSystem';
import { useAuth } from '@/contexts/AuthContext';

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
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
  const [isFindingMatches, setIsFindingMatches] = useState(false);

  // Debug authentication state
  console.log('SessionDetail Debug:', {
    sessionId,
    user: user?.id,
    sessionExists: !!session,
    candidatesCount: candidates?.length || 0
  });

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

  const handleFindMatchingStudents = async () => {
    if (!sessionId) return;

    setIsFindingMatches(true);
    
    try {
      const response = await fetch(`http://localhost:8000/find-matching-students/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        toast({
          title: "Matching Complete!",
          description: `Found ${data.total_matches} matching students for this position`,
        });
        
        // Refresh the page to show updated candidates
        window.location.reload();
      } else {
        throw new Error(data.message || 'Failed to find matching students');
      }
    } catch (error) {
      console.error('Error finding matching students:', error);
      toast({
        title: "Matching Failed",
        description: "Unable to find matching students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFindingMatches(false);
    }
  };

  const filteredCandidates = candidates?.filter(candidate => 
    selectedStatus === 'all' || candidate.status === selectedStatus
  ) || [];

  const statusCounts = {
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


        <Tabs defaultValue="candidates" className="w-full">
          <TabsList>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="details">Session Details</TabsTrigger>
          </TabsList>

          <TabsContent value="candidates" className="space-y-4">
            <CandidateMatchingSystem
              sessionId={sessionId!}
              candidates={candidates || []}
              onStatusUpdate={handleStatusUpdate}
              onRefreshMatches={handleFindMatchingStudents}
            />
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