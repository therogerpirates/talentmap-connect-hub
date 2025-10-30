import React, { useState, useEffect } from "react";
import { PDFDownloadLink, Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, FileText, User, Download as DownloadIcon, Upload, Bold, Palette, LogOut, Sparkles } from 'lucide-react';
import { text } from "stream/consumers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Template type
type TemplateType = 'professional' | 'ats';

// Initial data structure for the resume
const initialResumeData = {
  personal: {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    linkedin: "",
    github: ""
  },
  education: [{ degree: "", institution: "", department: "", year: "", cgpa: "" }],
  skills: [""],
  experience: [{ jobTitle: "", company: "", duration: "", description: "" }],
  projects: [{ title: "", description: "", technologies: "", link: "" }],
  achievements: [{ title: "", description: "", date: "" }],
  extracurricular: [{ role: "", organization: "", duration: "", description: "" }],
  summary: ""
};

const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#333',
  },
  header: {
    backgroundColor: '#5a6c7d',
    height: 30,
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5a6c7d',
    marginBottom: 12,
    letterSpacing: 1,
  },
  contactInfo: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#333',
    marginBottom: 8,
    paddingBottom: 3,
    borderBottom: '2 solid #5a6c7d',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  textWrapped: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
    lineHeight: 1.4,
    maxWidth: '100%',
  },
  bulletPoint: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
  bulletPointWrapped: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
    maxWidth: '100%',
  },
});

// ATS-Friendly PDF Styles (LaTeX-inspired minimal design)
const atsStyles = StyleSheet.create({
  page: {
    padding: '0.6in',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000',
    lineHeight: 1.4,
  },
  header: {
    textAlign: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  contactLine: {
    fontSize: 9,
    color: '#333',
    marginBottom: 2,
  },
  divider: {
    borderBottom: '1pt solid #000',
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  sectionTitleUnderline: {
    borderBottom: '0.5pt solid #000',
    marginBottom: 6,
  },
  text: {
    fontSize: 9,
    color: '#000',
    marginBottom: 3,
    lineHeight: 1.3,
  },
  bulletPoint: {
    fontSize: 9,
    color: '#000',
    marginBottom: 2,
    marginLeft: 12,
  },
  bulletPointWrapped: {
    fontSize: 9,
    color: '#000',
    marginBottom: 2,
    marginLeft: 12,
    maxWidth: '100%',
  },
  subsectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
    marginTop: 4,
  },
  dateRight: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#333',
  },
  skillsText: {
    fontSize: 9,
    color: '#000',
    lineHeight: 1.4,
  },
});

// ATS-Friendly Resume PDF Component
const ATSResumePDF = ({ resume }: { resume: typeof initialResumeData }) => (
  <Document>
    <Page size="A4" style={atsStyles.page}>
      {/* Header */}
      <View style={atsStyles.header}>
        <Text style={atsStyles.name}>{resume.personal.fullName || 'YOUR NAME'}</Text>
        <Text style={atsStyles.contactLine}>
          {resume.personal.phone && `${resume.personal.phone} | `}
          {resume.personal.email && `${resume.personal.email}`}
          {resume.personal.linkedin && ` | ${resume.personal.linkedin}`}
        </Text>
        {resume.personal.address && (
          <Text style={atsStyles.contactLine}>{resume.personal.address}</Text>
        )}
      </View>

      <View style={atsStyles.divider}></View>

      {/* Summary */}
      {resume.summary && (
        <View>
          <Text style={atsStyles.sectionTitle}>SUMMARY</Text>
          <View style={atsStyles.sectionTitleUnderline}></View>
          <Text style={atsStyles.text}>{resume.summary}</Text>
        </View>
      )}

      {/* Education */}
      {resume.education.filter(e => e.degree).length > 0 && (
        <View>
          <Text style={atsStyles.sectionTitle}>EDUCATION</Text>
          <View style={atsStyles.sectionTitleUnderline}></View>
          {resume.education.filter(e => e.degree).map((edu, idx) => (
            <View key={idx} style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={atsStyles.subsectionHeader}>
                  {edu.degree} in {edu.department}
                </Text>
                {edu.year && (
                  <Text style={atsStyles.dateRight}>{edu.year}</Text>
                )}
              </View>
              <Text style={atsStyles.text}>
                {edu.institution}
                {edu.cgpa && ` | CGPA: ${edu.cgpa}/10`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Skills */}
      {resume.skills.filter(s => s).length > 0 && (
        <View>
          <Text style={atsStyles.sectionTitle}>SKILLS</Text>
          <View style={atsStyles.sectionTitleUnderline}></View>
          <Text style={atsStyles.skillsText}>
            {resume.skills.filter(s => s).join(', ')}
          </Text>
        </View>
      )}

      {/* Projects */}
      {resume.projects.filter(p => p.title).length > 0 && (
        <View>
          <Text style={atsStyles.sectionTitle}>PROJECTS</Text>
          <View style={atsStyles.sectionTitleUnderline}></View>
          {resume.projects.filter(p => p.title).map((proj, idx) => (
            <View key={idx} style={{ marginBottom: 6 }}>
              <Text style={atsStyles.subsectionHeader}>{proj.title}</Text>
              {proj.technologies && (
                <Text style={{ ...atsStyles.text, fontStyle: 'italic' }}>
                  {proj.technologies}
                </Text>
              )}
              {proj.description && (
                <View>
                  {proj.description.split('\n').filter(line => line.trim()).map((line, i) => (
                    <Text key={i} style={atsStyles.bulletPointWrapped}>
                      {line.trim().startsWith('--') || line.trim().startsWith('•') || line.trim().startsWith('-')
                        ? line.trim()
                        : `-- ${line.trim()}`}
                    </Text>
                  ))}
                </View>
              )}
              {proj.link && (
                <Text style={atsStyles.text}>Link: {proj.link}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Experience */}
      {resume.experience.filter(e => e.jobTitle).length > 0 && (
        <View>
          <Text style={atsStyles.sectionTitle}>EXPERIENCE</Text>
          <View style={atsStyles.sectionTitleUnderline}></View>
          {resume.experience.filter(e => e.jobTitle).map((exp, idx) => (
            <View key={idx} style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={atsStyles.subsectionHeader}>
                  {exp.jobTitle} at {exp.company}
                </Text>
                {exp.duration && (
                  <Text style={atsStyles.dateRight}>{exp.duration}</Text>
                )}
              </View>
              {exp.description && (
                <View>
                  {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                    <Text key={i} style={atsStyles.bulletPointWrapped}>
                      {line.trim().startsWith('--') || line.trim().startsWith('•') || line.trim().startsWith('-')
                        ? line.trim()
                        : `-- ${line.trim()}`}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Certifications */}
      {resume.achievements.filter(a => a.title).length > 0 && (
        <View>
          <Text style={atsStyles.sectionTitle}>CERTIFICATES</Text>
          <View style={atsStyles.sectionTitleUnderline}></View>
          {resume.achievements.filter(a => a.title).map((cert, idx) => (
            <View key={idx} style={{ marginBottom: 3 }}>
              <Text style={atsStyles.text}>
                <Text style={{ fontWeight: 'bold' }}>{cert.title}</Text>
                {cert.description && ` - ${cert.description}`}
                {cert.date && ` (${cert.date})`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Activities and Honors */}
      {resume.extracurricular.filter(e => e.role).length > 0 && (
        <View>
          <Text style={atsStyles.sectionTitle}>ACTIVITIES AND HONORS</Text>
          <View style={atsStyles.sectionTitleUnderline}></View>
          {resume.extracurricular.filter(e => e.role).map((activity, idx) => (
            <View key={idx} style={{ marginBottom: 3 }}>
              <Text style={atsStyles.text}>
                {activity.role} at {activity.organization}
                {activity.duration && ` (${activity.duration})`}
              </Text>
              {activity.description && (
                <View>
                  {activity.description.split('\n').filter(line => line.trim()).map((line, i) => (
                    <Text key={i} style={atsStyles.bulletPointWrapped}>
                      {line.trim().startsWith('--') || line.trim().startsWith('•') || line.trim().startsWith('-')
                        ? line.trim()
                        : `-- ${line.trim()}`}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
);

const ResumePDF = ({ resume }: { resume: typeof initialResumeData }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.header}></View>
      
      {/* Name and Contact */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.name}>{resume.personal.fullName || 'YOUR NAME'}</Text>
        <Text style={pdfStyles.contactInfo}>{resume.personal.address || 'Your Location'}</Text>
        <Text style={pdfStyles.contactInfo}>{resume.personal.phone || 'Your Phone'}</Text>
        <Text style={pdfStyles.contactInfo}>{resume.personal.email || 'Your Email'}</Text>
        {resume.personal.linkedin && (
          <Text style={pdfStyles.contactInfo}>{resume.personal.linkedin}</Text>
        )}
        {resume.personal.github && (
          <Text style={pdfStyles.contactInfo}>{resume.personal.github}</Text>
        )}
      </View>

      {/* Summary */}
      {resume.summary && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>SUMMARY</Text>
          <Text style={pdfStyles.text}>{resume.summary}</Text>
        </View>
      )}

      {/* Skills */}
      {resume.skills.filter(s => s).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>SKILLS</Text>
          {resume.skills.filter(s => s).map((skill, idx) => (
            <Text key={idx} style={pdfStyles.bulletPoint}>• {skill}</Text>
          ))}
        </View>
      )}
      

      {/* Experience */}
      {resume.experience.filter(e => e.jobTitle).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>EXPERIENCE</Text>
          {resume.experience.filter(e => e.jobTitle).map((exp, idx) => (
            <View key={idx} style={{ marginBottom: 8 }}>
              <Text style={{ ...pdfStyles.text, fontWeight: 'bold' }}>
                {exp.jobTitle} at {exp.company}
              </Text>
              <Text style={pdfStyles.text}>{exp.duration}</Text>
              {exp.description && (
                <View>
                  {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                    <Text key={i} style={pdfStyles.textWrapped}>
                      {line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')
                        ? line.trim()
                        : `• ${line.trim()}`}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Education */}
      {resume.education.filter(e => e.degree).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>EDUCATION AND TRAINING</Text>
          {resume.education.filter(e => e.degree).map((edu, idx) => (
            <View key={idx} style={{ marginBottom: 8 }}>
              <Text style={{ ...pdfStyles.text, fontWeight: 'bold' }}>
                {edu.institution}, {edu.year && `Expected in ${edu.year}`}
              </Text>
              <Text style={pdfStyles.text}>
                {edu.degree}: {edu.department} {edu.cgpa && `(CGPA: ${edu.cgpa})`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Projects */}
      {resume.projects.filter(p => p.title).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>PROJECTS</Text>
          {resume.projects.filter(p => p.title).map((proj, idx) => (
            <View key={idx} style={{ marginBottom: 6 }}>
              <Text style={{ ...pdfStyles.text, fontWeight: 'bold' }}>
                • {proj.title} [{proj.technologies}]
              </Text>
              {proj.description && (
                <View style={{ marginLeft: 10 }}>
                  {proj.description.split('\n').filter(line => line.trim()).map((line, i) => (
                    <Text key={i} style={pdfStyles.textWrapped}>
                      {line.trim()}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Certifications */}
      {resume.achievements.filter(a => a.title).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>CERTIFICATIONS</Text>
          {resume.achievements.filter(a => a.title).map((cert, idx) => (
            <Text key={idx} style={pdfStyles.bulletPoint}>• {cert.title} ({cert.date})</Text>
          ))}
        </View>
      )}

      {/* Activities and Honors */}
      {resume.extracurricular.filter(e => e.role).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>ACTIVITIES AND HONORS</Text>
          {resume.extracurricular.filter(e => e.role).map((activity, idx) => (
            <View key={idx} style={{ marginBottom: 6 }}>
              <Text style={pdfStyles.bulletPoint}>
                • {activity.role} at {activity.organization} ({activity.duration})
              </Text>
              {activity.description && (
                <View style={{ marginLeft: 10 }}>
                  {activity.description.split('\n').filter(line => line.trim()).map((line, i) => (
                    <Text key={i} style={pdfStyles.textWrapped}>
                      {line.trim()}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
);

const ResumeBuilder: React.FC = () => {
  const [resume, setResume] = useState(initialResumeData);
  const [errors, setErrors] = useState<any>({});
  const { signOut, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [importingFromResume, setImportingFromResume] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('professional');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('personal');
  const sectionOrder = ['personal','education','skills','experience','projects','achievements','extracurricular','summary'];
  const goNext = () => {
    const i = sectionOrder.indexOf(activeTab);
    if (i >= 0 && i < sectionOrder.length - 1) setActiveTab(sectionOrder[i+1]);
  };
  const goPrev = () => {
    const i = sectionOrder.indexOf(activeTab);
    if (i > 0) setActiveTab(sectionOrder[i-1]);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out successfully', description: 'You have been logged out of your account.' });
  };

  // Auto-save to localStorage whenever resume data changes
  useEffect(() => {
    if (!profile?.id || !autoSaveEnabled) return;
    
    const autoSaveTimer = setTimeout(() => {
      const resumeBackup = {
        id: currentResumeId || `resume_${Date.now()}`,
        student_id: profile.id,
        resume_data: resume,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(`resume_${profile.id}`, JSON.stringify(resumeBackup));
      console.log('Auto-saved to localStorage');
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [resume, profile, currentResumeId, autoSaveEnabled]);

  // Auto-fill and load resume data from Supabase on mount
  useEffect(() => {
    const fetchAndAutoFillResume = async () => {
      if (!profile?.id) return;
      setLoading(true);
      setAutoSaveEnabled(false); // Disable auto-save during initial load
      
      try {
        // Check localStorage first for saved resume
        const savedResume = localStorage.getItem(`resume_${profile.id}`);
        if (savedResume) {
          try {
            const parsed = JSON.parse(savedResume);
            if (parsed.resume_data) {
              // Ensure the loaded data has all required fields
              const loadedResume = {
                ...initialResumeData,
                ...parsed.resume_data,
                personal: {
                  ...initialResumeData.personal,
                  ...parsed.resume_data.personal
                }
              };
              setResume(loadedResume);
              setCurrentResumeId(parsed.id);
              setSaveStatus('✓ Loaded saved resume');
              setTimeout(() => setSaveStatus(null), 3000);
              setLoading(false);
              setAutoSaveEnabled(true); // Re-enable auto-save
              return;
            }
          } catch (e) {
            console.error('Error parsing saved resume:', e);
          }
        }

        // Check if resume_form_data exists in students table (from resume extraction)
        const { data: studentDataCheck } = await supabase
          .from('students')
          .select('resume_form_data')
          .eq('id', profile.id)
          .single();

        if ((studentDataCheck as any)?.resume_form_data) {
          console.log('✅ Found extracted resume data, loading...');
          const extractedResumeData = (studentDataCheck as any).resume_form_data;
          
          // Merge with any existing profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, college')
            .eq('id', profile.id)
            .single();

          // Apply extracted data with fallbacks to profile data
          const mergedResumeData = {
            personal: {
              fullName: extractedResumeData.personal?.fullName || profileData?.full_name || '',
              email: extractedResumeData.personal?.email || profileData?.email || '',
              phone: extractedResumeData.personal?.phone || '',
              address: extractedResumeData.personal?.address || '',
              linkedin: extractedResumeData.personal?.linkedin || '',
              github: extractedResumeData.personal?.github || ''
            },
            education: extractedResumeData.education && extractedResumeData.education.length > 0
              ? extractedResumeData.education
              : [{ degree: '', institution: profileData?.college || '', department: '', year: '', cgpa: '' }],
            skills: extractedResumeData.skills && extractedResumeData.skills.length > 0
              ? extractedResumeData.skills
              : [''],
            experience: extractedResumeData.experience && extractedResumeData.experience.length > 0
              ? extractedResumeData.experience
              : [{ jobTitle: '', company: '', duration: '', description: '' }],
            projects: extractedResumeData.projects && extractedResumeData.projects.length > 0
              ? extractedResumeData.projects
              : [{ title: '', description: '', technologies: '', link: '' }],
            achievements: extractedResumeData.achievements && extractedResumeData.achievements.length > 0
              ? extractedResumeData.achievements
              : [{ title: '', description: '', date: '' }],
            extracurricular: extractedResumeData.extracurricular && extractedResumeData.extracurricular.length > 0
              ? extractedResumeData.extracurricular
              : [{ role: '', organization: '', duration: '', description: '' }],
            summary: extractedResumeData.summary || ''
          };

          setResume(mergedResumeData);
          setSaveStatus('✓ Loaded resume from scanner');
          setTimeout(() => setSaveStatus(null), 3000);
          setLoading(false);
          setAutoSaveEnabled(true);
          return;
        }

        // Fetch profile data (includes full_name, email, college, etc.)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, college')
          .eq('id', profile.id)
          .single();

        // Fetch student data (includes skills, education, experience, projects, etc.)
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('id', profile.id)
          .single();

        // Auto-fill from profile and student data
        const autoFilledResume = {
          personal: {
            fullName: profileData?.full_name || '',
            email: profileData?.email || '',
            phone: (studentData as any)?.phone || '',
            address: (studentData as any)?.address || '',
            linkedin: (studentData as any)?.linkedin_url || '',
            github: (studentData as any)?.github_url || ''
          },
          education: Array.isArray((studentData as any)?.education) && (studentData as any).education.length > 0
            ? (studentData as any).education.map((edu: any) => ({
                degree: edu.degree || '',
                institution: edu.institution || profileData?.college || '',
                department: edu.department || studentData?.department || '',
                year: edu.year || '', // User must enter year manually
                cgpa: edu.cgpa || studentData?.gpa || ''
              }))
            : [{
                degree: '',
                institution: profileData?.college || '',
                department: studentData?.department || '',
                year: '', // User must enter year manually
                cgpa: studentData?.gpa || ''
              }],
          skills: Array.isArray(studentData?.skills) && studentData.skills.length > 0 
            ? studentData.skills 
            : [''],
          experience: Array.isArray((studentData as any)?.experience) && (studentData as any).experience.length > 0
            ? (studentData as any).experience.map((exp: any) => ({
                jobTitle: exp.jobTitle || exp.position || '',
                company: exp.company || '',
                duration: exp.duration || '',
                description: exp.description || ''
              }))
            : [{ jobTitle: '', company: '', duration: '', description: '' }],
          projects: Array.isArray((studentData as any)?.projects) && (studentData as any).projects.length > 0
            ? (studentData as any).projects.map((proj: any) => ({
                title: proj.title || '',
                description: proj.description || '',
                technologies: proj.technologies || '',
                link: proj.link || ''
              }))
            : [{ title: '', description: '', technologies: '', link: '' }],
          achievements: Array.isArray((studentData as any)?.certifications) && (studentData as any).certifications.length > 0
            ? (studentData as any).certifications.map((cert: any) => ({
                title: cert.title || cert.name || '',
                description: cert.description || '',
                date: cert.date || ''
              }))
            : [{ title: '', description: '', date: '' }],
          extracurricular: [{ role: '', organization: '', duration: '', description: '' }],
          summary: studentData?.summary || ''
        };
        
        setResume(autoFilledResume);
        setSaveStatus('✓ Data loaded from your profile');
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (error) {
        console.error('Error fetching resume data:', error);
        setSaveStatus('⚠ Error loading data');
        setTimeout(() => setSaveStatus(null), 3000);
      } finally {
        setLoading(false);
        setAutoSaveEnabled(true); // Re-enable auto-save
      }
    };
    
    fetchAndAutoFillResume();
  }, [profile]);

  // Validation helper
  const validate = () => {
    const newErrors: any = {};
    if (!resume.personal.fullName) newErrors.fullName = "Full Name is required";
    if (!resume.personal.email) newErrors.email = "Email is required";
    // Add more validation as needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResume({
      ...resume,
      personal: {
        ...resume.personal,
        [e.target.name]: e.target.value
      }
    });
  };

  // Education handlers
  const handleEducationChange = (idx: number, field: string, value: string) => {
    const updated = [...resume.education];
    updated[idx][field] = value;
    setResume({ ...resume, education: updated });
  };
  const addEducation = () => {
    setResume({ ...resume, education: [...resume.education, { degree: "", institution: "", department: "", year: "", cgpa: "" }] });
  };
  const removeEducation = (idx: number) => {
    const updated = resume.education.filter((_, i) => i !== idx);
    setResume({ ...resume, education: updated });
  };

  // Skills handlers
  const handleSkillChange = (idx: number, value: string) => {
    const updated = [...resume.skills];
    updated[idx] = value;
    setResume({ ...resume, skills: updated });
  };
  const addSkill = () => {
    setResume({ ...resume, skills: [...resume.skills, ""] });
  };
  const removeSkill = (idx: number) => {
    const updated = resume.skills.filter((_, i) => i !== idx);
    setResume({ ...resume, skills: updated });
  };

  // Experience handlers
  const handleExperienceChange = (idx: number, field: string, value: string) => {
    const updated = [...resume.experience];
    updated[idx][field] = value;
    setResume({ ...resume, experience: updated });
  };
  const addExperience = () => {
    setResume({ ...resume, experience: [...resume.experience, { jobTitle: "", company: "", duration: "", description: "" }] });
  };
  const removeExperience = (idx: number) => {
    const updated = resume.experience.filter((_, i) => i !== idx);
    setResume({ ...resume, experience: updated });
  };

  // Projects handlers
  const handleProjectChange = (idx: number, field: string, value: string) => {
    const updated = [...resume.projects];
    updated[idx][field] = value;
    setResume({ ...resume, projects: updated });
  };
  const addProject = () => {
    setResume({ ...resume, projects: [...resume.projects, { title: "", description: "", technologies: "", link: "" }] });
  };
  const removeProject = (idx: number) => {
    const updated = resume.projects.filter((_, i) => i !== idx);
    setResume({ ...resume, projects: updated });
  };

  // Achievements handlers
  const handleAchievementChange = (idx: number, field: string, value: string) => {
    const updated = [...resume.achievements];
    updated[idx][field] = value;
    setResume({ ...resume, achievements: updated });
  };
  const addAchievement = () => {
    setResume({ ...resume, achievements: [...resume.achievements, { title: "", description: "", date: "" }] });
  };
  const removeAchievement = (idx: number) => {
    const updated = resume.achievements.filter((_, i) => i !== idx);
    setResume({ ...resume, achievements: updated });
  };

  // Extra-curricular handlers
  const handleExtraChange = (idx: number, field: string, value: string) => {
    const updated = [...resume.extracurricular];
    updated[idx][field] = value;
    setResume({ ...resume, extracurricular: updated });
  };
  const addExtra = () => {
    setResume({ ...resume, extracurricular: [...resume.extracurricular, { role: "", organization: "", duration: "", description: "" }] });
  };
  const removeExtra = (idx: number) => {
    const updated = resume.extracurricular.filter((_, i) => i !== idx);
    setResume({ ...resume, extracurricular: updated });
  };

  // Professional resume preview renderer based on the provided template (resume.html/css)
  const renderPreview = () => {
    if (selectedTemplate === 'ats') {
      return renderATSPreview();
    }
    return renderProfessionalPreview();
  };

  // ATS-Friendly Preview (LaTeX-inspired minimal design)
  const renderATSPreview = () => (
    <div style={{
      fontFamily: 'Times New Roman, serif',
      lineHeight: '1.4',
      color: '#000',
      backgroundColor: '#fff',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        padding: '30px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 'bold',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {resume.personal.fullName || 'YOUR NAME'}
          </h1>
          <div style={{ fontSize: '11px', color: '#333', marginBottom: '5px' }}>
            {resume.personal.phone && `${resume.personal.phone} | `}
            {resume.personal.email && `${resume.personal.email}`}
            {resume.personal.linkedin && ` | ${resume.personal.linkedin}`}
          </div>
          {resume.personal.address && (
            <div style={{ fontSize: '11px', color: '#333' }}>{resume.personal.address}</div>
          )}
        </div>

        <div style={{ borderBottom: '1px solid #000', marginBottom: '15px' }}></div>

        {/* Summary */}
        {resume.summary && (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              SUMMARY
            </h2>
            <div style={{ borderBottom: '0.5px solid #000', marginBottom: '8px' }}></div>
            <p style={{ 
              fontSize: '11px', 
              lineHeight: '1.4', 
              textAlign: 'justify',
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word'
            }}>
              {resume.summary}
            </p>
          </div>
        )}

        {/* Education */}
        {resume.education.filter(e => e.degree).length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              EDUCATION
            </h2>
            <div style={{ borderBottom: '0.5px solid #000', marginBottom: '8px' }}></div>
            {resume.education.filter(e => e.degree).map((edu, idx) => (
              <div key={idx} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                    {edu.degree} in {edu.department}
                  </div>
                  {edu.year && (
                    <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333' }}>
                      {edu.year}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                  {edu.institution}
                  {edu.cgpa && ` | CGPA: ${edu.cgpa}/10`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {resume.skills.filter(s => s).length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              SKILLS
            </h2>
            <div style={{ borderBottom: '0.5px solid #000', marginBottom: '8px' }}></div>
            <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
              {resume.skills.filter(s => s).join(', ')}
            </div>
          </div>
        )}

        {/* Projects */}
        {resume.projects.filter(p => p.title).length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              PROJECTS
            </h2>
            <div style={{ borderBottom: '0.5px solid #000', marginBottom: '8px' }}></div>
            {resume.projects.filter(p => p.title).map((proj, idx) => (
              <div key={idx} style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '3px' }}>
                  {proj.title}
                </div>
                {proj.technologies && (
                  <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#333', marginBottom: '3px' }}>
                    {proj.technologies}
                  </div>
                )}
                {proj.description && (
                  <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                    {proj.description.split('\n').map((line, i) => (
                      <div key={i} style={{ 
                        marginLeft: '15px', 
                        marginBottom: '2px',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'break-word'
                      }}>
                        -- {line.trim()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Experience */}
        {resume.experience.filter(e => e.jobTitle).length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              EXPERIENCE
            </h2>
            <div style={{ borderBottom: '0.5px solid #000', marginBottom: '8px' }}></div>
            {resume.experience.filter(e => e.jobTitle).map((exp, idx) => (
              <div key={idx} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                    {exp.jobTitle} at {exp.company}
                  </div>
                  {exp.duration && (
                    <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333' }}>
                      {exp.duration}
                    </div>
                  )}
                </div>
                {exp.description && (
                  <div style={{ fontSize: '11px', lineHeight: '1.4', marginTop: '3px' }}>
                    {exp.description.split('\n').map((line, i) => (
                      <div key={i} style={{ 
                        marginLeft: '15px', 
                        marginBottom: '2px',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'break-word'
                      }}>
                        -- {line.trim()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {resume.achievements.filter(a => a.title).length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              CERTIFICATES
            </h2>
            <div style={{ borderBottom: '0.5px solid #000', marginBottom: '8px' }}></div>
            {resume.achievements.filter(a => a.title).map((cert, idx) => (
              <div key={idx} style={{ 
                fontSize: '11px', 
                marginBottom: '4px',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word'
              }}>
                <strong>{cert.title}</strong>
                {cert.description && ` - ${cert.description}`}
                {cert.date && ` (${cert.date})`}
              </div>
            ))}
          </div>
        )}

        {/* Activities and Honors */}
        {resume.extracurricular.filter(e => e.role).length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              ACTIVITIES AND HONORS
            </h2>
            <div style={{ borderBottom: '0.5px solid #000', marginBottom: '8px' }}></div>
            {resume.extracurricular.filter(e => e.role).map((activity, idx) => (
              <div key={idx} style={{ fontSize: '11px', marginBottom: '4px' }}>
                {activity.role} at {activity.organization}
                {activity.duration && ` (${activity.duration})`}
                {activity.description && (
                  <div style={{ 
                    marginLeft: '15px', 
                    marginTop: '2px',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word'
                  }}>
                    -- {activity.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProfessionalPreview = () => (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      backgroundColor: '#f0f0f0',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header gradient bar */}
        <div style={{
          background: 'linear-gradient(135deg, #5a6c7d, #7a8a9a)',
          height: '40px'
        }}></div>
        
        <div style={{ padding: '30px' }}>
          {/* Profile Section */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '30px',
            gap: '30px'
          }}>
            {/* Profile Image Placeholder */}
            <div style={{
              width: '120px',
              height: '120px',
              border: '2px dashed #ccc',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '3px solid #666',
                borderRadius: '50%',
                position: 'relative',
                background: 'white'
              }}>
                {/* Profile icon head */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '20px',
                  border: '3px solid #666',
                  borderRadius: '50%',
                  background: 'white'
                }}></div>
                {/* Profile icon body */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '35px',
                  height: '20px',
                  border: '3px solid #666',
                  borderRadius: '35px 35px 0 0',
                  borderBottom: 'none',
                  background: 'white'
                }}></div>
              </div>
            </div>
            
            {/* Profile Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#5a6c7d',
                marginBottom: '15px',
                letterSpacing: '2px'
              }}>
                {resume.personal.fullName || 'YOUR NAME'}
              </h1>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ 
                  marginBottom: '8px', 
                  color: '#666', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {resume.personal.address || 'Your Location'}
                </li>
                <li style={{ 
                  marginBottom: '8px', 
                  color: '#666', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {resume.personal.phone || 'Your Phone'}
                </li>
                <li style={{ 
                  marginBottom: '8px', 
                  color: '#666', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {resume.personal.email || 'Your Email'}
                </li>
                {resume.personal.linkedin && (
                  <li style={{ 
                    marginBottom: '8px', 
                    color: '#666', 
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {resume.personal.linkedin}
                  </li>
                )}
                {resume.personal.github && (
                  <li style={{ 
                    marginBottom: '8px', 
                    color: '#666', 
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {resume.personal.github}
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Summary Section */}
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#333',
              marginBottom: '10px',
              paddingBottom: '5px',
              borderBottom: '2px solid #5a6c7d',
              letterSpacing: '1px'
            }}>
              SUMMARY
            </h2>
            <p style={{
              color: '#666',
              fontSize: '14px',
              lineHeight: '1.5',
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word'
            }}>
              {resume.summary || 'Your professional summary will appear here...'}
            </p>
          </div>

          {/* Skills Section */}
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#333',
              marginBottom: '10px',
              paddingBottom: '5px',
              borderBottom: '2px solid #5a6c7d',
              letterSpacing: '1px'
            }}>
              SKILLS
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {resume.skills.filter(s => s).slice(0, Math.ceil(resume.skills.filter(s => s).length / 2)).map((skill, idx) => (
                  <li key={idx} style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                    <span style={{ color: '#5a6c7d', marginRight: '8px' }}>•</span>
                    {skill}
                  </li>
                ))}
              </ul>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {resume.skills.filter(s => s).slice(Math.ceil(resume.skills.filter(s => s).length / 2)).map((skill, idx) => (
                  <li key={idx} style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                    <span style={{ color: '#5a6c7d', marginRight: '8px' }}>•</span>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Experience Section */}
          {resume.experience.filter(e => e.jobTitle).length > 0 && (
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: '#333',
                marginBottom: '10px',
                paddingBottom: '5px',
                borderBottom: '2px solid #5a6c7d',
                letterSpacing: '1px'
              }}>
                EXPERIENCE
              </h2>
              {resume.experience.filter(e => e.jobTitle).map((exp, idx) => (
                <div key={idx} style={{ marginBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>
                    {exp.jobTitle} at {exp.company}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px', marginTop: '2px' }}>
                    {exp.duration}
                  </div>
                  <div style={{ 
                    color: '#666', 
                    fontSize: '14px', 
                    marginTop: '2px',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word'
                  }}>
                    {exp.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Education Section */}
          {resume.education.filter(e => e.degree).length > 0 && (
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: '#333',
                marginBottom: '10px',
                paddingBottom: '5px',
                borderBottom: '2px solid #5a6c7d',
                letterSpacing: '1px'
              }}>
                EDUCATION AND TRAINING
              </h2>
              {resume.education.filter(e => e.degree).map((edu, idx) => (
                <div key={idx} style={{ marginBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>
                    {edu.institution}, {edu.year && `Expected in ${edu.year}`}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px', marginTop: '2px' }}>
                    {edu.degree}: {edu.department} {edu.cgpa && `(CGPA: ${edu.cgpa})`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Projects Section */}
          {resume.projects.filter(p => p.title).length > 0 && (
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: '#333',
                marginBottom: '10px',
                paddingBottom: '5px',
                borderBottom: '2px solid #5a6c7d',
                letterSpacing: '1px'
              }}>
                PROJECTS
              </h2>
              {resume.projects.filter(p => p.title).map((proj, idx) => (
                <div key={idx} style={{ 
                  color: '#666', 
                  fontSize: '14px', 
                  marginBottom: '5px',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word'
                }}>
                  <span style={{ color: '#5a6c7d', marginRight: '8px' }}>•</span>
                  <strong>{proj.title}</strong>: {proj.description} [{proj.technologies}]
                  {proj.link && (
                    <span> - <a href={proj.link} target="_blank" rel="noopener noreferrer" style={{ color: '#5a6c7d' }}>View Project</a></span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Certifications Section */}
          {resume.achievements.filter(a => a.title).length > 0 && (
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: '#333',
                marginBottom: '10px',
                paddingBottom: '5px',
                borderBottom: '2px solid #5a6c7d',
                letterSpacing: '1px'
              }}>
                CERTIFICATIONS
              </h2>
              {resume.achievements.filter(a => a.title).map((cert, idx) => (
                <div key={idx} style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                  <span style={{ color: '#5a6c7d', marginRight: '8px' }}>•</span>
                  {cert.title} {cert.date && `(${cert.date})`}
                  {cert.description && (
                    <div style={{ 
                      marginLeft: '16px', 
                      marginTop: '2px', 
                      fontSize: '13px',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word'
                    }}>
                      {cert.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Activities and Honors Section */}
          {resume.extracurricular.filter(e => e.role).length > 0 && (
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: '#333',
                marginBottom: '10px',
                paddingBottom: '5px',
                borderBottom: '2px solid #5a6c7d',
                letterSpacing: '1px'
              }}>
                ACTIVITIES AND HONORS
              </h2>
              {resume.extracurricular.filter(e => e.role).map((activity, idx) => (
                <div key={idx} style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                  <span style={{ color: '#5a6c7d', marginRight: '8px' }}>•</span>
                  {activity.role} at {activity.organization} {activity.duration && `(${activity.duration})`}
                  {activity.description && (
                    <div style={{ 
                      marginLeft: '16px', 
                      marginTop: '2px', 
                      fontSize: '13px',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word'
                    }}>
                      {activity.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Save resume data to Supabase with complete data persistence
  const handleSaveResume = async () => {
    if (!profile?.id) {
      setSaveStatus('⚠ Please log in to save your resume');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }
    
    setLoading(true);
    
    try {
      // Update the students table with ALL resume data
      const updatePayload: any = {
        education: resume.education.filter(e => e.degree),
        experience: resume.experience.filter(e => e.jobTitle),
        projects: resume.projects.filter(p => p.title),
        skills: resume.skills.filter(s => s),
        summary: resume.summary || null,
      };

      // Add contact info if provided
      if (resume.personal.phone) updatePayload.phone = resume.personal.phone;
      if (resume.personal.linkedin) updatePayload.linkedin_url = resume.personal.linkedin;
      if (resume.personal.github) updatePayload.github_url = resume.personal.github;
      if (resume.personal.address) updatePayload.address = resume.personal.address;
      
      // Add certifications/achievements
      if (resume.achievements.filter(a => a.title).length > 0) {
        updatePayload.certifications = resume.achievements.filter(a => a.title);
      }

      const { error: studentError } = await supabase
        .from('students')
        .update(updatePayload)
        .eq('id', profile.id);

      if (studentError) {
        console.error('Error updating student data:', studentError);
        throw studentError;
      }

      // Also update profile table with name and email if changed
      if (resume.personal.fullName || resume.personal.email) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: resume.personal.fullName,
            email: resume.personal.email,
          })
          .eq('id', profile.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }

      // Save complete resume to localStorage as persistent backup
      const resumeBackup = {
        id: currentResumeId || `resume_${Date.now()}`,
        student_id: profile.id,
        resume_data: resume,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(`resume_${profile.id}`, JSON.stringify(resumeBackup));
      
      setSaveStatus('✓ Resume saved successfully!');
    } catch (error) {
      console.error('Error saving resume:', error);
      setSaveStatus('✗ Error saving resume. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Import data from uploaded resume (extracted by Resume Scanner)
  const handleImportFromResume = async () => {
    if (!profile?.id) {
      setSaveStatus('⚠ Please log in to import data');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }
    
    setImportingFromResume(true);
    setSaveStatus('Importing data from uploaded resume...');
    
    try {
      // Fetch the extracted data from the students table
      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', profile.id)
        .single();

      if (error) throw error;

      if (!studentData?.resume_url) {
        setSaveStatus('⚠ No resume found. Please upload a resume in Resume Scanner first.');
        setTimeout(() => setSaveStatus(null), 4000);
        return;
      }

      // Fetch profile data for name and email
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, college')
        .eq('id', profile.id)
        .single();

      // Map the extracted data to resume format
      const importedResume = {
        personal: {
          fullName: profileData?.full_name || resume.personal.fullName,
          email: profileData?.email || resume.personal.email,
          phone: (studentData as any)?.phone || resume.personal.phone,
          address: (studentData as any)?.address || resume.personal.address,
          linkedin: (studentData as any)?.linkedin_url || resume.personal.linkedin,
          github: (studentData as any)?.github_url || resume.personal.github
        },
        education: Array.isArray((studentData as any)?.education) && (studentData as any).education.length > 0
          ? (studentData as any).education.map((edu: any) => ({
              degree: edu.degree || '',
              institution: edu.institution || profileData?.college || '',
              department: edu.department || studentData?.department || '',
              year: edu.year || '',
              cgpa: edu.cgpa || studentData?.gpa || ''
            }))
          : resume.education,
        skills: Array.isArray(studentData?.skills) && studentData.skills.length > 0
          ? studentData.skills
          : resume.skills,
        experience: Array.isArray((studentData as any)?.experience) && (studentData as any).experience.length > 0
          ? (studentData as any).experience.map((exp: any) => {
              // Handle both string format (from AI extraction) and object format
              if (typeof exp === 'string') {
                // Parse string format like "Software Engineer at ABC Company (2020-2022): Description"
                const match = exp.match(/^(.+?)\s+at\s+(.+?)(?:\s*\(([^)]+)\))?:\s*(.+)$/);
                if (match) {
                  return {
                    jobTitle: match[1].trim(),
                    company: match[2].trim(),
                    duration: match[3]?.trim() || '',
                    description: match[4].trim()
                  };
                }
                // Fallback if format doesn't match
                return {
                  jobTitle: '',
                  company: '',
                  duration: '',
                  description: exp
                };
              }
              // Handle object format
              return {
                jobTitle: exp.jobTitle || exp.position || '',
                company: exp.company || '',
                duration: exp.duration || '',
                description: exp.description || ''
              };
            })
          : resume.experience,
        projects: Array.isArray((studentData as any)?.projects) && (studentData as any).projects.length > 0
          ? (studentData as any).projects.map((proj: any) => {
              // Handle both string format and object format
              if (typeof proj === 'string') {
                // Parse string format like "Project Name: Description [Technologies]"
                const match = proj.match(/^(.+?):\s*(.+?)(?:\s*\[([^\]]+)\])?$/);
                if (match) {
                  return {
                    title: match[1].trim(),
                    description: match[2].trim(),
                    technologies: match[3]?.trim() || '',
                    link: ''
                  };
                }
                // Fallback
                return {
                  title: proj.substring(0, 50),
                  description: proj,
                  technologies: '',
                  link: ''
                };
              }
              // Handle object format
              return {
                title: proj.title || '',
                description: proj.description || '',
                technologies: proj.technologies || '',
                link: proj.link || ''
              };
            })
          : resume.projects,
        achievements: Array.isArray((studentData as any)?.certifications) && (studentData as any).certifications.length > 0
          ? (studentData as any).certifications.map((cert: any) => ({
              title: cert.title || cert.name || '',
              description: cert.description || '',
              date: cert.date || ''
            }))
          : resume.achievements,
        extracurricular: resume.extracurricular, // Keep existing or empty
        summary: studentData?.summary || resume.summary
      };

      setResume(importedResume);
      setSaveStatus('✓ Successfully imported data from your uploaded resume!');
      setTimeout(() => setSaveStatus(null), 4000);
      
    } catch (error) {
      console.error('Error importing from resume:', error);
      setSaveStatus('✗ Failed to import data. Please try again.');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setImportingFromResume(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 transition-colors duration-300">
      {/* Unified Header like Resume Scanner */}
      <header className="glass-panel backdrop-blur-xl border-b border-white/15 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  TalentMap
                </span>
                <div className="text-xs text-muted-foreground">Student Portal</div>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/student-dashboard">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">Dashboard</Button>
                </Link>
                <Link to="/student-details">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">Details</Button>
                </Link>
                <Link to="/resume-scanner">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">Resume Scanner</Button>
                </Link>
                <Link to="/resume-builder">
                  <Button variant="secondary" size="sm" className="">Resume Builder</Button>
                </Link>
              </div>
              <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'S'}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{profile?.full_name}</div>
                  <div className="text-xs text-muted-foreground">Student</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Resume Builder</h1>
          <div className="flex items-center gap-4">
            {/* Template Selector */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
                className="bg-transparent border-none outline-none font-medium text-sm cursor-pointer text-gray-700 dark:text-gray-300"
              >
                <option value="professional">Professional Template</option>
                <option value="ats">ATS-Friendly Template</option>
              </select>
            </div>
            
            {/* Import from Resume Scanner button */}
            <button
              onClick={handleImportFromResume}
              disabled={importingFromResume || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              title="Import data from your uploaded resume"
            >
              <Upload className="w-4 h-4" />
              {importingFromResume ? 'Importing...' : 'Import from Resume'}
            </button>
            
            {saveStatus && (
              <div className={`text-sm font-medium px-4 py-2 rounded-lg ${
                saveStatus.includes('✓') 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                  : saveStatus.includes('⚠') || saveStatus.includes('✗')
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              }`}>
                {saveStatus}
              </div>
            )}
          </div>
        </div>
  <div className="grid grid-cols-2 gap-8">
          {/* Form Section with Tabs */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="glass-panel mb-4 overflow-x-auto">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="extracurricular">Extracurricular</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
            {/* Info Card for Import Feature */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    💡 Pro Tip: Import from Resume Scanner
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-200">
                    Already uploaded a resume in <Link to="/resume-scanner" className="underline font-medium hover:text-purple-900">Resume Scanner</Link>? 
                    Click the <strong>"Import from Resume"</strong> button above to automatically fill this form with AI-extracted data from your uploaded resume!
                  </p>
                </div>
              </div>
            </div>

            {/* Template Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Palette className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    📋 Choose Your Template
                  </h3>
                  <div className="text-sm text-blue-700 dark:text-blue-200 space-y-2">
                    <div>
                      <strong>Professional Template:</strong> Modern design with colors and visual elements. Best for creative roles and general applications.
                    </div>
                    <div>
                      <strong>ATS-Friendly Template:</strong> Clean, minimal LaTeX-inspired design optimized for Applicant Tracking Systems. Best for corporate jobs and when passing through automated screening.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Personal Info Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium">Full Name</label>
                  <input type="text" name="fullName" value={resume.personal.fullName} onChange={handlePersonalChange} className="input input-bordered w-full" required />
                  {errors.fullName && <span className="text-red-500 text-sm">{errors.fullName}</span>}
                </div>
                <div>
                  <label className="block font-medium">Email</label>
                  <input type="email" name="email" value={resume.personal.email} onChange={handlePersonalChange} className="input input-bordered w-full" required />
                  {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
                </div>
                <div>
                  <label className="block font-medium">Phone</label>
                  <input type="text" name="phone" value={resume.personal.phone} onChange={handlePersonalChange} className="input input-bordered w-full" />
                </div>
                <div>
                  <label className="block font-medium">Address</label>
                  <input type="text" name="address" value={resume.personal.address} onChange={handlePersonalChange} className="input input-bordered w-full" />
                </div>
                <div>
                  <label className="block font-medium">LinkedIn</label>
                  <input type="text" name="linkedin" value={resume.personal.linkedin} onChange={handlePersonalChange} className="input input-bordered w-full" />
                </div>
                <div>
                  <label className="block font-medium">GitHub</label>
                  <input type="text" name="github" value={resume.personal.github} onChange={handlePersonalChange} className="input input-bordered w-full" />
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <span />
              <Button onClick={goNext}>Next</Button>
            </div>
            </TabsContent>

            <TabsContent value="education">
            {/* Education Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Education</h2>
              {resume.education.map((edu, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <label className="font-medium">Degree:</label>
                  <input type="text" placeholder="Degree" value={edu.degree}
                    onChange={e => handleEducationChange(idx, "degree", e.target.value)}
                    className="input input-bordered" />

                  <label className="font-medium">Institution:</label>
                  <input type="text" placeholder="Institution" value={edu.institution}
                    onChange={e => handleEducationChange(idx, "institution", e.target.value)}
                    className="input input-bordered" />

                  <label className="font-medium">Department:</label>
                  <input type="text" placeholder="Department" value={edu.department}
                    onChange={e => handleEducationChange(idx, "department", e.target.value)}
                    className="input input-bordered" />

                  <label className="font-medium">Year:</label>
                  <input type="text" placeholder="Year" value={edu.year}
                    onChange={e => handleEducationChange(idx, "year", e.target.value)}
                    className="input input-bordered" />

                  <label className="font-medium">CGPA:</label>
                  <input type="text" placeholder="CGPA" value={edu.cgpa}
                    onChange={e => handleEducationChange(idx, "cgpa", e.target.value)}
                    className="input input-bordered" />

                  <button type="button" onClick={() => removeEducation(idx)} className="text-red-500 ml-2">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addEducation} className="mt-2 text-blue-600">+ Add Education</button>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={goPrev}>Previous</Button>
              <Button onClick={goNext}>Next</Button>
            </div>
            </TabsContent>

            <TabsContent value="skills">
            {/* Skills Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Skills</h2>
              {resume.skills.map((skill, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <input type="text" placeholder="Skill" value={skill} onChange={e => handleSkillChange(idx, e.target.value)} className="input input-bordered" />
                  <button type="button" onClick={() => removeSkill(idx)} className="text-red-500 ml-2">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addSkill} className="mt-2 text-blue-600">+ Add Skill</button>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={goPrev}>Previous</Button>
              <Button onClick={goNext}>Next</Button>
            </div>
            </TabsContent>

            <TabsContent value="experience">
            {/* Experience Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Experience</h2>
              {resume.experience.map((exp, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 mb-4 p-3 border rounded">
                  <label className="font-medium">Job Title:</label>
                  <input type="text" placeholder="Job Title" value={exp.jobTitle} onChange={e => handleExperienceChange(idx, "jobTitle", e.target.value)} className="input input-bordered w-full" />
                  
                  <label className="font-medium">Company:</label>
                  <input type="text" placeholder="Company" value={exp.company} onChange={e => handleExperienceChange(idx, "company", e.target.value)} className="input input-bordered w-full" />
                  
                  <label className="font-medium">Duration:</label>
                  <input type="text" placeholder="e.g., Jan 2023 - Present" value={exp.duration} onChange={e => handleExperienceChange(idx, "duration", e.target.value)} className="input input-bordered w-full" />
                  
                  <label className="font-medium">Description (use Enter for new lines):</label>
                  <textarea 
                    placeholder="• Managed a team of 5 developers&#10;• Increased efficiency by 40%&#10;• Led 3 major projects"
                    value={exp.description} 
                    onChange={e => handleExperienceChange(idx, "description", e.target.value)} 
                    className="textarea textarea-bordered w-full h-32" 
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">💡 Tip: Use bullet points (•) or dashes (-) at the start of each line for structured formatting</p>
                  
                  <button type="button" onClick={() => removeExperience(idx)} className="text-red-500 mt-2 hover:text-red-700">Remove Experience</button>
                </div>
              ))}
              <button type="button" onClick={addExperience} className="mt-2 text-blue-600 hover:text-blue-800 font-medium">+ Add Experience</button>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={goPrev}>Previous</Button>
              <Button onClick={goNext}>Next</Button>
            </div>
            </TabsContent>

            <TabsContent value="projects">
            {/* Projects Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Projects</h2>
              {resume.projects.map((proj, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 mb-4 p-3 border rounded">
                  <label className="font-medium">Title:</label>
                  <input type="text" placeholder="Project Title" value={proj.title} onChange={e => handleProjectChange(idx, "title", e.target.value)} className="input input-bordered w-full" />
                  
                  <label className="font-medium">Description (use Enter for new lines):</label>
                  <textarea 
                    placeholder="• Built a web application using React and Node.js&#10;• Implemented user authentication&#10;• Deployed on AWS with 99% uptime"
                    value={proj.description} 
                    onChange={e => handleProjectChange(idx, "description", e.target.value)} 
                    className="textarea textarea-bordered w-full h-32" 
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">💡 Tip: Each line will be displayed as a separate bullet point</p>
                  
                  <label className="font-medium">Technologies:</label>
                  <input type="text" placeholder="React, Node.js, MongoDB" value={proj.technologies} onChange={e => handleProjectChange(idx, "technologies", e.target.value)} className="input input-bordered w-full" />
                  
                  <label className="font-medium">Link:</label>
                  <input type="text" placeholder="https://github.com/username/project" value={proj.link} onChange={e => handleProjectChange(idx, "link", e.target.value)} className="input input-bordered w-full" />
                  
                  <button type="button" onClick={() => removeProject(idx)} className="text-red-500 mt-2 hover:text-red-700">Remove Project</button>
                </div>
              ))}
              <button type="button" onClick={addProject} className="mt-2 text-blue-600 hover:text-blue-800 font-medium">+ Add Project</button>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={goPrev}>Previous</Button>
              <Button onClick={goNext}>Next</Button>
            </div>
            </TabsContent>

            <TabsContent value="achievements">
            {/* Achievements/Certifications Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Achievements / Certifications</h2>
              {resume.achievements.map((ach, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  <label className="font-medium">Title:</label>
                  <input type="text" placeholder="Title" value={ach.title} onChange={e => handleAchievementChange(idx, "title", e.target.value)} className="input input-bordered" />
                  <label className="font-medium">Description:</label>
                  <input type="text" placeholder="Description" value={ach.description} onChange={e => handleAchievementChange(idx, "description", e.target.value)} className="input input-bordered" />
                  <label className="font-medium">Date:</label>
                  <input type="text" placeholder="Date" value={ach.date} onChange={e => handleAchievementChange(idx, "date", e.target.value)} className="input input-bordered" />
                  <button type="button" onClick={() => removeAchievement(idx)} className="text-red-500 ml-2">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addAchievement} className="mt-2 text-blue-600">+ Add Achievement</button>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={goPrev}>Previous</Button>
              <Button onClick={goNext}>Next</Button>
            </div>
            </TabsContent>

            <TabsContent value="extracurricular">
            {/* Extra-curricular/Volunteer Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Extra-curricular / Volunteer</h2>
              {resume.extracurricular.map((ex, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 mb-4 p-3 border rounded">
                  <label className="font-medium">Role:</label>
                  <input type="text" placeholder="e.g., President, Volunteer" value={ex.role} onChange={e => handleExtraChange(idx, "role", e.target.value)} className="input input-bordered w-full" />
                  
                  <label className="font-medium">Organization:</label>
                  <input type="text" placeholder="Organization name" value={ex.organization} onChange={e => handleExtraChange(idx, "organization", e.target.value)} className="input input-bordered w-full" />
                  
                  <label className="font-medium">Duration:</label>
                  <input type="text" placeholder="e.g., 2022 - 2024" value={ex.duration} onChange={e => handleExtraChange(idx, "duration", e.target.value)} className="input input-bordered w-full" />
                  
                  <label className="font-medium">Description (use Enter for new lines):</label>
                  <textarea 
                    placeholder="• Organized 5 community events&#10;• Led team of 10 volunteers&#10;• Raised $5000 for charity"
                    value={ex.description} 
                    onChange={e => handleExtraChange(idx, "description", e.target.value)} 
                    className="textarea textarea-bordered w-full h-24" 
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">💡 Tip: Use bullet points for better formatting</p>
                  
                  <button type="button" onClick={() => removeExtra(idx)} className="text-red-500 mt-2 hover:text-red-700">Remove Activity</button>
                </div>
              ))}
              <button type="button" onClick={addExtra} className="mt-2 text-blue-600 hover:text-blue-800 font-medium">+ Add Extra-curricular</button>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={goPrev}>Previous</Button>
              <Button onClick={goNext}>Next</Button>
            </div>
            </TabsContent>

            <TabsContent value="summary">
            {/* Summary Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Professional Summary</h2>
              <textarea name="summary" value={resume.summary} onChange={e => setResume({ ...resume, summary: e.target.value })} className="input input-bordered w-full" rows={3} />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={goPrev}>Previous</Button>
              <span />
            </div>
            </TabsContent>
            </Tabs>
          </div>
          {/* Preview Section */}
          <div className="sticky top-28 self-start mt-16" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
            <div className="bg-gray-50 dark:bg-gray-800 rounded shadow p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-400">Resume Preview</h2>
                <div className="flex items-center gap-2 text-sm">
                  <Palette className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {selectedTemplate === 'professional' ? 'Professional' : 'ATS-Friendly'}
                  </span>
                </div>
              </div>
              <div className="overflow-auto">
                <div className="origin-top mx-auto" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                  {renderPreview()}
                </div>
              </div>
            <div className="p-2 flex gap-4 items-center">
              <PDFDownloadLink 
                document={selectedTemplate === 'professional' ? <ResumePDF resume={resume} /> : <ATSResumePDF resume={resume} />} 
                fileName={`resume_${selectedTemplate}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <button type="button" className="w-full p-2 rounded gradient-primary text-white">
                    {pdfLoading ? 'Preparing PDF...' : `Download ${selectedTemplate === 'professional' ? 'Professional' : 'ATS'} Resume`}
                  </button>
                )}
              </PDFDownloadLink>
              {/* <button 
                type="button" 
                onClick={handleSaveResume} 
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded shadow font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Resume'}
              </button> */}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Auto-save
              </span>
            </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
