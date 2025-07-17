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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="glass-card hover-lift border-0 shadow-card overflow-hidden">
          <CardContent className="p-6 relative">
            <div className={`absolute inset-0 ${stat.gradient} opacity-5`} />
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.title}
                </p>
                <div className="flex items-baseline space-x-2 mb-2">
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {stat.change}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
              <div className={`${stat.gradient} p-3 rounded-xl shadow-glow`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};