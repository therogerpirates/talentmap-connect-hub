import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, Upload, BookOpen } from 'lucide-react';
import { Layout } from '@/components/Layout';
import TitledCard from '../components/TitledCard';
import { ThemeToggle } from '@/components/ThemeToggle';


const Index = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 relative">
        
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent transition-colors duration-300">
              Connect Students with Opportunities
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed transition-colors duration-300">
              TalentMap is the premier platform that bridges the gap between talented students and 
              organizations seeking fresh perspectives. Discover, connect, and grow together.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 mt-16">
              {/* Student Card */}
              <TitledCard containerHeight="100%" containerWidth="100%">
                <Card className="h-full w-full border-0 shadow-lg bg-white dark:bg-gray-800">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl text-gray-900 dark:text-white">For Students</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">
                      Showcase your skills and connect with amazing opportunities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <ul className="space-y-3 mb-6 text-left max-w-xs mx-auto">
                      <li className="text-gray-700 dark:text-gray-300">Create your profile</li>
                      <li className="text-gray-700 dark:text-gray-300">Upload your resume</li>
                      <li className="text-gray-700 dark:text-gray-300">Get discovered by recruiters</li>
                    </ul>
                    <Link to="/new-register">
                      <Button size="lg" className="w-full bg-black dark:bg-white text-white dark:text-black">
                        Join as Student
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </TitledCard>


              {/* Admin Card */}
              <TitledCard containerHeight="100%" containerWidth="100%">
                <Card className="h-full w-full border-0 shadow-lg bg-white dark:bg-gray-800">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl text-gray-900 dark:text-white">For Recruiters</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">
                      Find the perfect cadidates with AI-powered Search
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <ul className="space-y-3 mb-6 text-left max-w-xs mx-auto">
                      <li className="text-gray-700 dark:text-gray-300">Smart Candidate Search</li>
                      <li className="text-gray-700 dark:text-gray-300">Ai-powered Matching</li>
                      <li className="text-gray-700 dark:text-gray-300">Access to Top Talent</li>
                    </ul>
                    <Link to="/new-register">
                      <Button size="lg" className="w-full bg-black dark:bg-white text-white dark:text-black">
                        Join as Recruiter
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </TitledCard>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white dark:bg-gray-800 transition-colors duration-300">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Why Choose TalentMap?</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
                Our platform combines cutting-edge technology with intuitive design to create 
                meaningful connections between students and opportunities.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="text-center group">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors duration-300">
                  <Upload className="w-8 h-8 text-black dark:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Easy Profile Creation</h3>
                <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                  Simple, intuitive interface for students to showcase their skills and experience.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors duration-300">
                  <Search className="w-8 h-8 text-black dark:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Smart Matching</h3>
                <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                  AI-powered search helps recruiters find the perfect candidates quickly and efficiently.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 dark:bg-black text-white py-12 transition-colors duration-300">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center transition-colors duration-300">
                <BookOpen className="w-5 h-5 text-black dark:text-white transition-colors duration-300" />
              </div>
              <span className="text-xl font-bold">TalentMap</span>
            </div>
            <p className="text-gray-400 dark:text-gray-500 max-w-md mx-auto transition-colors duration-300">
              Connecting students with opportunities, one match at a time.
            </p>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default Index;
