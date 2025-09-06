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
    color: '#222',
  },
  section: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  text: {
    marginBottom: 4,
  },
  skill: {
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
    borderRadius: 6,
    padding: 2,
    marginRight: 4,
    fontSize: 10,
  },
});

const ResumePDF = ({ resume }: { resume: typeof initialResumeData }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.heading}>{resume.personal.fullName || 'Your Name'}</Text>
        <Text style={pdfStyles.text}>Email: {resume.personal.email}</Text>
        <Text style={pdfStyles.text}>Phone: {resume.personal.phone}</Text>
        <Text style={pdfStyles.text}>LinkedIn: {resume.personal.linkedin}</Text>
        <Text style={pdfStyles.text}>GitHub: {resume.personal.github}</Text>
        <Text style={pdfStyles.text}>Address: {resume.personal.address}</Text>
      </View>
      {resume.summary && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.subheading}>Professional Summary</Text>
          <Text style={pdfStyles.text}>{resume.summary}</Text>
        </View>
      )}
      {resume.education.filter(e => e.degree).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.subheading}>Education</Text>
          {resume.education.filter(e => e.degree).map((edu, idx) => (
            <Text key={idx} style={pdfStyles.text}>{edu.degree} in {edu.department} - {edu.institution} ({edu.year}) CGPA: {edu.cgpa}</Text>
          ))}
        </View>
      )}
      {resume.skills.filter(s => s).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.subheading}>Skills</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
            {resume.skills.filter(s => s).map((skill, idx) => (
              <Text key={idx} style={pdfStyles.skill}>{skill}</Text>
            ))}
          </View>
        </View>
      )}
      {resume.experience.filter(e => e.jobTitle).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.subheading}>Experience</Text>
          {resume.experience.filter(e => e.jobTitle).map((exp, idx) => (
            <Text key={idx} style={pdfStyles.text}>{exp.jobTitle} at {exp.company} ({exp.duration}): {exp.description}</Text>
          ))}
        </View>
      )}
      {resume.projects.filter(p => p.title).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.subheading}>Projects</Text>
          {resume.projects.filter(p => p.title).map((proj, idx) => (
            <Text key={idx} style={pdfStyles.text}>{proj.title}: {proj.description} [{proj.technologies}] {proj.link ? proj.link : ''}</Text>
          ))}
        </View>
      )}
      {resume.achievements.filter(a => a.title).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.subheading}>Achievements / Certifications</Text>
          {resume.achievements.filter(a => a.title).map((ach, idx) => (
            <Text key={idx} style={pdfStyles.text}>{ach.title} ({ach.date}): {ach.description}</Text>
          ))}
        </View>
      )}
      {resume.extracurricular.filter(e => e.role).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.subheading}>Extra-curricular / Volunteer</Text>
          {resume.extracurricular.filter(e => e.role).map((ex, idx) => (
            <Text key={idx} style={pdfStyles.text}>{ex.role} at {ex.organization} ({ex.duration}): {ex.description}</Text>
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
        .select('resume_form_data')
        .eq('id', profile.id)
        .single();
      if (data && data.resume_form_data) {
        setResume(data.resume_form_data);
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

  // PDF generation handler
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(resume.personal.fullName || 'Your Name', 40, y);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    y += 24;
    doc.text(`Email: ${resume.personal.email || ''}`, 40, y);
    y += 16;
    doc.text(`Phone: ${resume.personal.phone || ''}`, 40, y);
    y += 16;
    doc.text(`LinkedIn: ${resume.personal.linkedin || ''}`, 40, y);
    y += 16;
    doc.text(`GitHub: ${resume.personal.github || ''}`, 40, y);
    y += 16;
    doc.text(`Address: ${resume.personal.address || ''}`, 40, y);
    y += 24;
    if (resume.summary) {
      doc.setFont('helvetica', 'bold');
      doc.text('Professional Summary', 40, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(resume.summary, 500), 40, y);
      y += 32;
    }
    if (resume.education.filter(e => e.degree).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Education', 40, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      resume.education.filter(e => e.degree).forEach(edu => {
        doc.text(`${edu.degree} in ${edu.department} - ${edu.institution} (${edu.year}) CGPA: ${edu.cgpa}`, 40, y);
        y += 16;
      });
      y += 8;
    }
    if (resume.skills.filter(s => s).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Skills', 40, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      doc.text(resume.skills.filter(s => s).join(', '), 40, y);
      y += 24;
    }
    if (resume.experience.filter(e => e.jobTitle).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Experience', 40, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      resume.experience.filter(e => e.jobTitle).forEach(exp => {
        doc.text(`${exp.jobTitle} at ${exp.company} (${exp.duration}): ${exp.description}`, 40, y);
        y += 16;
      });
      y += 8;
    }
    if (resume.projects.filter(p => p.title).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Projects', 40, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      resume.projects.filter(p => p.title).forEach(proj => {
        doc.text(`${proj.title}: ${proj.description} [${proj.technologies}] ${proj.link ? proj.link : ''}`, 40, y);
        y += 16;
      });
      y += 8;
    }
    if (resume.achievements.filter(a => a.title).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Achievements / Certifications', 40, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      resume.achievements.filter(a => a.title).forEach(ach => {
        doc.text(`${ach.title} (${ach.date}): ${ach.description}`, 40, y);
        y += 16;
      });
      y += 8;
    }
    if (resume.extracurricular.filter(e => e.role).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Extra-curricular / Volunteer', 40, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      resume.extracurricular.filter(e => e.role).forEach(ex => {
        doc.text(`${ex.role} at ${ex.organization} (${ex.duration}): ${ex.description}`, 40, y);
        y += 16;
      });
      y += 8;
    }
    doc.save('resume.pdf');
  };

  // Professional resume preview renderer
  const renderPreview = () => (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-2xl mx-auto border border-gray-200 dark:border-gray-700">
      <div className="border-b pb-4 mb-4">
        <h1 className="text-3xl font-bold text-primary mb-1">{resume.personal.fullName || "Your Name"}</h1>
        <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-300 text-sm">
          {resume.personal.email && <span><b>Email:</b> {resume.personal.email}</span>}
          {resume.personal.phone && <span><b>Phone:</b> {resume.personal.phone}</span>}
          {resume.personal.linkedin && <span><b>LinkedIn:</b> {resume.personal.linkedin}</span>}
          {resume.personal.github && <span><b>GitHub:</b> {resume.personal.github}</span>}
          {resume.personal.address && <span><b>Address:</b> {resume.personal.address}</span>}
        </div>
      </div>
      {resume.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-1">Professional Summary</h2>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{resume.summary}</p>
        </div>
      )}
      {resume.education.filter(e => e.degree).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-1">Education</h2>
          <ul className="list-disc ml-6">
            {resume.education.filter(e => e.degree).map((edu, idx) => (
              <li key={idx} className="mb-1">
                <span className="font-semibold">{edu.degree}</span> in {edu.department} - {edu.institution} ({edu.year}) <span className="text-xs">CGPA: {edu.cgpa}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {resume.skills.filter(s => s).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-1">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.filter(s => s).map((skill, idx) => (
              <span key={idx} className="bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-3 py-1 rounded-full text-sm font-medium shadow">{skill}</span>
            ))}
          </div>
        </div>
      )}
      {resume.experience.filter(e => e.jobTitle).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-1">Experience</h2>
          <ul className="list-disc ml-6">
            {resume.experience.filter(e => e.jobTitle).map((exp, idx) => (
              <li key={idx} className="mb-1">
                <span className="font-semibold">{exp.jobTitle}</span> at {exp.company} <span className="text-xs">({exp.duration})</span>
                <div className="text-gray-700 dark:text-gray-300 ml-2">{exp.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {resume.projects.filter(p => p.title).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-1">Projects</h2>
          <ul className="list-disc ml-6">
            {resume.projects.filter(p => p.title).map((proj, idx) => (
              <li key={idx} className="mb-1">
                <span className="font-semibold">{proj.title}</span> <span className="text-xs">[{proj.technologies}]</span>
                <div className="text-gray-700 dark:text-gray-300 ml-2">{proj.description} {proj.link && (<a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">(Link)</a>)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {resume.achievements.filter(a => a.title).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-1">Achievements / Certifications</h2>
          <ul className="list-disc ml-6">
            {resume.achievements.filter(a => a.title).map((ach, idx) => (
              <li key={idx} className="mb-1">
                <span className="font-semibold">{ach.title}</span> <span className="text-xs">({ach.date})</span>
                <div className="text-gray-700 dark:text-gray-300 ml-2">{ach.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {resume.extracurricular.filter(e => e.role).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-1">Extra-curricular / Volunteer</h2>
          <ul className="list-disc ml-6">
            {resume.extracurricular.filter(e => e.role).map((ex, idx) => (
              <li key={idx} className="mb-1">
                <span className="font-semibold">{ex.role}</span> at {ex.organization} <span className="text-xs">({ex.duration})</span>
                <div className="text-gray-700 dark:text-gray-300 ml-2">{ex.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // Save resume data to Supabase
  const handleSaveResume = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { error } = await supabase
      .from('students')
      .update({ resume_form_data: resume })
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
