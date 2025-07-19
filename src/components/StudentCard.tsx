import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Mail, User, GraduationCap, Award, Eye } from 'lucide-react';
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
}

interface StudentCardProps {
  student: Student;
  isShortlisted?: boolean;
  onShortlistToggle?: () => void;
}

const StudentCard = ({ student, isShortlisted, onShortlistToggle }: StudentCardProps) => {
  const navigate = useNavigate();
  
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
