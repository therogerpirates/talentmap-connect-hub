import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { SessionCandidate } from "@/hooks/useSessionCandidates";
import { 
  Users, 
  Target, 
  TrendingUp, 
  Award, 
  Brain,
  GraduationCap,
  Briefcase,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  BarChart3,
  Eye,
  Filter,
  RefreshCw,
  Download
} from "lucide-react";

interface DetailedAnalysis {
  overall_score: number;
  skills_analysis: {
    weight: number;
    score: number;
    matched_skills: Array<{ required: string; student_has: string }>;
    missing_skills: string[];
    additional_skills: string[];
  };
  education_analysis: {
    weight: number;
    score: number;
    requirements_met: Array<{ required: string; student_has: string }>;
    requirements_not_met: string[];
  };
  experience_analysis: {
    weight: number;
    score: number;
    required_years: number;
    student_experience_years: number;
    has_internship: boolean;
  };
  academic_analysis: {
    weight: number;
    score: number;
    required_cgpa: number;
    student_gpa: string;
    meets_requirement: boolean;
  };
  year_eligibility_analysis: {
    weight: number;
    score: number;
    eligible_years: number[];
    student_year: string;
    is_eligible: boolean;
  };
  recommendations: string[];
  student_info: any;
  job_info: any;
}

interface SessionAnalytics {
  session_info: {
    title: string;
    role: string;
    target_hires: number;
    current_hires: number;
  };
  candidate_stats: {
    total_candidates: number;
    status_distribution: Record<string, number>;
    match_score_distribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    year_distribution: Record<string, number>;
    department_distribution: Record<string, number>;
    skills_analysis: {
      most_common_skills: Record<string, number>;
      average_skill_count: number;
    };
    academic_stats: {
      average_gpa: number;
      average_ats_score: number;
      internship_percentage: number;
    };
  };
  pipeline_metrics: {
    conversion_rates: Record<string, number>;
    top_performers: Array<{
      candidate_id: string;
      student_id: string;
      match_score: number;
      status: string;
      skills_count: number;
      gpa?: string;
      year?: string;
    }>;
  };
}

interface CandidateMatchingSystemProps {
  sessionId: string;
  candidates: SessionCandidate[];
  onStatusUpdate: (candidateId: string, status: string, notes?: string) => void;
  onRefreshMatches: () => void;
}

export default function CandidateMatchingSystem({ 
  sessionId, 
  candidates, 
  onStatusUpdate,
  onRefreshMatches 
}: CandidateMatchingSystemProps) {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkNotes, setBulkNotes] = useState<string>('');
  const [detailedAnalysis, setDetailedAnalysis] = useState<DetailedAnalysis | null>(null);
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter candidates based on selected status
  const filteredCandidates = candidates.filter(candidate => 
    selectedStatus === 'all' || candidate.status === selectedStatus
  ).filter(candidate => candidate.status !== 'applied'); // Exclude applied status per requirement

  // Sort candidates by match score (highest first)
  const sortedCandidates = [...filteredCandidates].sort((a, b) => b.match_score - a.match_score);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'hired': return 'default';
      case 'shortlisted': return 'secondary';  
      case 'waitlisted': return 'outline';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hired': return <UserCheck className="w-4 h-4" />;
      case 'shortlisted': return <Star className="w-4 h-4" />;
      case 'waitlisted': return <Clock className="w-4 h-4" />;
      case 'rejected': return <UserX className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Good Match';
    if (score >= 70) return 'Fair Match';
    return 'Poor Match';
  };

  const handleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedCandidates.length === 0) {
      toast({
        title: "Error",
        description: "Please select candidates and a status",
        variant: "destructive"
      });
      return;
    }

    try {
      const updates = selectedCandidates.map(candidateId => ({
        candidate_id: candidateId,
        status: bulkStatus,
        notes: bulkNotes
      }));

      const response = await fetch('/bulk-update-candidate-status/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        toast({
          title: "Success",
          description: `Updated ${data.updated_count} candidates successfully`,
        });
        
        // Update individual candidates
        selectedCandidates.forEach(candidateId => {
          onStatusUpdate(candidateId, bulkStatus, bulkNotes);
        });
        
        setSelectedCandidates([]);
        setBulkStatus('');
        setBulkNotes('');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update candidate statuses",
        variant: "destructive"
      });
    }
  };

  const fetchDetailedAnalysis = async (studentId: string) => {
    setIsLoadingAnalysis(true);
    try {
      const response = await fetch(`/detailed-match-analysis/${sessionId}/${studentId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setDetailedAnalysis(data.analysis);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load detailed analysis",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const fetchSessionAnalytics = async () => {
    try {
      const response = await fetch(`/session-analytics/${sessionId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setAnalytics(data.analytics);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load session analytics",
        variant: "destructive"
      });
    }
  };

  const handleRefreshMatches = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshMatches();
      toast({
        title: "Success",
        description: "Candidate matches refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh matches",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load analytics on component mount
  useEffect(() => {
    fetchSessionAnalytics();
  }, [sessionId]);

  // Status distribution for quick stats (excluding applied)
  const statusCounts = candidates.filter(c => c.status !== 'applied').reduce((acc, candidate) => {
    acc[candidate.status] = (acc[candidate.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Candidates</p>
                <p className="text-2xl font-bold text-blue-800">{candidates.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Shortlisted</p>
                <p className="text-2xl font-bold text-green-800">{statusCounts.shortlisted || 0}</p>
              </div>
              <Star className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Waitlisted</p>
                <p className="text-2xl font-bold text-yellow-800">{statusCounts.waitlisted || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Hired</p>
                <p className="text-2xl font-bold text-purple-800">{statusCounts.hired || 0}</p>
              </div>
              <UserCheck className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold text-red-800">{statusCounts.rejected || 0}</p>
              </div>
              <UserX className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="candidates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="candidates" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Candidates</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="space-y-4">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Candidate Management</span>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshMatches}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Matches
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Candidates</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="waitlisted">Waitlisted</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-sm text-muted-foreground">
                  Showing {sortedCandidates.length} of {candidates.filter(c => c.status !== 'applied').length} candidates
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedCandidates.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <div className="flex items-center space-x-4">
                      <span>{selectedCandidates.length} candidates selected</span>
                      <Select value={bulkStatus} onValueChange={setBulkStatus}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Set status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shortlisted">Shortlist</SelectItem>
                          <SelectItem value="waitlisted">Waitlist</SelectItem>
                          <SelectItem value="hired">Hire</SelectItem>
                          <SelectItem value="rejected">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Add notes (optional)"
                        value={bulkNotes}
                        onChange={(e) => setBulkNotes(e.target.value)}
                        className="w-64 h-8"
                      />
                      <Button onClick={handleBulkStatusUpdate} size="sm">
                        Update Selected
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedCandidates([])}
                      >
                        Clear
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Candidates List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCandidates.map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-md transition-shadow relative">
                {/* Selection Checkbox - Top Right */}
                <div className="absolute top-3 right-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(candidate.id)}
                    onChange={() => handleCandidateSelection(candidate.id)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>

                <CardContent className="p-6">
                  {/* Profile Section */}
                  <div className="flex items-center space-x-4 mb-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-glow">
                      {candidate.student?.profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </div>
                    
                    {/* Name and Match Score */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {candidate.student?.profile?.full_name || 'Unknown'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Year {candidate.student?.year || 'N/A'} • {candidate.student?.department || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${getMatchScoreColor(candidate.match_score)}`}>
                            {candidate.match_score}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getMatchScoreLabel(candidate.match_score)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <Badge variant={getStatusBadgeVariant(candidate.status)} className="text-sm">
                      {getStatusIcon(candidate.status)}
                      <span className="ml-1 capitalize">{candidate.status}</span>
                    </Badge>
                  </div>

                  {/* Key Info Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-primary" />
                      <span>GPA: {candidate.student?.gpa || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <span>Internship: Available</span>
                    </div>
                  </div>

                  {/* Skills Tags */}
                  {candidate.student?.skills && candidate.student.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {candidate.student.skills.slice(0, 6).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                            {skill}
                          </Badge>
                        ))}
                        {candidate.student.skills.length > 6 && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            +{candidate.student.skills.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {candidate.recruiter_notes && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        {candidate.recruiter_notes}
                      </p>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <Progress 
                      value={candidate.match_score} 
                      className="w-full h-2"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fetchDetailedAnalysis(candidate.student_id)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Analyze
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Detailed Match Analysis - {candidate.student?.profile?.full_name}
                          </DialogTitle>
                        </DialogHeader>
                        {isLoadingAnalysis ? (
                          <div className="flex items-center justify-center p-8">
                            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                            Loading detailed analysis...
                          </div>
                        ) : detailedAnalysis && (
                          <DetailedAnalysisView analysis={detailedAnalysis} />
                        )}
                      </DialogContent>
                    </Dialog>

                    <Select 
                      value={candidate.status} 
                      onValueChange={(value) => onStatusUpdate(candidate.id, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="waitlisted">Waitlisted</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}

            {sortedCandidates.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No candidates found for the selected filter.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics ? (
            <SessionAnalyticsView analytics={analytics} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-4" />
                <p>Loading analytics...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Detailed Analysis Component
function DetailedAnalysisView({ analysis }: { analysis: DetailedAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Match Score</span>
            <div className="text-3xl font-bold text-primary">
              {analysis.overall_score}%
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={analysis.overall_score} className="w-full h-3" />
        </CardContent>
      </Card>

      {/* Component Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Skills Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Skills Match ({analysis.skills_analysis.weight}%)</span>
              <Badge variant="secondary">{analysis.skills_analysis.score.toFixed(1)}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={analysis.skills_analysis.score} />
            
            {analysis.skills_analysis.matched_skills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">✓ Matched Skills:</p>
                <div className="space-y-1">
                  {analysis.skills_analysis.matched_skills.map((match, i) => (
                    <div key={i} className="text-xs bg-green-50 p-2 rounded">
                      <span className="font-medium">{match.required}</span> → {match.student_has}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.skills_analysis.missing_skills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">✗ Missing Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.skills_analysis.missing_skills.map((skill, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Education Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5" />
              <span>Education ({analysis.education_analysis.weight}%)</span>
              <Badge variant="secondary">{analysis.education_analysis.score.toFixed(1)}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={analysis.education_analysis.score} />
            
            {analysis.education_analysis.requirements_met.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">✓ Requirements Met:</p>
                <div className="space-y-1">
                  {analysis.education_analysis.requirements_met.map((req, i) => (
                    <div key={i} className="text-xs bg-green-50 p-2 rounded">
                      {req.required}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.education_analysis.requirements_not_met.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">✗ Requirements Not Met:</p>
                <div className="space-y-1">
                  {analysis.education_analysis.requirements_not_met.map((req, i) => (
                    <div key={i} className="text-xs bg-red-50 p-2 rounded">
                      {req}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5" />
              <span>Experience ({analysis.experience_analysis.weight}%)</span>
              <Badge variant="secondary">{analysis.experience_analysis.score.toFixed(1)}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={analysis.experience_analysis.score} />
            
            <div className="text-sm space-y-1">
              <div>Required: {analysis.experience_analysis.required_years} years</div>
              <div>Student has: {analysis.experience_analysis.student_experience_years} years</div>
              <div>Internship: {analysis.experience_analysis.has_internship ? '✓ Yes' : '✗ No'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Academic ({analysis.academic_analysis.weight}%)</span>
              <Badge variant="secondary">{analysis.academic_analysis.score.toFixed(1)}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={analysis.academic_analysis.score} />
            
            <div className="text-sm space-y-1">
              <div>Required CGPA: {analysis.academic_analysis.required_cgpa || 'None'}</div>
              <div>Student CGPA: {analysis.academic_analysis.student_gpa || 'Not provided'}</div>
              <div className={analysis.academic_analysis.meets_requirement ? 'text-green-600' : 'text-red-600'}>
                {analysis.academic_analysis.meets_requirement ? '✓ Meets requirement' : '✗ Below requirement'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Session Analytics Component
function SessionAnalyticsView({ analytics }: { analytics: SessionAnalytics }) {
  return (
    <div className="space-y-6">
      {/* Session Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{analytics.session_info.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-semibold">{analytics.session_info.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target Hires</p>
              <p className="font-semibold">{analytics.session_info.target_hires}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Hires</p>
              <p className="font-semibold">{analytics.session_info.current_hires}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Candidates</p>
              <p className="font-semibold">{analytics.candidate_stats.total_candidates}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Match Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.candidate_stats.match_score_distribution.excellent}
              </div>
              <div className="text-sm text-muted-foreground">Excellent (90-100%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.candidate_stats.match_score_distribution.good}
              </div>
              <div className="text-sm text-muted-foreground">Good (80-89%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.candidate_stats.match_score_distribution.fair}
              </div>
              <div className="text-sm text-muted-foreground">Fair (70-79%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {analytics.candidate_stats.match_score_distribution.poor}
              </div>
              <div className="text-sm text-muted-foreground">Poor (&lt;70%)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.candidate_stats.academic_stats.average_gpa.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average ATS Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.candidate_stats.academic_stats.average_ats_score.toFixed(0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Internship %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.candidate_stats.academic_stats.internship_percentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Most Common Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(analytics.candidate_stats.skills_analysis.most_common_skills)
              .slice(0, 10)
              .map(([skill, count]) => (
                <div key={skill} className="flex items-center justify-between">
                  <span className="text-sm">{skill}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${(count / Math.max(...Object.values(analytics.candidate_stats.skills_analysis.most_common_skills))) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.pipeline_metrics.top_performers.map((performer, i) => (
              <div key={performer.candidate_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-bold text-primary">#{i + 1}</div>
                  <div>
                    <div className="font-medium">Match Score: {performer.match_score}%</div>
                    <div className="text-sm text-muted-foreground">
                      {performer.skills_count} skills • Year {performer.year} • GPA {performer.gpa}
                    </div>
                  </div>
                </div>
                <Badge variant={performer.status === 'hired' ? 'default' : 'secondary'}>
                  {performer.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
