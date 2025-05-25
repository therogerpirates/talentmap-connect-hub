import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, Upload, BookOpen } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TalentMap</span>
          </div>
          <div className="space-x-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/new-register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Connect Students with Opportunities
          </h1>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            TalentMap is the premier platform that bridges the gap between talented students and 
            organizations seeking fresh perspectives. Discover, connect, and grow together.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mt-16">
            {/* Student Card */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900">For Students</CardTitle>
                <CardDescription className="text-gray-600">
                  Showcase your skills and connect with amazing opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-3 mb-6 text-left max-w-xs mx-auto">
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Create your profile
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Upload your resume
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Get discovered by recruiters
                  </li>
                </ul>
                <Link to="/new-register">
                  <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                    Join as Student
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Admin Card */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900">For Recruiters</CardTitle>
                <CardDescription className="text-gray-600">
                  Find the perfect candidates with AI-powered search
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-3 mb-6 text-left max-w-xs mx-auto">
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
                    Smart candidate search
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
                    AI-powered matching
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
                    Access to top talent
                  </li>
                </ul>
                <Link to="/new-register">
                  <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Join as Recruiter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose TalentMap?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with intuitive design to create 
              meaningful connections between students and opportunities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Profile Creation</h3>
              <p className="text-gray-600">
                Simple, intuitive interface for students to showcase their skills and experience.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 transition-colors">
                <Search className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Matching</h3>
              <p className="text-gray-600">
                AI-powered search helps recruiters find the perfect candidates quickly and efficiently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">TalentMap</span>
          </div>
          <p className="text-gray-400 max-w-md mx-auto">
            Connecting students with opportunities, one match at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
