
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock login logic - replace with Supabase authentication
    if (formData.email && formData.password) {
      // Simulate different user types for demo
      if (formData.email.includes('admin') || formData.email.includes('recruiter')) {
        toast({
          title: "Welcome back!",
          description: "Redirecting to admin dashboard..."
        });
        navigate('/admin-dashboard');
      } else {
        toast({
          title: "Welcome back!",
          description: "Redirecting to student dashboard..."
        });
        navigate('/student-dashboard');
      }
    } else {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">TalentMap</span>
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your TalentMap account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="mt-1"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5"
                size="lg"
              >
                Sign In
              </Button>
            </form>
            
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    Create one here
                  </Link>
                </p>
              </div>
              
              {/* Demo credentials */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 font-medium mb-2">Demo Credentials:</p>
                <p className="text-xs text-gray-600">Student: student@demo.com</p>
                <p className="text-xs text-gray-600">Recruiter: admin@demo.com</p>
                <p className="text-xs text-gray-600">Password: any password</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
