import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Brain, Users, Clock, BookOpen, Target, Loader2 } from 'lucide-react';

interface ExtractedJobInfo {
  required_skills: string[];
  eligibility_criteria: {
    education: string[];
    experience_years: number;
    cgpa_minimum: number;
    specific_requirements: string[];
  };
  eligible_years: number[];
}

interface JobExtractorProps {
  onExtraction: (extractedData: ExtractedJobInfo) => void;
  initialDescription?: string;
  sessionId?: string; // Optional session ID to check for existing criteria
}

export const JobExtractor = ({ onExtraction, initialDescription = '', sessionId }: JobExtractorProps) => {
  const [description, setDescription] = useState(initialDescription);
  const [extractedData, setExtractedData] = useState<ExtractedJobInfo | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const handleExtraction = async () => {
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please enter a job description first",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    
    try {
      const response = await fetch('http://localhost:8000/extract-job-info/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: description,
          ...(sessionId && { session_id: sessionId }) // Include session_id if provided
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        const extractedInfo = data.extracted_data;
        const extracted: ExtractedJobInfo = {
          required_skills: extractedInfo.required_skills || [],
          eligibility_criteria: extractedInfo.eligibility_criteria || {
            education: [],
            experience_years: 0,
            cgpa_minimum: 0,
            specific_requirements: []
          },
          eligible_years: extractedInfo.eligible_years || []
        };
        
        setExtractedData(extracted);
        onExtraction(extracted);
        
        toast({
          title: "Extraction Successful!",
          description: `Found ${extracted.required_skills.length} skills and ${extracted.eligibility_criteria.specific_requirements.length} requirements`,
        });
      } else {
        throw new Error(data.message || 'Failed to extract job information');
      }
    } catch (error) {
      console.error('Error extracting job information:', error);
      toast({
        title: "Extraction Failed",
        description: "Unable to extract job information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleClearExtraction = () => {
    setExtractedData(null);
    setDescription('');
    onExtraction({
      required_skills: [],
      eligibility_criteria: {
        education: [],
        experience_years: 0,
        cgpa_minimum: 0,
        specific_requirements: []
      },
      eligible_years: []
    });
  };

  return (
    <div className="space-y-6">
      {/* Job Description Input */}
      <Card className="glass-panel border-0 shadow-glass relative overflow-hidden">
        <div className="absolute inset-0 gradient-glass opacity-30"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center space-x-3">
            <div className="h-10 w-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold">AI Job Analysis</span>
              <p className="text-sm text-muted-foreground font-normal">
                Paste your job description to automatically extract requirements
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <div>
            <Label htmlFor="job-description">Job Description</Label>
            <Textarea
              id="job-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste your complete job description here. Include requirements, qualifications, skills needed, and any specific criteria..."
              className="min-h-[200px] resize-none"
            />
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={handleExtraction} 
              disabled={isExtracting || !description.trim()}
              className="gradient-primary text-white flex-1"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Extract Requirements
                </>
              )}
            </Button>
            
            {extractedData && (
              <Button 
                variant="outline" 
                onClick={handleClearExtraction}
                className="px-4"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extraction Results */}
      {extractedData && (
        <div className="space-y-4">
          {/* Required Skills */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>Required Skills ({extractedData.required_skills.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {extractedData.required_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {extractedData.required_skills.map((skill, index) => (
                    <Badge key={index} variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No specific skills detected</p>
              )}
            </CardContent>
          </Card>

          {/* Eligibility Criteria */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-green-500" />
                <span>Eligibility Criteria</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Education Requirements */}
              {extractedData.eligibility_criteria.education.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Education</Label>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.eligibility_criteria.education.map((edu, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                        {edu}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience & CGPA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extractedData.eligibility_criteria.experience_years > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Experience Required</Label>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-lg font-semibold">
                        {extractedData.eligibility_criteria.experience_years} year{extractedData.eligibility_criteria.experience_years !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {extractedData.eligibility_criteria.cgpa_minimum > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Minimum CGPA</Label>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      <span className="text-lg font-semibold">
                        {extractedData.eligibility_criteria.cgpa_minimum}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Specific Requirements */}
              {extractedData.eligibility_criteria.specific_requirements.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Additional Requirements</Label>
                  <div className="space-y-2">
                    {extractedData.eligibility_criteria.specific_requirements.map((req, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Eligible Years */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-500" />
                <span>Eligible Academic Years</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {extractedData.eligible_years.length > 0 ? (
                <div className="flex space-x-3">
                  {extractedData.eligible_years.map((year, index) => (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-lg font-bold text-purple-600">{year}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Year {year}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">All years eligible</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State for Extraction */}
      {isExtracting && (
        <Card className="glass-panel">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Brain className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Analyzing Job Description</h3>
                <p className="text-sm text-muted-foreground">
                  AI is extracting skills, requirements, and eligibility criteria...
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JobExtractor;
