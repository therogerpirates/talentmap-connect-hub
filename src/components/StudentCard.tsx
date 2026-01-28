import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Mail, User, GraduationCap, Award, Eye, ExternalLink, Copy, Phone } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: number;
  name: string;
  year: string;
  department: string;
  skills: string[];
  gpa: string;
  resumeUrl: string;
  email: string;
  matchScore: number;
  linkedin_url?: string | null;
  github_url?: string | null;
  leetcode_url?: string | null;
  phone?: string | null;
}

interface StudentCardProps {
  student: Student;
  isShortlisted?: boolean;
  onShortlistToggle?: () => void;
}

const StudentCard = ({ student, isShortlisted, onShortlistToggle }: StudentCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleViewDetails = () => {
    navigate(`/admin/students/${student.id}`);
  };

  // Design requires a clean card with specific layout
  // Avatar + Name + Verified Badge + Menu dots (optional)
  // Match Badge (Green pill with check)

  return (
    <Card className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <CardContent className="p-6">
        {/* Header: Avatar, Name, Match Badge */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                {/* Placeholder for avatar image if available, else initials */}
                {student.name.split(' ').map(n => n[0]).join('')}
              </div>
              {/* Online/Verified status dot */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">{student.name}</h3>
              {/* Optional: Add subtitle or status if needed */}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* <div className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-sm font-medium">
              <span className="bg-green-600 rounded-full p-[2px] text-white w-4 h-4 flex items-center justify-center text-[10px]">✓</span>
              {student.matchScore || 0}% Match
            </div> */}
            {/* Kebab menu or shortlist could go here */}
          </div>
        </div>

        {/* Details Box (Light Gray) */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 flex justify-between items-center px-8">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">DEPARTMENT</div>
            <div className="font-bold text-slate-900">{student.department || 'N/A'}</div>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-4"></div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">CGPA</div>
            <div className="font-bold text-slate-900">{student.gpa || 'N/A'} / 10.0</div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">SKILLS & TECHNOLOGIES</div>
          <div className="flex flex-wrap gap-2">
            {student.skills.slice(0, 4).map((skill, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-0 px-3 py-1 rounded-full font-medium"
              >
                {skill}
              </Badge>
            ))}
            {student.skills.length > 4 && (
              <Badge variant="secondary" className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-xs">+{student.skills.length - 4}</Badge>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 my-4"></div>

        {/* Contact Info */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <Mail className="w-4 h-4" />
            <span className="truncate">{student.email}</span>
          </div>
          {student.phone ? (
            <div className="flex items-center gap-3 text-slate-500 text-sm">
              <Phone className="w-4 h-4" />
              <span>{student.phone}</span>
            </div>
          ) : null}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="w-full border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium"
            onClick={handleViewDetails}
          >
            View Profile
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-200"
              >
                Resume
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  {student.name}'s Resume
                </DialogTitle>
                <DialogDescription>
                  View the candidate's uploaded resume.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 w-full bg-slate-50 rounded-md border border-slate-200 overflow-hidden mt-4">
                {student.resumeUrl ? (
                  <iframe
                    src={student.resumeUrl}
                    className="w-full h-full"
                    title={`${student.name}'s resume`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <FileText className="w-12 h-12 opacity-20" />
                    <p>No resume available for this candidate</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {student.resumeUrl && (
                  <Button variant="outline" asChild>
                    <a href={student.resumeUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

      </CardContent>
    </Card>
  );
};

export default StudentCard;
