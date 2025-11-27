import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Mail, User, GraduationCap, Award, Eye, ExternalLink, Copy } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: number;
  name: string;
  year: string;
  department: string;
  skills: string[];
  gpa: string;
  resumeUrl: string;
  email: string;
  matchScore: number;
  linkedin_url?: string | null;
  github_url?: string | null;
  leetcode_url?: string | null;
}

interface StudentCardProps {
  student: Student;
  isShortlisted?: boolean;
  onShortlistToggle?: () => void;
}

const StudentCard = ({ student, isShortlisted, onShortlistToggle }: StudentCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'glass-panel border-accent/30 text-accent-foreground shadow-glow';
    if (score >= 80) return 'glass-panel border-primary/30 text-primary-foreground';
    if (score >= 70) return 'glass-panel border-yellow-500/30 text-foreground';
    return 'glass-panel border-muted/30 text-muted-foreground';
  };

  const handleViewDetails = () => {
    navigate(`/admin/students/${student.id}`);
  };

  return (
    <Card className="glass-card hover-lift transition-all duration-500 border-0 overflow-hidden group">
      <CardContent className="p-6 relative">
        <div className="absolute inset-0 gradient-glass opacity-50 rounded-lg"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-glow group-hover:scale-110 transition-transform duration-300">
                {student.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">{student.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span>{student.year}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <User className="w-4 h-4 text-primary" />
                    <span>{student.department}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Award className="w-4 h-4 text-primary" />
                    <span>GPA: {student.gpa}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md ${getMatchScoreColor(student.matchScore)} group-hover:scale-105 transition-transform duration-300`}>
              {student.matchScore}% Match
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
              Skills & Technologies
            </h4>
            <div className="flex flex-wrap gap-2">
              {student.skills.slice(0, 4).map((skill, index) => (
                <Badge key={index} variant="secondary" className="glass-button border-primary/20 text-foreground hover:border-primary/40 transition-all duration-300">
                  {skill}
                </Badge>
              ))}
              {student.skills.length > 4 && (
                <Badge variant="outline" className="glass-button border-muted/30">
                  +{student.skills.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4 text-primary" />
              <span className="truncate max-w-[200px]">{student.email}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewDetails}
                className="glass-button border-primary/30 text-primary hover:bg-primary/10 transition-all duration-300"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass-button border-primary/30 hover:bg-primary/10 transition-all duration-300"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Analyze
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Candidate Profiles</DialogTitle>
                    <DialogDescription>
                      Quick access to public profiles extracted from the resume.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 mt-2">
                    {/* LinkedIn */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-md gradient-primary flex items-center justify-center text-white">
                          <ExternalLink className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">LinkedIn</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {student.linkedin_url || student.linkedin || 'Not available'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {student.linkedin_url ? (
                          <>
                            <a href={student.linkedin_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center">
                              Open
                            </a>
                            <Button variant="ghost" size="sm" onClick={async () => { await navigator.clipboard.writeText(student.linkedin_url || ''); toast({ title: 'Copied', description: 'LinkedIn URL copied' }); }}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* GitHub */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-md bg-gray-800 flex items-center justify-center text-white">
                          <ExternalLink className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">GitHub</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {student.github_url || student.github || 'Not available'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {student.github_url ? (
                          <>
                            <a href={student.github_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center">
                              Open
                            </a>
                            <Button variant="ghost" size="sm" onClick={async () => { await navigator.clipboard.writeText(student.github_url || ''); toast({ title: 'Copied', description: 'GitHub URL copied' }); }}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* LeetCode */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-md bg-slate-800 flex items-center justify-center text-white">
                          <ExternalLink className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">LeetCode</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {student.leetcode_url || 'Not available'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {student.leetcode_url ? (
                          <>
                            <a href={student.leetcode_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center">
                              Open
                            </a>
                            <Button variant="ghost" size="sm" onClick={async () => { await navigator.clipboard.writeText(student.leetcode_url || ''); toast({ title: 'Copied', description: 'LeetCode URL copied' }); }}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                size="sm" 
                className="glass-button border-muted/30 hover:border-primary/50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Resume
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentCard;
