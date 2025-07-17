import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Download, UserPlus, Loader2 } from 'lucide-react';
import { useStudentsSearch } from '@/hooks/useStudentsSearch';
import { useToast } from '@/hooks/use-toast';
import StudentCard from '@/components/StudentCard';

interface StudentSearchProps {
  onAddToSession?: (studentId: string, sessionId: string) => void;
  selectedSessionId?: string;
}

export const StudentSearch = ({ onAddToSession, selectedSessionId }: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [shortlistedCandidates, setShortlistedCandidates] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { toast } = useToast();
  const { data: searchResults, refetch: performSearch } = useStudentsSearch(searchQuery, selectedSkills);

  const commonSkills = [
    'React', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Node.js',
    'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Machine Learning',
    'Data Science', 'UI/UX', 'Graphic Design', 'Project Management'
  ];

  const filteredSkills = skillInput === ''
    ? commonSkills
    : commonSkills.filter((skill) =>
        skill.toLowerCase().includes(skillInput.toLowerCase())
      );

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

  const handleShortlistToggle = (studentId: string) => {
    setShortlistedCandidates(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAddToSession = (studentId: string) => {
    if (onAddToSession && selectedSessionId) {
      onAddToSession(studentId, selectedSessionId);
      toast({
        title: "Candidate Added",
        description: "Student has been added to the hiring session.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="glass-card border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary" />
            <span>Search Students</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Describe the role or skills you're looking for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Skills Filter</span>
              </div>
              
              <Input
                placeholder="Add specific skills (press Enter)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillInputKeyDown}
                className="text-sm"
              />

              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">
                      {skill}
                      <X
                        className="h-3 w-3 ml-2 cursor-pointer"
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              {skillInput && filteredSkills.length > 0 && (
                <div className="border rounded-md p-2 bg-card">
                  <div className="text-xs text-muted-foreground mb-2">Suggested skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {filteredSkills.slice(0, 8).map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground"
                        onClick={() => {
                          if (!selectedSkills.includes(skill)) {
                            setSelectedSkills([...selectedSkills, skill]);
                          }
                          setSkillInput('');
                        }}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isSearching}
              className="w-full gradient-primary text-white border-0"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Students
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && searchResults.length > 0 && (
        <Card className="glass-card border-0 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
            <div className="flex space-x-2">
              {shortlistedCandidates.length > 0 && (
                <Badge variant="secondary" className="px-3 py-1">
                  {shortlistedCandidates.length} shortlisted
                </Badge>
              )}
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((student) => (
                <div key={student.id} className="relative">
                  <StudentCard
                    student={student}
                    isShortlisted={shortlistedCandidates.includes(student.id)}
                    onShortlistToggle={() => handleShortlistToggle(student.id)}
                  />
                  {onAddToSession && selectedSessionId && (
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddToSession(student.id)}
                        className="gradient-primary text-white border-0 shadow-lg"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {searchResults && searchResults.length === 0 && (
        <Card className="glass-card border-0 shadow-card">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No students found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query or skill filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};