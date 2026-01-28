import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { useStudentsSearch } from '@/hooks/useStudentsSearch';
import { useToast } from '@/hooks/use-toast';
import StudentCard from '@/components/StudentCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'react-router-dom';

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
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state logic:
  // 1. URL Params (Primary)
  // 2. LocalStorage (Secondary - for persistence across navigation)
  const getInitialState = () => {
    const urlQ = searchParams.get('q');
    const urlSkills = searchParams.get('skills');

    if (urlQ || urlSkills) {
      return {
        q: urlQ || '',
        skills: urlSkills ? urlSkills.split(',') : []
      };
    }

    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('lastStudentSearch');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse saved search", e);
    }

    return { q: '', skills: [] };
  };

  const initialState = getInitialState();

  const [searchQuery, setSearchQuery] = useState(initialState.q);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialState.skills);

  const [skillInput, setSkillInput] = useState('');
  const [shortlistedCandidates, setShortlistedCandidates] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { toast } = useToast();
  const { data: searchResults, refetch: performSearch } = useStudentsSearch(searchQuery, selectedSkills);

  // Sync state to URL and LocalStorage on mount/update
  useEffect(() => {
    // If we restored from localStorage but URL was empty, update URL to match
    const urlQ = searchParams.get('q');
    const urlSkills = searchParams.get('skills');

    // Only update if there is a discrepancy and we actually have state to restore
    // This prevents clearing the URL if it was intentionally empty, 
    // BUT user wants persistence. So we assume "restore intent".
    const hasState = searchQuery || selectedSkills.length > 0;
    const urlMatches = urlQ === searchQuery && (urlSkills === (selectedSkills.join(',') || null) || (!urlSkills && selectedSkills.length === 0));

    if (hasState && !urlMatches) {
      updateParams(searchQuery, selectedSkills);
    }

    // Auto-search if we have data (either from URL or restored from LS)
    if (hasState) {
      performSearch();
    }
  }, []); // Run once on mount to handle restoration

  const updateParams = (query: string, skills: string[]) => {
    const params: any = {};
    if (query) params.q = query;
    if (skills.length > 0) params.skills = skills.join(',');
    setSearchParams(params);

    // Save to localStorage
    localStorage.setItem('lastStudentSearch', JSON.stringify({
      q: query,
      skills: skills
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && selectedSkills.length === 0) {
      toast({
        title: "Please enter a search query or select skills",
        variant: "destructive"
      });
      return;
    }

    updateParams(searchQuery, selectedSkills); // Update URL on search

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
        const newSkills = [...selectedSkills, newSkill];
        setSelectedSkills(newSkills);
        // Optional: Update params immediately for skills, or wait for Search button?
        // Let's wait for Search button to be consistent with text input, 
        // OR update immediately because skills are discrete filters. 
        // Given the requirement "state wont be svaing", immediate update is safer for "add skill -> navigate -> back".
        updateParams(searchQuery, newSkills);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkills = selectedSkills.filter(skill => skill !== skillToRemove);
    setSelectedSkills(newSkills);
    updateParams(searchQuery, newSkills);
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