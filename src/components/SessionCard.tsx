import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Target, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SessionCardProps {
  session: any;
  onAddCandidates?: (sessionId: string) => void;
}

export const SessionCard = ({ session, onAddCandidates }: SessionCardProps) => {
  const navigate = useNavigate();
  const progress = session.target_hires > 0 ? (session.current_hires / session.target_hires) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'paused': return 'bg-yellow-500 text-white';
      case 'completed': return 'bg-blue-500 text-white';
      case 'closed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="glass-card hover-lift border-0 shadow-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2 line-clamp-1">
              {session.title}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(session.status)}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {session.role}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {session.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {session.description}
          </p>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Progress</span>
            </div>
            <span className="font-medium">
              {session.current_hires}/{session.target_hires}
            </span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full gradient-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Created {new Date(session.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{progress.toFixed(0)}% Complete</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/session/${session.id}`)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {onAddCandidates && (
            <Button 
              size="sm" 
              onClick={() => onAddCandidates(session.id)}
              className="gradient-primary text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Candidates
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};