import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCreateHiringSession } from '@/hooks/useHiringSessions';
import { Layout } from '@/components/Layout';

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
      await createSession.mutateAsync({
        title: formData.title,
        role: formData.role,
        description: formData.description,
        target_hires: formData.target_hires,
        eligibility_criteria: {},
        requirements: {},
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
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Hiring Session</CardTitle>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the role and requirements..."
                  rows={3}
                />
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
                <Button type="submit" disabled={createSession.isPending}
                        className="gradient-primary text-white border-0 shadow-glow hover:scale-105 transition-all duration-300 px-5 py-4 text-lg font-semibold">
                  {createSession.isPending ? 'Creating...' : 'Create Session'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin-dashboard')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}