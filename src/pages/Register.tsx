import { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Eye, EyeOff, User, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

type UserRole = 'student' | 'admin';

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Default to 'student' role if not specified, but verify in Sign Up mode
  const initialRole = (searchParams.get('role') as UserRole) || null; // null triggers role selection first

  // Set initial login state based on path
  const [isLogin, setIsLogin] = useState(location.pathname === '/login'); // Toggle between Login and Register
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(initialRole);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch profile to redirect correctly
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        toast({ title: "Welcome back!", description: "Login successful" });

        // If profile exists and is admin, go to admin dashboard. 
        // Note: Students might not have a 'role' in 'profiles' table if they are in 'students' table.
        // We need a robust check.
        if (profile?.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/student-details');
        }
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!selectedRole) {
      toast({ title: "Error", description: "Please select a role", variant: "destructive" });
      return;
    }
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    console.log("Starting signup for:", formData.email, "as", selectedRole);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: formData.fullName,
            role: selectedRole
          }
        }
      });

      console.log("Supabase signUp response:", { authData, authError });

      if (authError) {
        console.error("Supabase auth error:", authError);
        throw authError;
      }

      if (!authData.user) {
        console.error("No user returned from signUp");
        throw new Error("Account creation failed - no user returned");
      }

      console.log("User created:", authData.user.id);
      console.log("Session exists:", !!authData.session);

      // Check if email verification is required
      if (!authData.session) {
        console.log("No session - email verification likely required");
        toast({
          title: "Check Your Email",
          description: "We sent you a verification link. Please check your email and click the link to verify your account, then log in.",
        });
        setIsLogin(true);
        return;
      }

      // Session exists - try to create profile manually as fallback
      console.log("Session exists, creating profile manually...");

      if (selectedRole === 'student') {
        const { error: profileError } = await supabase.from('students').insert({
          id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          created_at: new Date().toISOString()
        });
        if (profileError) {
          console.error("Manual student profile creation error:", profileError);
          // Don't throw - trigger might have created it already
        } else {
          console.log("Student profile created successfully");
        }
      } else {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          role: 'admin',
          updated_at: new Date().toISOString()
        });
        if (profileError) {
          console.error("Manual admin profile creation error:", profileError);
          // Don't throw - trigger might have created it already
        } else {
          console.log("Admin profile created successfully");
        }
      }

      toast({ title: "Success!", description: "Account created successfully." });
      navigate(selectedRole === 'admin' ? '/admin-dashboard' : '/student-details');

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      handleLogin();
    } else {
      handleSignUp();
    }
  };

  // Render logic for Role Selection
  if (!isLogin && !selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center transition-colors duration-300">
                <BookOpen className="w-6 h-6 text-white dark:text-black transition-colors duration-300" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">TalentMap</span>
            </Link>
          </div>
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Join TalentMap</CardTitle>
              <CardDescription>Choose how you want to use the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setSelectedRole('student')} className="w-full h-24 bg-white hover:bg-gray-50 border-2 border-gray-200" >
                <div className="flex flex-col items-center space-y-2">
                  <User className="w-12 h-12 text-black" />
                  <span className="text-lg font-medium text-black">I am a Student</span>
                </div>
              </Button>
              <Button onClick={() => setSelectedRole('admin')} className="w-full h-24 bg-white hover:bg-gray-50 border-2 border-gray-200">
                <div className="flex flex-col items-center space-y-2">
                  <Briefcase className="w-12 h-12 text-black" />
                  <span className="text-lg font-medium text-black">I am a Recruiter</span>
                </div>
              </Button>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button onClick={() => setIsLogin(true)} className="text-black hover:text-gray-800 font-medium underline">
                    Sign in
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center transition-colors duration-300">
              <BookOpen className="w-6 h-6 text-white dark:text-black transition-colors duration-300" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">TalentMap</span>
          </Link>
        </div>

        <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 transition-colors duration-300">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              {isLogin ? 'Sign in to access your dashboard' : `Join TalentMap as a ${selectedRole === 'admin' ? 'Recruiter' : 'Student'}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name - Only for Register */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-900 dark:text-white">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 dark:text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 dark:text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password"
                    className="pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password - Only for Register */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-white">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm password"
                      className="pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800" disabled={isLoading}>
                  {isLoading ? (isLogin ? 'Signing in...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Create Account')}
                </Button>
              </div>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      // Reset role on switch if needed, but keeping it simple for now
                      if (isLogin) setSelectedRole(null); // When going to Register, force choice? Or keep?
                      // Let's force choice if going to register to be safe, or check logic.
                      // Actually, if they click "Sign up", they might want to re-select role.
                      if (isLogin) setSelectedRole(null);
                    }}
                    className="text-black dark:text-white hover:text-gray-800 dark:hover:text-gray-200 font-medium underline"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>

                {/* Back button for Role Selection (Only in Register mode if role is selected) */}
                {!isLogin && selectedRole && (
                  <button
                    type="button"
                    onClick={() => setSelectedRole(null)}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Change Role
                  </button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
