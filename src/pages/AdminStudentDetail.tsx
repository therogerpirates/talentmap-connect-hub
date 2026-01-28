
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  Code,
  BarChart,
  User,
  GraduationCap
} from 'lucide-react';
import GaugeChart from 'react-gauge-chart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Extended StudentData interface
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
  full_name?: string; // from profiles
  email?: string; // from profiles
  phone?: string; // from profiles
  location?: string; // from profiles
  avatar_url?: string; // from profiles
  github_url?: string;
  linkedin_url?: string;
  projects?: string[]; // Assuming text[] based on python backend
  education?: string | any[];
  experience?: string[];
}

const AdminStudentDetail = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStudentData = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch student data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (studentError) throw studentError;

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone_number, avatar_url, city, state, country') // Attempting to fetch common fields
        .eq('id', id)
        .single();

      if (profileError) {
        console.warn('Could not fetch profile', profileError);
      }

      // Construct location string
      const locationParts = [profile?.city, profile?.state, profile?.country].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(', ') : undefined;

      setStudentData({
        ...student,
        full_name: profile?.full_name || student.full_name,
        email: profile?.email || student.email,
        phone: profile?.phone_number || student.phone,
        avatar_url: profile?.avatar_url,
        location: location
      });

    } catch (err: any) {
      console.error('Error fetching student data:', err);
      setError(err.message || 'Failed to fetch student data');
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
      toast({ title: "No Resume", description: "No resume uploaded.", variant: "destructive" });
      return;
    }
    try {
      // Clean up URL if it contains full path (supabase generic handling)
      const path = studentData.resume_url.split('resumes/')[1] || studentData.resume_url;
      const { data, error } = await supabase.storage.from('resumes').createSignedUrl(path, 60);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (err) {
      toast({ title: "Download Failed", description: "Could not download resume.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen bg-[#F8F9FC]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (error || !studentData) return <div className="flex justify-center items-center h-screen bg-[#F8F9FC] text-red-500">Error: {error || 'Student not found'}</div>;

  // Helpers
  const initials = studentData.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
  const atsScore = studentData.ats_score || 0;
  const atsColor = atsScore >= 80 ? '#4CAF50' : atsScore >= 50 ? '#FFC371' : '#FF5F6D';
  const atsLabel = atsScore >= 80 ? 'High Compatibility' : atsScore >= 50 ? 'Medium Compatibility Score' : 'Low Compatibility';

  // Education handling
  let educationList: any[] = [];
  if (Array.isArray(studentData.education)) {
    educationList = studentData.education;
  } else if (typeof studentData.education === 'string') {
    educationList = [{ institution: studentData.education }];
  }
  // If no education, we will render empty state

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans pb-12">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Student Details: {studentData.full_name || 'Student'}</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">CANDIDATE ID: STU-{studentData.id.substring(0, 5).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm shadow-blue-200" onClick={handleDownloadResume}>
            <Download className="w-4 h-4 mr-2" />
            Download Resume
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Top Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile Card */}
          <Card className="lg:col-span-2 border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                {/* Avatar - Only show image if uploaded */}
                <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                  {studentData.avatar_url ? (
                    <div className="w-32 h-32 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                      <img
                        src={studentData.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image load fails
                          (e.target as HTMLImageElement).style.display = 'none';
                          // The placeholder below will need to be rendered if this is hidden
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-slate-800 flex items-center justify-center border-4 border-white shadow-sm">
                      <span className="text-3xl font-bold text-white">{initials}</span>
                    </div>
                  )}
                  {/* Online/Verified Status */}
                  <div className="absolute bottom-2 right-[-8px] w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                </div>

                {/* Info */}
                <div className="flex-1 w-full text-center sm:text-left">
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">{studentData.full_name || 'Unknown Name'}</h2>
                  <p className="text-[#3B82F6] font-medium mb-6">{studentData.department || 'Department not specified'}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-gray-100 pt-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">ACADEMIC YEAR</p>
                      <p className="font-bold text-gray-800">{studentData.year || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">INSTITUTION</p>
                      <p className="font-bold text-gray-800 leading-tight">
                        {/* Try to extract institution from education list if available */}
                        {educationList.length > 0 && typeof educationList[0] === 'object'
                          ? educationList[0].institution
                          : 'Institution not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">LOCATION</p>
                      <p className="font-bold text-gray-800">{studentData.location || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: ATS & Experience */}
          <div className="space-y-6">
            {/* ATS Card */}
            <Card className="border-0 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-gray-900 text-sm">ATS Compatibility</h3>
                </div>
                <div className="flex flex-col items-center justify-center relative -mt-4">
                  <GaugeChart
                    id="ats-gauge"
                    nrOfLevels={20}
                    percent={Math.min(atsScore / 100, 1)}
                    colors={['#EF4444', '#F59E0B', '#10B981']}
                    arcWidth={0.15}
                    needleColor="#CBD5E1"
                    needleBaseColor="#94A3B8"
                    textColor="#1E293B"
                    hideText={true}
                    className="w-full max-w-[200px]"
                  />
                  <div className="text-center absolute bottom-4">
                    <div className="text-3xl font-bold text-gray-900">{atsScore} <span className="text-sm text-gray-400 font-normal">/100</span></div>
                    <div className="text-[10px] text-gray-500 font-medium mt-1">{atsLabel}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experience Card */}
            <Card className="border-0 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-orange-500" />
                    <h3 className="font-bold text-gray-900 text-sm">Experience</h3>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider">
                    {studentData.has_internship ? 'INTERMEDIATE' : 'JUNIOR'}
                  </Badge>
                </div>

                <div className={`p-4 rounded-xl flex items-center gap-3 ${studentData.has_internship ? 'bg-green-50' : 'bg-[#FFF1F2]'}`}>
                  {studentData.has_internship ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-green-900 font-bold text-sm">Internship Completed</p>
                        <p className="text-green-700 text-xs">Has relevant industry experience</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-red-900 font-bold text-sm">No Prior Internship</p>
                        <p className="text-red-700 text-xs">Currently seeking first role</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Core Expertise Grid */}
        <Card className="border-0 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-gray-900 text-sm">Core Expertise</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {studentData.skills && studentData.skills.length > 0 ? (
                studentData.skills.map((skill, i) => (
                  <div key={i} className="px-4 py-2 bg-[#F0F7FF] text-[#2563EB] text-sm font-bold rounded-lg hover:bg-blue-100 transition-colors">
                    {skill}
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-500 italic">No skills listed</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resume Summary Section */}
        <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">AI-Generated Resume Summary</h2>
            </div>
            <Badge className="bg-[#DCFCE7] text-[#16A34A] hover:bg-[#DCFCE7] uppercase text-[10px] tracking-wider font-bold px-3 py-1 border-0">
              Verified Content
            </Badge>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content (Left Col) */}
            <div className="lg:col-span-2 space-y-10">

              {/* Professional Summary */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  <h3 className="font-bold text-gray-900">Professional Summary</h3>
                </div>
                <p className="text-gray-600 leading-relaxed text-sm text-justify whitespace-pre-wrap">
                  {studentData.summary || "No summary available."}
                </p>
              </div>

              {/* Education */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">EDUCATION</p>
                </div>
                <div className="space-y-6">
                  {educationList.length > 0 ? (
                    educationList.map((edu: any, i) => {
                      // New parsing logic for string format "Degree ... from Institution (Year)"
                      let degree = "Degree";
                      let institution = "";
                      let year = "";
                      let displayTitle = "";

                      if (typeof edu === 'string') {
                        displayTitle = edu;
                        const yearMatch = edu.match(/\((\d{4}(?:\s*-\s*\d{4})?)\)$/);
                        if (yearMatch) {
                          year = yearMatch[1];
                          displayTitle = displayTitle.replace(yearMatch[0], "").trim();
                        }

                        // Try to split logic if "from" exists
                        const fromParts = displayTitle.split(' from ');
                        if (fromParts.length > 1) {
                          degree = fromParts[0];
                          institution = fromParts[1];
                        } else {
                          degree = displayTitle;
                        }
                      } else {
                        // Fallback for object format if ever used
                        degree = edu.degree || edu.institution || "Degree";
                        institution = edu.place || edu.institution || "";
                        year = edu.year || "";
                      }

                      return (
                        <div key={i} className="flex gap-4">
                          <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">
                              {degree}
                            </h4>
                            {institution && (
                              <p className="text-xs text-gray-500 mt-0.5">{institution}</p>
                            )}
                            {year && (
                              <p className="text-xs text-blue-600 font-bold mt-1">{year}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 italic">No education details found.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar (Right Col) */}
            <div className="space-y-8">

              {/* Contact Details */}
              <div className="bg-[#F8F9FC] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <h3 className="font-bold text-gray-900 text-sm">Contact Details</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${studentData.email}`} className="text-sm text-blue-500 font-medium truncate">{studentData.email || 'N/A'}</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 font-medium">{studentData.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 font-medium">{studentData.location || 'N/A'}</span>
                  </div>
                  {studentData.linkedin_url && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <a href={studentData.linkedin_url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 font-medium truncate">LinkedIn</a>
                    </div>
                  )}
                  {studentData.github_url && (
                    <div className="flex items-center gap-3">
                      <Code className="w-4 h-4 text-gray-400" />
                      <a href={studentData.github_url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 font-medium truncate">GitHub</a>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Projects - Populate from real data */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">KEY PROJECTS</p>
                </div>
                <div className="space-y-3">
                  {studentData.projects && studentData.projects.length > 0 ? (
                    studentData.projects.map((proj: any, i) => {
                      // Handle string with description "Title: Description"
                      let title = "";
                      let desc = "";
                      if (typeof proj === 'string') {
                        const parts = proj.split(': ');
                        title = parts[0];
                        desc = parts.slice(1).join(': ');
                      } else {
                        title = proj.title;
                        desc = proj.description;
                      }

                      return (
                        <div key={i} className="bg-[#F8F9FC] p-4 rounded-xl border border-gray-100">
                          <h4 className="font-bold text-gray-900 text-sm mb-1">
                            {title}
                          </h4>
                          {desc && (
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{desc}</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 italic">No projects listed.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default AdminStudentDetail;