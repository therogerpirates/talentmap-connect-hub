import React, { useState, useEffect } from "react";
import { PDFDownloadLink, Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, User } from 'lucide-react';

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
  bulletPoint: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
});

const ResumePDF = ({ resume }: { resume: typeof initialResumeData }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.header}></View>
      
      {/* Name and Contact */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.name}>{resume.personal.fullName || 'YOUR NAME'}</Text>
        <Text style={pdfStyles.contactInfo}>📍 {resume.personal.address || 'Your Location'}</Text>
        <Text style={pdfStyles.contactInfo}>📞 {resume.personal.phone || 'Your Phone'}</Text>
        <Text style={pdfStyles.contactInfo}>✉️ {resume.personal.email || 'Your Email'}</Text>
        {resume.personal.linkedin && (
          <Text style={pdfStyles.contactInfo}>💼 {resume.personal.linkedin}</Text>
        )}
        {resume.personal.github && (
          <Text style={pdfStyles.contactInfo}>🔗 {resume.personal.github}</Text>
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
              <Text style={pdfStyles.text}>{exp.description}</Text>
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
            <Text key={idx} style={pdfStyles.bulletPoint}>
              • {proj.title}: {proj.description} [{proj.technologies}]
            </Text>
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
            <Text key={idx} style={pdfStyles.bulletPoint}>
              • {activity.role} at {activity.organization} ({activity.duration})
            </Text>
          ))}
        </View>
      )}
    </Page>
  </Document>
);

const ResumeBuilder: React.FC = () => {
  const [resume, setResume] = useState(initialResumeData);
  const [errors, setErrors] = useState<any>({});
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load resume data from Supabase on mount
  useEffect(() => {
    const fetchResume = async () => {
      if (!profile?.id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('education, experience, projects, skills')
        .eq('id', profile.id)
        .single();
      
      if (data && !error) {
        // Map existing data back to form structure with type checking
        const mappedResume = {
          ...resume,
          education: (Array.isArray(data.education) && data.education.every(e => typeof e === 'object' && e !== null)) 
            ? data.education as typeof resume.education : resume.education,
          experience: (Array.isArray(data.experience) && data.experience.every(e => typeof e === 'object' && e !== null)) 
            ? data.experience as typeof resume.experience : resume.experience,
          projects: (Array.isArray(data.projects) && data.projects.every(p => typeof p === 'object' && p !== null)) 
            ? data.projects as typeof resume.projects : resume.projects,
          skills: Array.isArray(data.skills) ? data.skills as string[] : resume.skills
        };
        setResume(mappedResume);
      }
      setLoading(false);
    };
    fetchResume();
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
  const renderPreview = () => (
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
                  <span style={{ marginRight: '8px' }}>📍</span>
                  {resume.personal.address || 'Your Location'}
                </li>
                <li style={{ 
                  marginBottom: '8px', 
                  color: '#666', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: '8px' }}>📞</span>
                  {resume.personal.phone || 'Your Phone'}
                </li>
                <li style={{ 
                  marginBottom: '8px', 
                  color: '#666', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: '8px' }}>✉️</span>
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
                    <span style={{ marginRight: '8px' }}>💼</span>
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
                    <span style={{ marginRight: '8px' }}>🔗</span>
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
              lineHeight: '1.5'
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
                  <div style={{ color: '#666', fontSize: '14px', marginTop: '2px' }}>
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
                <div key={idx} style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
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
                    <div style={{ marginLeft: '16px', marginTop: '2px', fontSize: '13px' }}>
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
                    <div style={{ marginLeft: '16px', marginTop: '2px', fontSize: '13px' }}>
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

  // Save resume data to Supabase (using existing columns)
  const handleSaveResume = async () => {
    if (!profile?.id) return;
    setLoading(true);
    
    // Map form data to existing database columns
    const updateData = {
      // Personal info is likely stored in other fields or profile table
      // Education data
      education: resume.education.filter(e => e.degree).length > 0 ? resume.education : null,
      // Experience data  
      experience: resume.experience.filter(e => e.jobTitle).length > 0 ? resume.experience : null,
      // Projects data
      projects: resume.projects.filter(p => p.title).length > 0 ? resume.projects : null,
      // Skills as array
      skills: resume.skills.filter(s => s) || []
    };
    
    const { error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', profile.id);
      
    setLoading(false);
    setSaveStatus(error ? 'Error saving resume.' : 'Resume saved!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Themed Navigation Bar */}
        <nav className="flex items-center justify-center gap-6 mb-8 py-3 px-4 rounded-xl bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate('/student-dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-gray-900 dark:text-white bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-gray-800 dark:to-gray-700 hover:from-blue-200 hover:to-indigo-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition"
          >
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Student Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/resume-scanner')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-gray-900 dark:text-white bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-gray-800 dark:to-gray-700 hover:from-blue-200 hover:to-indigo-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition"
          >
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Resume Scanner
          </button>
          <button
            type="button"
            onClick={() => navigate('/student-details')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-gray-900 dark:text-white bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-gray-800 dark:to-gray-700 hover:from-blue-200 hover:to-indigo-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition"
          >
            <User className="w-5 h-5 text-green-600 dark:text-green-400" /> Student Details
          </button>
        </nav>
        <h1 className="text-3xl font-bold mb-6 text-primary">Resume Builder</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
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
            {/* Education Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Education</h2>
              {resume.education.map((edu, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
                  <input type="text" placeholder="Degree" value={edu.degree} onChange={e => handleEducationChange(idx, "degree", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Institution" value={edu.institution} onChange={e => handleEducationChange(idx, "institution", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Department" value={edu.department} onChange={e => handleEducationChange(idx, "department", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Year" value={edu.year} onChange={e => handleEducationChange(idx, "year", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="CGPA" value={edu.cgpa} onChange={e => handleEducationChange(idx, "cgpa", e.target.value)} className="input input-bordered" />
                  <button type="button" onClick={() => removeEducation(idx)} className="text-red-500 ml-2">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addEducation} className="mt-2 text-blue-600">+ Add Education</button>
            </div>
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
            {/* Experience Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Experience</h2>
              {resume.experience.map((exp, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                  <input type="text" placeholder="Job Title" value={exp.jobTitle} onChange={e => handleExperienceChange(idx, "jobTitle", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Company" value={exp.company} onChange={e => handleExperienceChange(idx, "company", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Duration" value={exp.duration} onChange={e => handleExperienceChange(idx, "duration", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Description" value={exp.description} onChange={e => handleExperienceChange(idx, "description", e.target.value)} className="input input-bordered" />
                  <button type="button" onClick={() => removeExperience(idx)} className="text-red-500 ml-2">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addExperience} className="mt-2 text-blue-600">+ Add Experience</button>
            </div>
            {/* Projects Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Projects</h2>
              {resume.projects.map((proj, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                  <input type="text" placeholder="Title" value={proj.title} onChange={e => handleProjectChange(idx, "title", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Description" value={proj.description} onChange={e => handleProjectChange(idx, "description", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Technologies" value={proj.technologies} onChange={e => handleProjectChange(idx, "technologies", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Link" value={proj.link} onChange={e => handleProjectChange(idx, "link", e.target.value)} className="input input-bordered" />
                  <button type="button" onClick={() => removeProject(idx)} className="text-red-500 ml-2">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addProject} className="mt-2 text-blue-600">+ Add Project</button>
            </div>
            {/* Achievements/Certifications Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Achievements / Certifications</h2>
              {resume.achievements.map((ach, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  <input type="text" placeholder="Title" value={ach.title} onChange={e => handleAchievementChange(idx, "title", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Description" value={ach.description} onChange={e => handleAchievementChange(idx, "description", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Date" value={ach.date} onChange={e => handleAchievementChange(idx, "date", e.target.value)} className="input input-bordered" />
                  <button type="button" onClick={() => removeAchievement(idx)} className="text-red-500 ml-2">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addAchievement} className="mt-2 text-blue-600">+ Add Achievement</button>
            </div>
            {/* Extra-curricular/Volunteer Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Extra-curricular / Volunteer</h2>
              {resume.extracurricular.map((ex, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                  <input type="text" placeholder="Role" value={ex.role} onChange={e => handleExtraChange(idx, "role", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Organization" value={ex.organization} onChange={e => handleExtraChange(idx, "organization", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Duration" value={ex.duration} onChange={e => handleExtraChange(idx, "duration", e.target.value)} className="input input-bordered" />
                  <input type="text" placeholder="Description" value={ex.description} onChange={e => handleExtraChange(idx, "description", e.target.value)} className="input input-bordered" />
                  <button type="button" onClick={() => removeExtra(idx)} className="text-red-500 ml-2">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addExtra} className="mt-2 text-blue-600">+ Add Extra-curricular</button>
            </div>
            {/* Summary Section */}
            <div className="bg-white rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Professional Summary</h2>
              <textarea name="summary" value={resume.summary} onChange={e => setResume({ ...resume, summary: e.target.value })} className="input input-bordered w-full" rows={3} />
            </div>
            <PDFDownloadLink document={<ResumePDF resume={resume} />} fileName="resume.pdf">
              {({ loading }) => (
                <button type="button" className="bg-indigo-600 text-white px-6 py-2 rounded shadow font-semibold mb-6 hover:bg-indigo-700 transition">
                  {loading ? 'Preparing PDF...' : 'Download Resume'}
                </button>
              )}
            </PDFDownloadLink>
            <button type="button" onClick={handleSaveResume} className="bg-green-600 text-white px-6 py-2 rounded shadow font-semibold mb-6 hover:bg-green-700 transition ml-4">
              {loading ? 'Saving...' : 'Save Resume'}
            </button>
            {saveStatus && <div className="text-sm mt-2 font-medium text-green-700 dark:text-green-400">{saveStatus}</div>}
          </div>
          {/* Preview Section */}
          <div className="sticky top-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded shadow p-4 mb-4">
              <h2 className="text-xl font-semibold mb-2 text-indigo-700 dark:text-indigo-400">Resume Preview</h2>
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
