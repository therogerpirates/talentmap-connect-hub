import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCreateHiringSession } from '@/hooks/useHiringSessions';
import { Layout } from '@/components/Layout';
import { JobExtractor } from '@/components/JobExtractor';
import { FileText, Brain, ArrowLeft } from 'lucide-react';

interface ExtractedJobInfo {
  required_skills: string[];
  eligibility_criteria: {
    education: string[];
    experience_years: number;
    cgpa_minimum: number;
    specific_requirements: string[];
  };
  eligible_years: number[];
}

export default function CreateSession() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createSession = useCreateHiringSession();

  const [formData, setFormData] = useState({
    title: '',
    role: '',
    description: '',
    target_hires: 1,
  });
  
  const [extractedJobInfo, setExtractedJobInfo] = useState<ExtractedJobInfo | null>(null);

  const handleJobExtraction = (extractedData: ExtractedJobInfo) => {
    setExtractedJobInfo(extractedData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare requirements and eligibility_criteria based on extracted data
      const requirements = extractedJobInfo ? {
        required_skills: extractedJobInfo.required_skills
      } : {};
      
      const eligibility_criteria = extractedJobInfo ? {
        ...extractedJobInfo.eligibility_criteria,
        eligible_years: extractedJobInfo.eligible_years
      } : {};

      await createSession.mutateAsync({
        title: formData.title,
        role: formData.role,
        description: formData.description,
        target_hires: formData.target_hires,
        requirements,
        eligibility_criteria,
      });

      toast({
        title: "Success",
        description: "Hiring session created successfully with extracted requirements",
      });

      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create hiring session",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin-dashboard')} 
            className="mb-4 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
              Create Hiring Session
            </h1>
            <p className="text-muted-foreground text-lg">
              Use AI to extract requirements from your job description and create targeted hiring sessions
            </p>
          </div>
        </div>

        <Tabs defaultValue="extract" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="extract" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>AI Job Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Manual Entry</span>
            </TabsTrigger>
          </TabsList>

          {/* AI-Powered Job Analysis Tab */}
          <TabsContent value="extract" className="space-y-6">
            <JobExtractor 
              onExtraction={handleJobExtraction}
              initialDescription={formData.description}
            />
            
            {/* Session Details Form - only show after extraction or when user switches tabs */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Session Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Software Engineer Internship"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="e.g., Software Engineer"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="target_hires">Target Number of Hires</Label>
                    <Input
                      id="target_hires"
                      type="number"
                      min="1"
                      value={formData.target_hires}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_hires: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      disabled={createSession.isPending}
                      className="gradient-primary text-white flex-1"
                    >
                      {createSession.isPending ? 'Creating...' : 'Create Session'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate('/admin-dashboard')}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="space-y-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Manual Session Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title-manual">Session Title *</Label>
                      <Input
                        id="title-manual"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Software Engineer Internship"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role-manual">Role *</Label>
                      <Input
                        id="role-manual"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="e.g., Software Engineer"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description-manual">Description</Label>
                    <Textarea
                      id="description-manual"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the role and requirements..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="target_hires-manual">Target Number of Hires</Label>
                    <Input
                      id="target_hires-manual"
                      type="number"
                      min="1"
                      value={formData.target_hires}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_hires: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      disabled={createSession.isPending}
                      className="gradient-primary text-white flex-1"
                    >
                      {createSession.isPending ? 'Creating...' : 'Create Session'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate('/admin-dashboard')}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}