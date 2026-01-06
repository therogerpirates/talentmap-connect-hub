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
import StudentSidebar from '@/components/StudentSidebar';

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
    github: "",
    leetcode: ""
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
          {resume.personal.leetcode && ` | ${resume.personal.leetcode}`}
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
        {resume.personal.leetcode && (
          <Text style={pdfStyles.contactInfo}>{resume.personal.leetcode}</Text>
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
          <Text style={pdfStyles.sectionTitle}>EDUCATION</Text>
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

const ResumeStepper = ({ currentStep, steps, onStepClick }: { currentStep: string, steps: string[], onStepClick: (step: string) => void }) => {
  return (
    <div className="flex w-full overflow-x-auto pb-4 pt-2 gap-1 no-scrollbar scrollbar-hide">
      {steps.map((step, index) => {
        const isActive = step === currentStep;
        const isPast = steps.indexOf(currentStep) > index;

        return (
          <button
            key={step}
            onClick={() => onStepClick(step)}
            className={`
              relative flex items-center justify-center px-4 py-1.5 text-xs font-semibold
              transition-all duration-300 min-w-[100px]
              ${isActive
                ? 'bg-blue-600 text-white shadow-md z-10'
                : isPast
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'
              }
            `}
            style={{
              clipPath: index === steps.length - 1
                ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 10% 50%)'
                : 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)',
              paddingLeft: index === 0 ? '16px' : '20px',
              marginLeft: index === 0 ? '0' : '-12px'
            }}
          >
            <span className="capitalize whitespace-nowrap">{step}</span>
          </button>
        );
      })}
    </div>
  );
};

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
  const sectionOrder = ['personal', 'education', 'skills', 'experience', 'projects', 'achievements', 'extracurricular', 'summary'];
  const goNext = () => {
    const i = sectionOrder.indexOf(activeTab);
    if (i >= 0 && i < sectionOrder.length - 1) setActiveTab(sectionOrder[i + 1]);
  };
  const goPrev = () => {
    const i = sectionOrder.indexOf(activeTab);
    if (i > 0) setActiveTab(sectionOrder[i - 1]);
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
              github: extractedResumeData.personal?.github || '',
              leetcode: extractedResumeData.personal?.leetcode || ''
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
            github: (studentData as any)?.github_url || '',
            leetcode: (studentData as any)?.leetcode_url || ''
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
          {resume.personal.leetcode && ` | ${resume.personal.leetcode}`}
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
              {resume.personal.leetcode && (
                <li style={{
                  marginBottom: '8px',
                  color: '#666',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {resume.personal.leetcode}
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
  </div >
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
    if (resume.personal.leetcode) updatePayload.leetcode_url = resume.personal.leetcode;
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
        github: (studentData as any)?.github_url || resume.personal.github,
        leetcode: (studentData as any)?.leetcode_url || resume.personal.leetcode
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

// Render Field Input Helper with clean UI
// Render Field Input Helper with clean UI - COMPACT VERSION
const renderField = (label: string, name: string, value: string, placeholder: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type = "text") => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-slate-700">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-2 rounded-md border text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${errors[name] ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'}`}
    />
    {errors[name] && <p className="text-[10px] text-red-500 mt-0.5">{errors[name]}</p>}
  </div>
);

return (
  <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
    <StudentSidebar />
    <main className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Header / Stepper Area */}
      <div className="bg-white border-b border-slate-200 p-2 shrink-0 shadow-sm z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          {/* Styled Stepper */}
          <div className="flex-1 w-full md:w-auto overflow-hidden">
            <ResumeStepper
              currentStep={activeTab}
              steps={sectionOrder}
              onStepClick={setActiveTab}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
                className="appearance-none bg-white border border-slate-300 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-400 transition-colors cursor-pointer"
              >
                <option value="professional">Professional Template</option>
                <option value="ats">ATS-Friendly Template</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleImportFromResume}
              disabled={loading || importingFromResume}
              className="font-medium text-slate-700 border-slate-300 hover:bg-slate-50 h-8 text-xs px-3"
            >
              {importingFromResume ? <span className="animate-spin mr-2">⏳</span> : <Upload className="w-3.5 h-3.5 mr-2" />}
              Import
            </Button>

            <PDFDownloadLink
              document={selectedTemplate === 'ats' ? <ATSResumePDF resume={resume} /> : <ResumePDF resume={resume} />}
              fileName={`TalentMap_Resume_${profile?.full_name?.replace(/\s+/g, '_') || 'Student'}.pdf`}
              className="inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 text-white hover:bg-blue-700 h-8 px-3 py-1.5 shadow-sm"
            >
              {({ loading: pdfLoading }) => (pdfLoading ? 'Loading...' : <><DownloadIcon className="w-3.5 h-3.5 mr-2" /> PDF</>)}
            </PDFDownloadLink>
          </div>
        </div>
      </div>

      {/* Split View Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Form Input */}
        <div className="w-full md:w-5/12 lg:w-5/12 overflow-y-auto p-6 md:p-8 bg-white/50">
          <div className="max-w-3xl mx-auto pb-20"> {/* pb-20 for bottom button space */}
            {/* Personal Details */}
            {activeTab === 'personal' && (
              <div className="space-y-3 animate-in slide-in-from-left-4 duration-300">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-1">Personal Details</h2>
                <div className="grid gap-3">
                  {renderField("Full Name", "fullName", resume.personal.fullName, "e.g., John Doe", handlePersonalChange)}
                  {renderField("Email Address", "email", resume.personal.email, "e.g., john.doe@example.com", handlePersonalChange, "email")}
                  {renderField("Phone Number", "phone", resume.personal.phone, "e.g., +1 123 456 7890", handlePersonalChange, "tel")}
                  {renderField("Address / Location", "address", resume.personal.address, "e.g., New York, NY", handlePersonalChange)}
                  {renderField("LinkedIn Profile (Optional)", "linkedin", resume.personal.linkedin, "Link to your LinkedIn profile", handlePersonalChange)}
                  {renderField("GitHub Profile (Optional)", "github", resume.personal.github, "Link to your GitHub profile", handlePersonalChange)}
                  {renderField("LeetCode Profile (Optional)", "leetcode", resume.personal.leetcode, "Link to your LeetCode profile", handlePersonalChange)}
                </div>
              </div>
            )}

            {/* Other Tabs Logic - Simplified for brevity but needs full implementation */}
            {activeTab === 'education' && (
              <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-1">Education</h2>
                {resume.education.map((edu, index) => (
                  <div key={index} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2 relative group">
                    <button onClick={() => removeEducation(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <LogOut className="w-3.5 h-3.5 rotate-180" /> {/* Using LogOut as delete icon proxy if Trash2 not imported, but User used Trash2 elsewhere */}
                    </button>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Institution</label>
                        <input
                          value={edu.institution}
                          onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                          placeholder="University Name"
                          className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Degree</label>
                        <input
                          value={edu.degree}
                          onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                          placeholder="e.g. B.Tech"
                          className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Department</label>
                        <input
                          value={edu.department}
                          onChange={(e) => handleEducationChange(index, 'department', e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Year</label>
                        <input
                          value={edu.year}
                          onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                          placeholder="2024"
                          className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">CGPA</label>
                        <input
                          value={edu.cgpa}
                          onChange={(e) => handleEducationChange(index, 'cgpa', e.target.value)}
                          placeholder="e.g. 9.5"
                          className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addEducation} className="w-full border-dashed border-2 py-3 text-sm text-slate-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50">
                  + Add Education
                </Button>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill, index) => (
                    <div key={index} className="relative group">
                      <input
                        value={skill}
                        onChange={(e) => handleSkillChange(index, e.target.value)}
                        placeholder="Skill"
                        className="px-4 py-2 rounded-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all w-[150px] text-center text-sm"
                      />
                      <button onClick={() => removeSkill(index)} className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-sm hover:bg-red-200 transition-all">
                        <LogOut className="w-3 h-3 rotate-180" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addSkill} className="px-4 py-2 rounded-full border border-dashed border-slate-300 text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all text-sm font-medium">
                    + Add Skill
                  </button>
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-1">Experience</h2>
                {resume.experience.map((exp, index) => (
                  <div key={index} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2 relative group">
                    <button onClick={() => removeExperience(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                      <LogOut className="w-3.5 h-3.5 rotate-180" />
                    </button>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Company</label>
                        <input value={exp.company} onChange={(e) => handleExperienceChange(index, 'company', e.target.value)} placeholder="Company Name" className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Role / Job Title</label>
                        <input value={exp.jobTitle} onChange={(e) => handleExperienceChange(index, 'jobTitle', e.target.value)} placeholder="e.g. Software Intern" className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Duration</label>
                        <input value={exp.duration} onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)} placeholder="e.g. Jan 2023 - Present" className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Description</label>
                        <textarea value={exp.description} onChange={(e) => handleExperienceChange(index, 'description', e.target.value)} placeholder="Describe your responsibilities and achievements..." className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none min-h-[60px] text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addExperience} className="w-full border-dashed border-2 py-3 text-sm text-slate-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50">
                  + Add Experience
                </Button>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-1">Projects</h2>
                {resume.projects.map((proj, index) => (
                  <div key={index} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2 relative group">
                    <button onClick={() => removeProject(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                      <LogOut className="w-3.5 h-3.5 rotate-180" />
                    </button>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Project Title</label>
                        <input value={proj.title} onChange={(e) => handleProjectChange(index, 'title', e.target.value)} placeholder="Project Name" className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Technologies Used</label>
                        <input value={proj.technologies} onChange={(e) => handleProjectChange(index, 'technologies', e.target.value)} placeholder="e.g. React, Node.js, MongoDB" className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Project Link</label>
                        <input value={proj.link} onChange={(e) => handleProjectChange(index, 'link', e.target.value)} placeholder="https://..." className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Description</label>
                        <textarea value={proj.description} onChange={(e) => handleProjectChange(index, 'description', e.target.value)} placeholder="Describe the project..." className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none min-h-[60px] text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addProject} className="w-full border-dashed border-2 py-3 text-sm text-slate-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50">
                  + Add Project
                </Button>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-1">Achievements / Certifications</h2>
                {resume.achievements.map((ach, index) => (
                  <div key={index} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2 relative group">
                    <button onClick={() => removeAchievement(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                      <LogOut className="w-3.5 h-3.5 rotate-180" />
                    </button>
                    <div className="grid grid-cols-1 gap-2">
                       <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Title</label>
                        <input value={ach.title} onChange={(e) => handleAchievementChange(index, 'title', e.target.value)} placeholder="Certificate / Achievement Name" className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Date</label>
                        <input value={ach.date} onChange={(e) => handleAchievementChange(index, 'date', e.target.value)} placeholder="e.g. 2023" className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Description</label>
                        <textarea value={ach.description} onChange={(e) => handleAchievementChange(index, 'description', e.target.value)} placeholder="Optional description..." className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none min-h-[60px] text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addAchievement} className="w-full border-dashed border-2 py-3 text-sm text-slate-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50">
                  + Add Achievement
                </Button>
              </div>
            )}

            {/* Extracurricular Tab */}
            {activeTab === 'extracurricular' && (
              <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-1">Extracurricular Activities</h2>
                {resume.extracurricular.map((extra, index) => (
                  <div key={index} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2 relative group">
                    <button onClick={() => removeExtra(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                      <LogOut className="w-3.5 h-3.5 rotate-180" />
                    </button>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Role</label>
                        <input value={extra.role} onChange={(e) => handleExtraChange(index, 'role', e.target.value)} placeholder="e.g. Member" className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Organization</label>
                        <input value={extra.organization} onChange={(e) => handleExtraChange(index, 'organization', e.target.value)} placeholder="Club / Society Name" className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Duration</label>
                        <input value={extra.duration} onChange={(e) => handleExtraChange(index, 'duration', e.target.value)} placeholder="e.g. 2022 - 2023" className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">Description</label>
                        <textarea value={extra.description} onChange={(e) => handleExtraChange(index, 'description', e.target.value)} placeholder="Describe your contribution..." className="w-full p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none min-h-[60px] text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addExtra} className="w-full border-dashed border-2 py-3 text-sm text-slate-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50">
                  + Add Activity
                </Button>
              </div>
            )}

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Professional Summary</h2>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Summary</label>
                  <textarea
                    value={resume.summary}
                    onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                    placeholder="Summarize your career goals, key achievements, and skills..."
                    className="w-full p-3 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none min-h-[100px] text-slate-700 leading-relaxed text-sm"
                  />
                </div>
                <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm border border-blue-100">
                  <p className="font-semibold mb-1">💡 Tip</p>
                  Keep your summary concise (3-4 lines). Focus on your most relevant skills and what you can bring to a role.
                </div>
              </div>
            )}

            {/* Navigation Buttons floating at bottom of left panel */}
            <div className="mt-8 pt-4 border-t flex justify-between sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 -mx-6 -mb-6 md:-mx-8 md:-mb-8 border-slate-200 shadow-md z-10">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={sectionOrder.indexOf(activeTab) === 0}
                className="w-24"
              >
                Previous
              </Button>

              {activeTab === 'summary' ? (
                <Button onClick={handleSaveResume} className="bg-green-600 hover:bg-green-700 w-32">
                  {loading ? 'Saving...' : 'Save & Finish'}
                </Button>
              ) : (
                <Button onClick={goNext} className="bg-blue-600 hover:bg-blue-700 w-24">
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Sticky Preview */}
        <div className="hidden md:flex w-7/12 lg:w-7/12 bg-slate-100 border-l border-slate-200 overflow-hidden flex-col">
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Preview
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {selectedTemplate === 'ats' ? 'ATS Format' : 'Professional Format'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex justify-center bg-slate-100/50">
            <div className="w-full max-w-[210mm] bg-white shadow-2xl min-h-[297mm] origin-top transform scale-[0.55] md:scale-[0.65] lg:scale-[0.75] xl:scale-[0.85] transition-transform origin-top-center">
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);
};

export default ResumeBuilder;
