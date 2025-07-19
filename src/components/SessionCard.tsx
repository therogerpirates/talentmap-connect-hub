import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Target, Eye, Plus, TrendingUp } from 'lucide-react';
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
      case 'active': return 'glass-panel border-accent/40 text-accent-foreground shadow-glow';
      case 'paused': return 'glass-panel border-yellow-500/40 text-foreground';
      case 'completed': return 'glass-panel border-primary/40 text-primary-foreground';
      case 'closed': return 'glass-panel border-muted/40 text-muted-foreground';
      default: return 'glass-panel border-muted/40 text-muted-foreground';
    }
  };

  return (
    <Card className="glass-card hover-lift border-0 shadow-glass overflow-hidden group relative fade-in-up">
      <div className="absolute inset-0 gradient-glass opacity-30 rounded-lg"></div>
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold mb-3 line-clamp-1 group-hover:text-primary transition-colors duration-300">
              {session.title}
            </CardTitle>
            <div className="flex items-center flex-wrap gap-2">
              <Badge className={`${getStatusColor(session.status)} backdrop-blur-md group-hover:scale-105 transition-transform duration-300`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
              <Badge variant="outline" className="glass-button border-primary/30 text-primary">
                {session.role}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 relative z-10">
        {session.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {session.description}
          </p>
        )}
        
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary group-hover:animate-pulse" />
              <span className="text-muted-foreground font-medium">Progress</span>
            </div>
            <span className="font-bold text-lg text-foreground">
              {session.current_hires}/{session.target_hires}
            </span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full gradient-primary transition-all duration-1000 ease-out shadow-glow relative"
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2 glass-button p-2 rounded-lg">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Created {new Date(session.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2 glass-button p-2 rounded-lg">
              <Users className="h-4 w-4 text-primary" />
              <span>{progress.toFixed(0)}% Complete</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/sessions/${session.id}`)}
            className="flex-1 glass-button border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {onAddCandidates && (
            <Button 
              size="sm" 
              onClick={() => onAddCandidates(session.id)}
              className="gradient-primary text-white border-0 shadow-glow hover:scale-105 transition-all duration-300"
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