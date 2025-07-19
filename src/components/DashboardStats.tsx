import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Target, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface DashboardStatsProps {
  sessions: any[] | undefined;
}

export const DashboardStats = ({ sessions }: DashboardStatsProps) => {
  const activeSessions = sessions?.filter(s => s.status === 'active').length || 0;
  const totalSessions = sessions?.length || 0;
  const totalHires = sessions?.reduce((sum, s) => sum + s.current_hires, 0) || 0;
  const totalTargets = sessions?.reduce((sum, s) => sum + s.target_hires, 0) || 0;
  const completedSessions = sessions?.filter(s => s.current_hires >= s.target_hires).length || 0;
  const hireRate = totalTargets > 0 ? Math.round((totalHires / totalTargets) * 100) : 0;

  const stats = [
    {
      title: 'Active Sessions',
      value: activeSessions,
      icon: Calendar,
      gradient: 'gradient-primary',
      change: '+12%',
      description: 'Currently hiring'
    },
    {
      title: 'Total Sessions',
      value: totalSessions,
      icon: Target,
      gradient: 'gradient-secondary',
      change: '+8%',
      description: 'All time sessions'
    },
    {
      title: 'Successful Hires',
      value: totalHires,
      icon: Users,
      gradient: 'gradient-accent',
      change: '+25%',
      description: 'Students hired'
    },
    {
      title: 'Hire Rate',
      value: `${hireRate}%`,
      icon: TrendingUp,
      gradient: 'gradient-primary',
      change: '+5%',
      description: 'Success rate'
    },
    {
      title: 'Completed Sessions',
      value: completedSessions,
      icon: CheckCircle,
      gradient: 'gradient-secondary',
      change: '+3%',
      description: 'Target achieved'
    },
    {
      title: 'Avg. Time to Hire',
      value: '12 days',
      icon: Clock,
      gradient: 'gradient-accent',
      change: '-2 days',
      description: 'Average duration'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="glass-panel hover-lift border-0 shadow-glass overflow-hidden group relative fade-in-up" style={{animationDelay: `${0.1 * index}s`}}>
          <CardContent className="p-8 relative">
            <div className={`absolute inset-0 ${stat.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {stat.title}
                </p>
                <div className="flex items-baseline space-x-3 mb-3">
                  <p className="text-4xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                    {stat.value}
                  </p>
                  <span className="text-sm font-medium text-accent pulse-glow">
                    {stat.change}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </div>
              <div className={`${stat.gradient} p-4 rounded-2xl shadow-glow group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};