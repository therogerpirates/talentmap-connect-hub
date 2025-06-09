import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Mail, User, GraduationCap, Award } from 'lucide-react';

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
}

interface StudentCardProps {
  student: Student;
}

const StudentCard = ({ student }: StudentCardProps) => {
  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 80) return 'bg-gray-100 text-gray-900 border-gray-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {student.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{student.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center space-x-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>{student.year}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{student.department}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4" />
                  <span>GPA: {student.gpa}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getMatchScoreColor(student.matchScore)}`}>
            {student.matchScore}% Match
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Skills & Technologies</h4>
          <div className="flex flex-wrap gap-2">
            {student.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="bg-gray-50 text-gray-900 hover:bg-gray-100">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{student.email}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>View Resume</span>
            </Button>
            <Button size="sm" className="bg-black hover:bg-gray-800">
              Contact
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentCard;
