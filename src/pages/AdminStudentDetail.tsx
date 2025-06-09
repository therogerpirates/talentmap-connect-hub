import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, Download, CheckCircle, X } from 'lucide-react';
import GaugeChart from 'react-gauge-chart';
import { supabase } from '@/integrations/supabase/client'; // Assuming supabase client is here
import { useToast } from '@/hooks/use-toast';

// Define a type for the student data including new fields
interface StudentData {
  id: string;
  year?: string;
  department?: string;
  gpa?: string;
  skills?: string[];
  resume_url?: string;
  ats_score?: number;
  has_internship?: boolean;
  summary?: string;
  full_name?: string;
  // Add other fields as needed
}

const AdminStudentDetail = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to fetch student data (including profile name)
  const fetchStudentData = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch student-specific data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*') // Select all fields from students table
        .eq('id', id)
        .single();

      if (studentError) {
        throw studentError;
      }

      // Fetch associated profile data to get the name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name') // Select only the full_name from profiles
        .eq('id', id)
        .single();

      if (profileError) {
        console.warn('Could not fetch profile for student', id, profileError); // Log warning but don't necessarily fail
        // Proceed with student data even if profile fetch fails
        setStudentData(student as StudentData);
      } else {
         // Combine student data with profile name
         setStudentData({ ...student as StudentData, full_name: profile?.full_name });
      }

    } catch (err: any) {
      console.error('Error fetching student data:', err);
      setError(err.message || 'Failed to fetch student data');
      setStudentData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudentData(studentId);
    }
  }, [studentId]);

  const handleDownloadResume = async () => {
    if (!studentData?.resume_url) {
      toast({
        title: "No Resume",
        description: "This student does not have a resume uploaded.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Extract the file path from the full Supabase Storage URL
      const publicUrlBase = `https://vsgyopyvyeeqryzomtgq.supabase.co/storage/v1/object/public/resumes/`; // Use your Supabase URL and bucket name
      
      if (!studentData.resume_url.startsWith(publicUrlBase)){
           throw new Error("Invalid resume URL format");
      }

      const filePath = studentData.resume_url.substring(publicUrlBase.length); // Get the path after the public base URL

      const { data, error } = await supabase.storage.from('resumes').createSignedUrl(filePath, 60); // URL valid for 60 seconds

      if (error) {
        throw error;
      }

      if (data?.signedUrl) {
         window.open(data.signedUrl, '_blank');
      } else {
          throw new Error("Could not get signed URL");
      }

    } catch (err: any) {
      console.error('Error downloading resume:', err);
      toast({
        title: "Download Failed",
        description: err.message || "Could not download the resume.",
        variant: "destructive",
      });
    }
  };

  // Helper function to format resume summary (can reuse the one from StudentDashboard if desired)
  const formatResumeSummary = (summary: string) => {
    // Split the summary into sections based on common patterns
    const sections = summary.split(/\n\s*\n/);
    
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      
      return (
        <div key={index} className="mb-6 last:mb-0">
          {lines.map((line, lineIndex) => {
            const trimmedLine = line.trim();
            
            // Check if line is a header (contains **text** or is all caps)
            if (trimmedLine.match(/^\*\*(.*?)\*\*/) || trimmedLine === trimmedLine.toUpperCase()) {
              return (
                <h3 key={lineIndex} className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                  {trimmedLine.replace(/\*\*(.*?)\*\*/g, '$1')}
                </h3>
              );
            }
            
            // Check if line starts with a bullet point or dash
            if (trimmedLine.match(/^[-•*]\s/)) {
              return (
                <div key={lineIndex} className="flex items-start mb-2">
                  <div className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700 leading-relaxed">
                    {trimmedLine.replace(/^[-•*]\s/, '')}
                  </p>
                </div>
              );
            }
            
            // Regular paragraph
            return (
              <p key={lineIndex} className="text-gray-700 leading-relaxed mb-2">
                {trimmedLine}
              </p>
            );
          })}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl">Error: {error}</p>
          <p className="mt-2">Could not load student data.</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
     return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p className="text-xl">Student not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Student Details: {studentData.full_name || 'N/A'}</h1>

        {/* Download Resume Button */}
        <div className="mb-6 text-right">
           <Button onClick={handleDownloadResume} disabled={!studentData?.resume_url}>
              <Download className="w-4 h-4 mr-2" />
              Download Resume
           </Button>
        </div>

        {/* Profile Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600 text-sm">Academic Year:</Label>
                <p className="font-medium text-gray-900 text-lg leading-snug">{studentData.year || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-gray-600 text-sm">Department:</Label>
                <p className="font-medium text-gray-900 text-lg leading-snug">{studentData.department || 'N/A'}</p>
              </div>
               {/* Add other profile fields here if needed, potentially including full_name */}
            </div>
          </CardContent>
        </Card>

        {/* Extracted Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* ATS Score */}
          {studentData.ats_score !== undefined && (
             <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>ATS Score</span>
                  </CardTitle>
                  <CardDescription>
                    ATS compatibility score.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="text-center w-48 mx-auto">
                    {studentData.ats_score !== undefined && ( // Redundant check but safe
                      <GaugeChart
                        id="admin-ats-score-gauge"
                        nrOfLevels={20}
                        percent={studentData.ats_score / 100} // Score should be between 0 and 1
                        arcWidth={0.3}
                        colors={['#FF5F6D', '#FFC371', '#4CAF50']} // Example colors (Red, Yellow, Green)
                        textColor="#000000"
                      />
                    )}
                    <p className="text-sm text-gray-600 mt-2">Score: {studentData.ats_score}/100</p>
                  </div>
                </CardContent>
              </Card>
          )}

          {/* Experience / Internship */}
          {studentData.has_internship !== undefined && (
             <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Experience</span>
                  </CardTitle>
                  <CardDescription>
                    Internship status and other experience.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="flex items-center">
                    Has Internship: 
                    {studentData.has_internship ? 
                      <CheckCircle className="w-5 h-5 text-green-500 ml-2" /> 
                      : 
                      <X className="w-5 h-5 text-red-500 ml-2" />
                    }
                  </p>
                  {/* TODO: Display detailed experience entries here if extracted and stored */}
                </CardContent>
              </Card>
          )}

        </div>

        {/* Skills - Full Width */}
        {studentData.skills && studentData.skills.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Skills</span>
                </CardTitle>
                <CardDescription>
                  Key skills extracted from the resume.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {studentData.skills.map((skill, index) => (
                    <span key={index} className="bg-gray-100 text-gray-900 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-gray-800 dark:text-gray-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Resume Summary - Full Width */}
        {studentData.summary && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Resume Summary</span>
              </CardTitle>
              <CardDescription>
                AI-generated summary of the resume.
              </CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-100">
                {formatResumeSummary(studentData.summary)}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default AdminStudentDetail; 