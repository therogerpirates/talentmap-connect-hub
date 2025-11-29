import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Download,
  Copy,
  X
} from "lucide-react";

// Minimal types used by this component
type DetailedAnalysis = {
  overall_score: number;
  skills_analysis: {
    score: number;
    weight: number;
    matched_skills: Array<{ required: string; student_has: string }>;
    missing_skills: string[];
  };
  education_analysis: {
    score: number;
    weight: number;
    requirements_met: Array<{ required: string }>;
    requirements_not_met: string[];
  };
  experience_analysis: {
    score: number;
    weight: number;
    required_years: number;
    student_experience_years: number;
    has_internship: boolean;
  };
  academic_analysis: {
    score: number;
    weight: number;
    required_cgpa?: number;
    student_gpa?: number;
    meets_requirement: boolean;
  };
  recommendations: string[];
};

type SessionAnalytics = {
  session_info: {
    title: string;
    role?: string;
    target_hires?: number;
    current_hires?: number;
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
};

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
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dialogOpenId, setDialogOpenId] = useState<string | null>(null);

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

  // Status distribution for quick stats (excluding applied)
  const statusCounts = candidates.filter(c => c.status !== 'applied').reduce((acc, candidate) => {
    acc[candidate.status] = (acc[candidate.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Tabs for different views */}
      <Tabs defaultValue="candidates" className="w-full">

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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setDialogOpenId(candidate.id);
                        fetchDetailedAnalysis(candidate.student_id);
                      }}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Analyze
                    </Button>

                    <Dialog open={dialogOpenId === candidate.id} onOpenChange={(open) => { if(!open) { setDialogOpenId(null); setDetailedAnalysis(null); } }}>
                      <DialogPortal>
                        <DialogOverlay />
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                          <div className="max-w-7xl w-full max-h-[95vh] overflow-auto glass-panel rounded-lg p-6 flex flex-col bg-blue-50">
                          <div className="flex items-center justify-between mb-6 relative">
                              <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-md gradient-primary flex items-center justify-center text-white font-semibold text-lg">{(candidate.student as any)?.profile?.full_name?.split(' ').map((n:string)=>n[0]).join('') || 'U'}</div>
                              <div>
                                <div className="text-2xl font-bold text-foreground">{(candidate.student as any)?.profile?.full_name || 'Unknown'}</div>
                                <div className="text-sm text-foreground">Year {(candidate.student as any)?.year || 'N/A'} • {(candidate.student as any)?.department || 'N/A'}</div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Button variant="ghost" onClick={() => { setDialogOpenId(null); setDetailedAnalysis(null); }}><X></X></Button>
                            </div>
                            <button
                              aria-label="Close"
                              onClick={() => { setDialogOpenId(null); setDetailedAnalysis(null); }}
                              className="absolute right-4 top-4 rounded-md p-2 hover:bg-white/10"
                            >
                            </button>
                          </div>

                          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Left column - contact & profiles */}
                            <div className="lg:col-span-1 p-4 rounded-lg glass-panel border border-white/10">
                              <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium mb-1 text-foreground">Contact</div>
                                    <div className="text-sm text-foreground">{(candidate.student as any)?.profile?.email || 'N/A'}</div>
                                  </div>

                                <div>
                                  <div className="text-sm font-medium mb-1">Quick Stats</div>
                                  <div className="text-sm">GPA: {(candidate.student as any)?.gpa || 'N/A'}</div>
                                  <div className="text-sm">Match: {candidate.match_score}%</div>
                                </div>

                                <div>
                                  <div className="text-sm font-medium mb-2 text-foreground">External Profiles</div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2"><svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V24h-4V8zm7 0h3.7v2.2h.1c.5-.9 1.8-1.8 3.6-1.8 3.9 0 4.7 2.6 4.7 6V24h-4v-7.4c0-1.8 0-4.1-2.5-4.1-2.5 0-2.9 2-2.9 4v7.5h-4V8z"/></svg> <span className="text-sm">LinkedIn</span></div>
                                      <div className="flex items-center gap-2">
                                        {(candidate.student as any)?.linkedin_url ? (
                                          <>
                                            <a href={(candidate.student as any).linkedin_url} target="_blank" rel="noreferrer" className="text-primary text-sm">Open</a>
                                            <Button variant="ghost" size="sm" onClick={async ()=>{ await navigator.clipboard.writeText((candidate.student as any).linkedin_url); toast({ title: 'Copied', description: 'LinkedIn URL copied' }); }}><Copy className="w-4 h-4"/></Button>
                                          </>
                                        ) : (<span className="text-xs text-muted-foreground">—</span>)}
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5C5.7.5.6 5.6.6 11.9c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.9c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.6.7 2 1.2.1-.8.4-1.4.8-1.7-2.6-.3-5.4-1.3-5.4-6A4.6 4.6 0 0 1 6.8 7c-.3-.7-1-2.8.1-5.8 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 1.2 3 .4 5.1.1 5.8a4.6 4.6 0 0 1 1.2 3.2c0 4.7-2.8 5.7-5.4 6 .4.4.7 1 .7 2v3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.4 5.6 18.3.5 12 .5z"/></svg> <span className="text-sm">GitHub</span></div>
                                      <div className="flex items-center gap-2">
                                        {(candidate.student as any)?.github_url ? (
                                          <>
                                            <a href={(candidate.student as any).github_url} target="_blank" rel="noreferrer" className="text-primary text-sm">Open</a>
                                            <Button variant="ghost" size="sm" onClick={async ()=>{ await navigator.clipboard.writeText((candidate.student as any).github_url); toast({ title: 'Copied', description: 'GitHub URL copied' }); }}><Copy className="w-4 h-4"/></Button>
                                          </>
                                        ) : (<span className="text-xs text-muted-foreground">—</span>)}
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2"><svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.5 6.5L17 3 7 13h3l10.5-6.5zM6 15v6h6v-1H7v-5H6z"/></svg> <span className="text-sm">LeetCode</span></div>
                                      <div className="flex items-center gap-2">
                                        {(candidate.student as any)?.leetcode_url ? (
                                          <>
                                            <a href={(candidate.student as any).leetcode_url} target="_blank" rel="noreferrer" className="text-primary text-sm">Open</a>
                                            <Button variant="ghost" size="sm" onClick={async ()=>{ await navigator.clipboard.writeText((candidate.student as any).leetcode_url); toast({ title: 'Copied', description: 'LeetCode URL copied' }); }}><Copy className="w-4 h-4"/></Button>
                                          </>
                                        ) : (<span className="text-xs text-muted-foreground">—</span>)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Main column - summary, skills, experience, projects */}
                            <div className="lg:col-span-3 p-4 rounded-lg glass-panel border border-white/8">
                              <div className="space-y-6">
                                <div>
                                  <h4 className="text-lg font-semibold mb-2 text-foreground">Summary</h4>
                                  <p className="text-sm text-foreground">{(candidate.student as any)?.summary || 'No summary available'}</p>
                                </div>

                                <div>
                                  <h4 className="text-lg font-semibold mb-2 text-foreground">Skills</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {Array.isArray((candidate.student as any)?.skills) && (candidate.student as any).skills.length > 0 ? (
                                      (candidate.student as any).skills.map((s:string,i:number)=>(<Badge key={i} variant="secondary">{s}</Badge>))
                                    ) : (
                                      <div className="text-xs text-muted-foreground">No skills listed</div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-lg font-semibold mb-2 text-foreground">Experience & Projects</h4>
                                  <div className="text-sm text-foreground">
                                    {(candidate.student as any)?.projects?.length ? (
                                      (candidate.student as any).projects.map((p:any,i:number)=>(<div key={i} className="mb-2"><div className="font-medium">{p.title}</div><div className="text-xs text-foreground">{p.description}</div></div>))
                                    ) : (
                                      <div className="text-xs text-muted-foreground">No projects listed</div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-lg font-semibold mb-2">Education</h4>
                                  <div className="text-sm text-foreground">{(candidate.student as any)?.education || 'Not provided'}</div>
                                </div>

                                {/* Detailed analysis region */}
                                <div>
                                  <h4 className="text-lg font-semibold mb-2">Detailed Analysis</h4>
                                  {isLoadingAnalysis ? (
                                    <div className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin"/> Loading...</div>
                                  ) : detailedAnalysis ? (
                                    <DetailedAnalysisView analysis={detailedAnalysis} />
                                  ) : (
                                    <div className="text-xs text-muted-foreground">No analysis available</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          </div>
                        </div>
                      </DialogPortal>
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
