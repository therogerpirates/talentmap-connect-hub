import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { useStudentsSearch } from '@/hooks/useStudentsSearch';
import { useToast } from '@/hooks/use-toast';
import StudentCard from '@/components/StudentCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SearchSessionProps {
  id: string;
  title: string;
  role: string;
}

interface StudentSearchProps {
  onAddToSession?: (studentId: string, sessionId: string) => void;
  selectedSessionId?: string | null;
  activeSessions?: SearchSessionProps[];
  onSessionSelect?: (sessionId: string | null) => void;
}

export const StudentSearch = ({
  onAddToSession,
  selectedSessionId,
  activeSessions = [],
  onSessionSelect
}: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [shortlistedCandidates, setShortlistedCandidates] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { toast } = useToast();
  const { data: searchResults, refetch: performSearch } = useStudentsSearch(searchQuery, selectedSkills);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && selectedSkills.length === 0) {
      toast({
        title: "Please enter a search query or select skills",
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

  const handleClearSession = () => {
    if (onSessionSelect) {
      onSessionSelect(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Form Area */}
      <form onSubmit={handleSearch} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Search Candidates Input */}
          <div className="space-y-2">
            <label className="text-base font-bold text-foreground">Search Candidates</label>
            <Input
              placeholder="Describe the role or skills you're looking for..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 border-input bg-background/50 text-base"
            />
          </div>

          {/* Skills Filter Input */}
          <div className="space-y-2">
            <label className="text-base font-bold text-foreground">Skills Filter</label>
            <Input
              placeholder="Add specific skills (press Enter)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillInputKeyDown}
              className="h-12 border-input bg-background/50 text-base"
            />
          </div>
        </div>

        {/* Selected Skills */}
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <Badge key={skill} variant="secondary" className="px-3 py-1 gap-1">
                {skill}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeSkill(skill)}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center gap-6">
          {/* Add to Session Dropdown */}
          <div className="flex items-center gap-4">
            {activeSessions.length > 0 && onSessionSelect && (
              <div className="w-64">
                <label className="text-sm font-bold text-foreground block mb-1">Add to Session (Optional)</label>
                <Select
                  value={selectedSessionId || ''}
                  onValueChange={(val) => onSessionSelect(val)}
                >
                  <SelectTrigger className="w-full border-none shadow-none p-0 h-auto text-base font-semibold focus:ring-0">
                    <div className="flex items-center gap-2">
                      <span>{selectedSessionId ? activeSessions.find(s => s.id === selectedSessionId)?.title : 'Select Session'}</span>
                      {/* Chevron is automatic in Select trigger usually, but if we custom styled it... */}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {activeSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.title} - {session.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <button
              type="button"
              onClick={handleClearSession}
              className="text-sm font-bold mt-6 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Search Button */}
        <div>
          <Button
            type="submit"
            disabled={isSearching}
            className="px-8 py-2 h-10 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md shadow-sm"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </form>

      {/* Search Results Grid */}
      {searchResults && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Search Results {searchResults.length > 0 && `(${searchResults.length})`}</h2>

          {searchResults.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  isShortlisted={shortlistedCandidates.includes(student.id)}
                  onShortlistToggle={() => handleShortlistToggle(student.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-lg">
              No candidates found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};