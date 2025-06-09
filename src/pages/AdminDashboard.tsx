import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Users, FileText, LogOut, Filter, Mail, MoreHorizontal, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentsSearch } from '@/hooks/useStudentsSearch';
import StudentCard from '@/components/StudentCard';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState(() => {
    const savedQuery = localStorage.getItem('adminSearchQuery');
    return savedQuery || '';
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>(() => {
    const savedSkills = localStorage.getItem('adminSelectedSkills');
    return savedSkills ? JSON.parse(savedSkills) : [];
  });
  const [skillInput, setSkillInput] = useState('');
  const [shortlistedCandidates, setShortlistedCandidates] = useState<string[]>([]);
  const { signOut, profile, user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [persistedSearchResults, setPersistedSearchResults] = useState<any[]>(() => {
    const savedResults = localStorage.getItem('adminSearchResults');
    return savedResults ? JSON.parse(savedResults) : [];
  });
  const [isSearching, setIsSearching] = useState(false);
  
  // Common skills for suggestions
  const commonSkills = [
    'React', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Node.js',
    'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Machine Learning',
    'Data Science', 'UI/UX', 'Graphic Design', 'Project Management'
  ];

  // Filter skills based on input
  const filteredSkills = skillInput === ''
    ? commonSkills
    : commonSkills.filter((skill) =>
        skill.toLowerCase().includes(skillInput.toLowerCase())
      );

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        console.log('Fetching profile for user:', user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        console.log('Fetched profile data:', data);
        if (data?.full_name) {
          setFullName(data.full_name);
        }
      }
    };

    fetchProfile();
  }, [user?.id]);

  const { data: searchResults, refetch: performSearch } = useStudentsSearch(searchQuery, selectedSkills);

  // Update persisted results when search results change
  useEffect(() => {
    if (searchResults) {
      setPersistedSearchResults(searchResults);
    }
  }, [searchResults]);

  // Save search query to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminSearchQuery', searchQuery);
  }, [searchQuery]);

  // Save selected skills to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('adminSelectedSkills', JSON.stringify(selectedSkills));
  }, [selectedSkills]);

  // Save search results to localStorage whenever they change
  useEffect(() => {
    if (persistedSearchResults.length > 0) {
      localStorage.setItem('adminSearchResults', JSON.stringify(persistedSearchResults));
    }
  }, [persistedSearchResults]);

  // Clear localStorage when component unmounts
  useEffect(() => {
    return () => {
      localStorage.removeItem('adminSearchQuery');
      localStorage.removeItem('adminSelectedSkills');
      localStorage.removeItem('adminSearchResults');
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && selectedSkills.length === 0) {
      toast({
        title: "Please enter a search query or select skills",
        description: "Describe the skills or qualifications you're looking for",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      await performSearch();
    } finally {
      setIsSearching(false);
    }
  };

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (!selectedSkills.includes(newSkill)) {
        setSelectedSkills([...selectedSkills, newSkill]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account."
    });
  };

  const handleShortlistToggle = (studentId: string) => {
    setShortlistedCandidates(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Function to handle CSV download
  const handleDownloadCsv = async () => {
    if (!persistedSearchResults || persistedSearchResults.length === 0) {
      toast({
        title: "No candidates to download",
        description: "Perform a search first.",
        variant: "destructive",
      });
      return;
    }

    const studentIds = persistedSearchResults.map(student => student.id);
    // Optionally set a loading state for the buttons here

    try {
      const response = await fetch('http://localhost:8000/download-students-csv/', { // Use your backend URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentIds),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download CSV: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'students_details.csv'; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=\"(.+)\"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "CSV Download Started",
        description: `Downloading ${filename}.`,
      });

    } catch (error: any) {
      console.error('CSV download error:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Could not download the CSV file.",
        variant: "destructive",
      });
    } finally {
       // Optionally unset the loading state
    }
  };

  // Function to handle Zip download
  const handleDownloadZip = async () => {
     if (!persistedSearchResults || persistedSearchResults.length === 0) {
      toast({
        title: "No candidates to download",
        description: "Perform a search first.",
        variant: "destructive",
      });
      return;
    }

    // Filter for students with resume URLs
    const studentsWithResumes = persistedSearchResults.filter(student => student.resumeUrl);

    if (studentsWithResumes.length === 0) {
         toast({
            title: "No resumes available",
            description: "None of the searched candidates have resumes uploaded.",
            variant: "destructive",
        });
        return;
    }

    const studentIds = studentsWithResumes.map(student => student.id);
    // Optionally set a loading state for the buttons here

    try {
      const response = await fetch('http://localhost:8000/download-resumes-zip/', { // Use your backend URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentIds),
      });

      if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`Failed to download Zip: ${response.status} ${response.statusText} - ${errorText}`);
      }

       // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'students_resumes.zip'; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=\"(.+)\"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Zip Download Started",
        description: `Downloading ${filename}.`,
      });

    } catch (error: any) {
      console.error('Zip download error:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Could not download the Zip file.",
        variant: "destructive",
      });
    } finally {
       // Optionally unset the loading state
    }
  };

  // Function to handle shortlisted CSV download
  const handleDownloadShortlistedCsv = async () => {
    if (shortlistedCandidates.length === 0) {
      toast({
        title: "No candidates selected",
        description: "Please select candidates to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the full student data for shortlisted candidates
      const shortlistedStudents = persistedSearchResults?.filter(student => 
        shortlistedCandidates.includes(student.id)
      ) || [];

      if (shortlistedStudents.length === 0) {
        toast({
          title: "Error",
          description: "Could not find data for selected candidates.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('http://localhost:8000/download-students-csv/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(shortlistedStudents.map(student => student.id)),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Failed to download CSV: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shortlisted_students.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "CSV Download Started",
        description: "Downloading shortlisted students details.",
      });

    } catch (error: any) {
      console.error('CSV download error:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Could not download the CSV file.",
        variant: "destructive",
      });
    }
  };

  // Function to handle shortlisted Zip download
  const handleDownloadShortlistedZip = async () => {
    if (shortlistedCandidates.length === 0) {
      toast({
        title: "No candidates selected",
        description: "Please select candidates to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the full student data for shortlisted candidates
      const shortlistedStudents = persistedSearchResults?.filter(student => 
        shortlistedCandidates.includes(student.id) && student.resumeUrl
      ) || [];

      if (shortlistedStudents.length === 0) {
        toast({
          title: "No resumes available",
          description: "None of the selected candidates have resumes uploaded.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('http://localhost:8000/download-resumes-zip/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(shortlistedStudents.map(student => student.id)),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Failed to download Zip: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shortlisted_resumes.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Zip Download Started",
        description: "Downloading shortlisted resumes.",
      });

    } catch (error: any) {
      console.error('Zip download error:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Could not download the Zip file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TalentMap</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {fullName || profile?.full_name} (Recruiter)
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
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
          <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                    className="bg-black hover:bg-gray-800 px-8"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {/* Skill Tag Filter */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filter by Skills:</span>
                  </div>
                  
                  {/* Selected Skills */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="flex items-center space-x-1 px-3 py-1"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* Skill Input */}
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillInputKeyDown}
                    placeholder="Type a skill and press Enter to add..."
                    className="w-full"
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Search Results */}
          {persistedSearchResults && persistedSearchResults.length > 0 && (
            <div>
              {/* Search Results Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Search Results ({persistedSearchResults.length} candidates found)
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Sorted by:</span>
                    <span className="font-medium">Match Score</span>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownloadZip}
                      disabled={isSearching || !persistedSearchResults || persistedSearchResults.length === 0}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download All Resumes (Zip)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownloadCsv}
                      disabled={isSearching || !persistedSearchResults || persistedSearchResults.length === 0}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download All Details (CSV)
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownloadShortlistedZip}
                      disabled={shortlistedCandidates.length === 0}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Shortlisted Resumes (Zip)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownloadShortlistedCsv}
                      disabled={shortlistedCandidates.length === 0}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Shortlisted Details (CSV)
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {persistedSearchResults.map((student) => (
                  <div key={student.id} className="group relative">
                    <input
                      type="checkbox"
                      id={`student-${student.id}`}
                      checked={shortlistedCandidates.includes(student.id)}
                      onChange={() => handleShortlistToggle(student.id)}
                      className="absolute top-4 right-4 z-20 w-5 h-5 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
                    />
                    <label 
                      htmlFor={`student-${student.id}`}
                      className="absolute top-4 right-4 z-10 w-5 h-5 cursor-pointer"
                    />
                    <Link to={`/admin/students/${student.id}`} className="block">
                      <Card className="hover:shadow-lg transition-all duration-300 border border-gray-100 h-full">
                        <CardContent className="p-6 flex flex-col h-full justify-between">
                          {/* Top Section: Avatar, Name, Role */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {student.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                                <p className="text-sm text-gray-500">{student.year}nd year</p>
                              </div>
                            </div>
                          </div>

                          {/* Middle Section: Department and GPA */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Department</p>
                              <p className="font-medium text-gray-900">{student.department}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">GPA</p>
                              <p className="font-medium text-gray-900">{student.gpa}</p>
                            </div>
                          </div>

                          {/* Bottom Section: Contact Info and Buttons */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2 text-gray-700">
                              <Mail className="w-5 h-5 text-gray-500" />
                              <span className="text-sm">{student.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end pt-4 border-t border-gray-100 mt-4">
                            {student.resumeUrl && (
                              <a 
                                href={student.resumeUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button variant="outline" size="sm" className="h-8 mr-2">
                                  <FileText className="w-4 h-4 mr-1" />
                                  Resume
                                </Button>
                              </a>
                            )}
                            <Button size="sm" className="h-8 bg-black hover:bg-gray-800">
                              Contact
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!persistedSearchResults || persistedSearchResults.length === 0) && !isSearching && (
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
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Search className="w-8 h-8 text-gray-600" />
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
