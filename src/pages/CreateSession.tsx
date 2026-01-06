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
import { FileText, Brain, ArrowLeft, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

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
    // Auto-fill role if possible or leave for user? 
    // Usually extraction might get role, but for now we keep it manual or from description
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
        description: "Hiring session created successfully",
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
        <div className="container max-w-5xl mx-auto py-8 relative px-4">
          {/* Theme Toggle */}
          <div className="absolute top-4 right-4 z-50">
            <ThemeToggle />
          </div>

          {/* Header */}
          <div className="mb-8 pt-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin-dashboard')}
              className="mb-6 pl-0 hover:bg-transparent hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="text-center space-y-3">
              <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                Create Hiring Session
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                Use AI to extract requirements from your job description and create targeted hiring sessions
              </p>
            </div>
          </div>

          <Tabs defaultValue="extract" className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-2xl grid-cols-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl h-auto">
                <TabsTrigger
                  value="extract"
                  className="py-3 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white font-medium transition-all"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Job Analysis
                </TabsTrigger>
                <TabsTrigger
                  value="manual"
                  className="py-3 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white font-medium transition-all"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>
            </div>

            {/* AI-Powered Tab */}
            <TabsContent value="extract" className="space-y-8 animate-in fade-in-50 duration-500">
              <JobExtractor
                onExtraction={handleJobExtraction}
                initialDescription={formData.description}
              />

              <SessionDetailsForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                isSubmitting={createSession.isPending}
                onCancel={() => navigate('/admin-dashboard')}
              />
            </TabsContent>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="space-y-8 animate-in fade-in-50 duration-500">
              <Card className="bg-white dark:bg-slate-800 border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Manual Entry</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label htmlFor="description-manual">Job Description</Label>
                    <Textarea
                      id="description-manual"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the role and requirements..."
                      className="min-h-[200px] resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>

              <SessionDetailsForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                isSubmitting={createSession.isPending}
                onCancel={() => navigate('/admin-dashboard')}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

// Extracted sub-component for reusability and cleaner code
function SessionDetailsForm({
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  onCancel
}: {
  formData: any,
  setFormData: React.Dispatch<React.SetStateAction<any>>,
  onSubmit: (e: React.FormEvent) => void,
  isSubmitting: boolean,
  onCancel: () => void
}) {
  return (
    <Card className="bg-white dark:bg-slate-800 border-none shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Session Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Session Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Software Engineer Internship"
                required
                className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, role: e.target.value }))}
                placeholder="e.g., Software Engineer"
                required
                className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_hires" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Target Number of Hires</Label>
            <Input
              id="target_hires"
              type="number"
              min="1"
              value={formData.target_hires}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, target_hires: parseInt(e.target.value) || 1 }))}
              className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-between gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-8 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md shadow-blue-200 w-full md:w-auto min-w-[200px]"
            >
              {isSubmitting ? 'Creating...' : 'Create Session'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="h-11 px-6 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}