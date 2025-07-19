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
    <div className="space-y-8">
      {/* Search Form */}
      <Card className="glass-panel border-0 shadow-glass relative overflow-hidden">
        <div className="absolute inset-0 gradient-glass opacity-30"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold">Student Search</span>
                <p className="text-muted-foreground text-sm">Find and recruit top talent</p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-3">
              <Input
                placeholder="Describe the role or skills you're looking for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-lg py-4 glass-button border-primary/30 focus:border-primary/50 transition-all duration-300"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 glass-button px-4 py-2 rounded-lg">
                <Filter className="h-5 w-5 text-primary" />
                <span className="text-base font-medium">Skills Filter</span>
              </div>
              
              <Input
                placeholder="Add specific skills (press Enter)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillInputKeyDown}
                className="text-base py-3 glass-button border-primary/30 focus:border-primary/50 transition-all duration-300"
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
                className="w-full gradient-primary text-white border-0 shadow-glow hover:scale-105 transition-all duration-300 py-4 text-lg font-semibold"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Searching for talent...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-3" />
                    Search Students
                  </>
                )}
              </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && searchResults.length > 0 && (
        <Card className="glass-panel border-0 shadow-glass relative overflow-hidden">
          <div className="absolute inset-0 gradient-glass opacity-20"></div>
          <CardHeader className="flex flex-row items-center justify-between relative z-10">
            <CardTitle className="text-2xl font-bold">Search Results ({searchResults.length})</CardTitle>
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
          <CardContent className="relative z-10">
            <div className="grid md:grid-cols-2 gap-6">
              {searchResults.map((student, index) => (
                <div key={student.id} className="relative fade-in-up" style={{animationDelay: `${0.05 * index}s`}}>
                  <StudentCard
                    student={student}
                    isShortlisted={shortlistedCandidates.includes(student.id)}
                    onShortlistToggle={() => handleShortlistToggle(student.id)}
                  />
                  {onAddToSession && selectedSessionId && (
                    <div className="absolute top-4 right-4">
                      <Button
                        size="sm"
                        onClick={() => handleAddToSession(student.id)}
                        className="gradient-primary text-white border-0 shadow-glow hover:scale-110 transition-transform duration-300"
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
        <Card className="glass-panel border-0 shadow-glass">
          <CardContent className="py-16 text-center">
            <Search className="h-16 w-16 text-primary mx-auto mb-6 opacity-50 float-animation" />
            <h3 className="text-2xl font-bold mb-3">No students found</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Try adjusting your search query or skill filters to discover more candidates
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};