
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Users, FileText, LogOut, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StudentCard from '@/components/StudentCard';

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { toast } = useToast();

  // Mock student data for demonstration
  const mockStudents = [
    {
      id: 1,
      name: 'Alice Johnson',
      year: '4th Year',
      department: 'Computer Science',
      skills: ['React', 'Python', 'Machine Learning', 'Data Analysis'],
      gpa: '3.8',
      resumeUrl: '#',
      email: 'alice.johnson@university.edu',
      matchScore: 95
    },
    {
      id: 2,
      name: 'Bob Chen',
      year: '3rd Year',
      department: 'Engineering',
      skills: ['JavaScript', 'Node.js', 'Database Design', 'AWS'],
      gpa: '3.6',
      resumeUrl: '#',
      email: 'bob.chen@university.edu',
      matchScore: 87
    },
    {
      id: 3,
      name: 'Carol Martinez',
      year: 'Graduate',
      department: 'Business Administration',
      skills: ['Project Management', 'Data Analytics', 'Marketing', 'Leadership'],
      gpa: '3.9',
      resumeUrl: '#',
      email: 'carol.martinez@university.edu',
      matchScore: 82
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search query",
        description: "Describe the skills or qualifications you're looking for",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    // Simulate AI search with delay
    setTimeout(() => {
      setSearchResults(mockStudents);
      setIsSearching(false);
      toast({
        title: "Search Complete!",
        description: `Found ${mockStudents.length} matching candidates. Connect Supabase for real AI-powered search.`
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TalentMap</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Recruiter Dashboard</span>
            <Link to="/login">
              <Button variant="ghost" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruiter Dashboard</h1>
            <p className="text-gray-600">Find the perfect candidates with AI-powered search</p>
          </div>

          {/* Dashboard Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">1,247</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">With Resumes</p>
                    <p className="text-2xl font-bold text-gray-900">892</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Searches Today</p>
                    <p className="text-2xl font-bold text-gray-900">23</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Filter className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Filters</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>AI-Powered Candidate Search</span>
              </CardTitle>
              <CardDescription>
                Describe the skills, experience, or qualifications you're looking for in natural language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex space-x-4">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., 'Computer science students with React experience and internship background'"
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={isSearching}
                    className="bg-blue-600 hover:bg-blue-700 px-8"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Try searching for:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Python developers with machine learning experience',
                      'Business students with leadership experience',
                      'Engineering students with internship background',
                      'Data science students with SQL skills'
                    ].map((example, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSearchQuery(example)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Search Results ({searchResults.length} candidates found)
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Sorted by:</span>
                  <span className="font-medium">Match Score</span>
                </div>
              </div>

              <div className="grid gap-6">
                {searchResults.map((student) => (
                  <StudentCard key={student.id} student={student} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {searchResults.length === 0 && !isSearching && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Search</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Use the search bar above to find candidates that match your requirements. 
                  Our AI will analyze resumes and profiles to find the best matches.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isSearching && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Searching Candidates...</h3>
                <p className="text-gray-600">
                  Our AI is analyzing resumes and profiles to find the best matches for your query.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
