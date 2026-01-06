import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, LogOut, Plus, Sparkles, Users, Calendar, Search, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useHiringSessions } from '@/hooks/useHiringSessions';
import { useAddCandidateToSession } from '@/hooks/useSessionCandidates';
import { DashboardStats } from '@/components/DashboardStats';
import { SessionCard } from '@/components/SessionCard';
import { StudentSearch } from '@/components/StudentSearch';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { signOut, profile, user } = useAuth();
  const { toast } = useToast();
  const { data: sessions } = useHiringSessions();
  const addCandidate = useAddCandidateToSession();
  const [fullName, setFullName] = useState('');
  const [selectedSessionForCandidates, setSelectedSessionForCandidates] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('sessions');

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (data?.full_name) {
          setFullName(data.full_name);
        }
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account."
    });
  };

  const handleAddCandidatesToSession = (sessionId: string) => {
    setSelectedSessionForCandidates(sessionId);
    setSelectedTab('search');
  };

  const handleAddToSession = async (studentId: string, sessionId: string) => {
    try {
      await addCandidate.mutateAsync({
        sessionId,
        studentId,
        matchScore: 75 // Default match score, can be calculated later
      });

      toast({
        title: "Candidate Added Successfully",
        description: "The student has been added to the hiring session."
      });
    } catch (error: any) {
      toast({
        title: "Error Adding Candidate",
        description: error.message || "Failed to add candidate to session.",
        variant: "destructive"
      });
    }
  };

  const activeSessions = sessions?.filter(s => s.status === 'active') || [];
  const recentSessions = sessions?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 gradient-primary opacity-10 rounded-full blur-3xl float-animation"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 gradient-accent opacity-10 rounded-full blur-3xl float-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 gradient-glass opacity-20 rounded-full blur-2xl float-animation" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Modern Header */}
      <header className="glass-panel backdrop-blur-xl border-b border-white/15 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  TalentMap
                </span>
                <div className="text-xs text-muted-foreground">Recruiter Portal</div>
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {fullName?.split(' ').map(n => n[0]).join('') || profile?.full_name?.split(' ').map(n => n[0]).join('') || 'R'}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{fullName || profile?.full_name}</div>
                  <div className="text-xs text-muted-foreground">Recruiter</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12 relative overflow-hidden fade-in-up py-10">
            <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">

              {/* Title & Subtitle */}
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <Sparkles className="h-8 w-8 text-blue-500 animate-pulse" />
                  <h1 className="text-5xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                    Welcome back, {fullName?.split(' ')[0] || 'Recruiter'}!
                  </h1>
                </div>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  Streamline your hiring process with AI-powered candidate matching and intelligent analytics. Discover exceptional talent and build your dream team.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => navigate('/create-session')}
                  className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none transition-all duration-300 px-8 py-6 text-lg font-semibold rounded-xl min-w-[240px]"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Session
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setSelectedTab('search')}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 px-8 py-6 text-lg font-semibold rounded-xl min-w-[240px] shadow-sm"
                >
                  <Search className="w-5 h-5 mr-2 text-blue-500" />
                  Search Candidates
                </Button>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-100 dark:border-blue-800/50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">
                    {activeSessions.length} active sessions
                  </span>
                </div>

                <div className="flex items-center space-x-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="mb-12 slide-in-left" style={{ animationDelay: '0.2s' }}>
            <DashboardStats sessions={sessions} />
          </div>

          {/* Main Content Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50 p-1 h-12">
                <TabsTrigger value="sessions" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Users className="w-4 h-4 mr-2" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger value="search" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </TabsTrigger>
              </TabsList>

              {selectedTab === 'search' && activeSessions.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Add candidates to:</span>
                  <Select
                    value={selectedSessionForCandidates || ''}
                    onValueChange={setSelectedSessionForCandidates}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a session" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.title} - {session.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Overview removed - Sessions and Search only */}

            <TabsContent value="sessions" className="space-y-6">
              <Card className="glass-card border-0 shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold">All Hiring Sessions</CardTitle>
                      <CardDescription>Manage and track your active and upcoming sessions</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" onClick={() => setSelectedTab('search')}>
                        <Search className="w-4 h-4 mr-2" />
                        Quick Search
                      </Button>
                      <Button onClick={() => navigate('/create-session')} className="gradient-primary text-white border-0">
                        <Plus className="w-4 h-4 mr-2" />
                        New Session
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {sessions && sessions.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          onAddCandidates={handleAddCandidatesToSession}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
                      <p className="text-muted-foreground mb-4">Create your first hiring session to start recruiting</p>
                      <Button onClick={() => navigate('/create-session')} className="gradient-primary text-white border-0">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Session
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <Card className="glass-card border-0 shadow-card">
                <CardContent className="pt-6">
                  <StudentSearch
                    onAddToSession={selectedSessionForCandidates ? handleAddToSession : undefined}
                    selectedSessionId={selectedSessionForCandidates || undefined}
                    activeSessions={activeSessions}
                    onSessionSelect={setSelectedSessionForCandidates}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div >
  );
};

export default AdminDashboard;