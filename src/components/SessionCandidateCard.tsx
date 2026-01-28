
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
    Eye,
    FileText,
    ExternalLink,
    Mail,
    Phone,
    CheckCircle,
    XCircle,
    Clock,
    UserCheck,
    Star as StarIcon,
    Users
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { DetailedAnalysis } from "./CandidateMatchingSystem";

interface SessionCandidateCardProps {
    candidate: any;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onStatusUpdate: (id: string, status: string) => void;
    fetchDetailedAnalysis: (studentId: string) => void;
    dialogOpenId: string | null;
    setDialogOpenId: (id: string | null) => void;
    detailedAnalysis: DetailedAnalysis | null;
    setDetailedAnalysis: (analysis: DetailedAnalysis | null) => void;
    isLoadingAnalysis: boolean;
}

export function SessionCandidateCard({
    candidate,
    isSelected,
    onSelect,
    onStatusUpdate,
    fetchDetailedAnalysis,
    dialogOpenId,
    setDialogOpenId,
    detailedAnalysis,
    setDetailedAnalysis,
    isLoadingAnalysis
}: SessionCandidateCardProps) {
    const { toast } = useToast();

    const student = candidate.student;
    const profile = student?.profile;
    const fullName = profile?.full_name || 'Unknown Candidate';
    const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2);

    const getMatchScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'hired': return 'default'; // dark
            case 'shortlisted': return 'secondary'; // light gray
            case 'waitlisted': return 'outline';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    };

    // Custom status badges to match the clean aesthetic better than default shadcn badges
    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            hired: "bg-green-100 text-green-700 border-green-200",
            shortlisted: "bg-indigo-50 text-indigo-700 border-indigo-200",
            waitlisted: "bg-amber-50 text-amber-700 border-amber-200",
            rejected: "bg-red-50 text-red-700 border-red-200",
            applied: "bg-slate-50 text-slate-600 border-slate-200"
        };
        const icon: Record<string, React.ReactNode> = {
            hired: <UserCheck className="w-3 h-3 mr-1" />,
            shortlisted: <StarIcon className="w-3 h-3 mr-1" />,
            waitlisted: <Clock className="w-3 h-3 mr-1" />,
            rejected: <XCircle className="w-3 h-3 mr-1" />,
            applied: <Users className="w-3 h-3 mr-1" />
        };

        return (
            <div className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.applied} uppercase tracking-wide`}>
                {icon[status]}
                {status}
            </div>
        );
    };

    return (
        <Card className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200'}`}>

            {/* Selection Checkbox - Top Left Absolute */}
            <div className="absolute top-4 left-4 z-10">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect(candidate.id)}
                    className="h-5 w-5 bg-white/90 backdrop-blur-sm border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                />
            </div>

            <CardContent className="p-6">
                {/* Header: Avatar, Name, Status */}
                <div className="flex justify-between items-start mb-6 pl-8"> {/* pl-8 to avoid overlap with checkbox */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-white text-xl font-bold overflow-hidden shadow-sm">
                                {initials}
                            </div>
                            {/* Online/Verified status dot - Keeping green as general indicator */}
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-slate-900 leading-tight">{fullName}</h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">{student?.year || 'Year N/A'}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={candidate.status} />
                    </div>
                </div>

                {/* Details Box (Light Gray) - Dept | Divider | CGPA | Divider | Match */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6 flex justify-between items-center px-4 md:px-6">
                    <div className="flex-1 text-center md:text-left">
                        <div className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">DEPARTMENT</div>
                        <div className="font-bold text-slate-900 text-sm md:text-base leading-tight">{student.department || 'N/A'}</div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2 md:mx-4 flex-shrink-0"></div>

                    <div className="text-center">
                        <div className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">CGPA</div>
                        <div className="font-bold text-slate-900 text-sm md:text-base">{student.gpa || 'N/A'}</div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2 md:mx-4 flex-shrink-0"></div>

                    <div className="text-center">
                        <div className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">MATCH</div>
                        <div className={`font-bold text-sm md:text-base ${getMatchScoreColor(candidate.match_score)}`}>{candidate.match_score}%</div>
                    </div>
                </div>

                {/* Skills */}
                <div className="mb-6">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">SKILLS & TECHNOLOGIES</div>
                    <div className="flex flex-wrap gap-2">
                        {student?.skills && student.skills.slice(0, 4).map((skill: string, index: number) => (
                            <Badge
                                key={index}
                                variant="secondary"
                                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-0 px-3 py-1 rounded-full font-medium transition-colors"
                            >
                                {skill}
                            </Badge>
                        ))}
                        {student?.skills && student.skills.length > 4 && (
                            <Badge variant="secondary" className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-xs border border-slate-100">+{student.skills.length - 4}</Badge>
                        )}
                        {(!student?.skills || student.skills.length === 0) && (
                            <span className="text-sm text-slate-400 italic">No skills listed</span>
                        )}
                    </div>
                </div>

                <div className="border-t border-slate-100 my-4"></div>

                {/* Contact Info */}
                {profile?.email && (
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-slate-500 text-sm">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{profile.email}</span>
                        </div>
                        {/* Phone if available */}
                        {(student as any).phone && (
                            <div className="flex items-center gap-3 text-slate-500 text-sm">
                                <Phone className="w-4 h-4" />
                                <span>{(student as any).phone}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions - Analyze Match & Resume */}
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        className="w-full border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium"
                        onClick={() => {
                            setDialogOpenId(candidate.id);
                            fetchDetailedAnalysis(candidate.student_id);
                        }}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Analyze
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
                                    {fullName}'s Resume
                                </DialogTitle>
                                <DialogDescription>
                                    View the candidate's uploaded resume.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 w-full bg-slate-50 rounded-md border border-slate-200 overflow-hidden mt-4">
                                {student?.resumeUrl ? (
                                    <iframe
                                        src={student.resumeUrl}
                                        className="w-full h-full"
                                        title={`${fullName}'s resume`}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                        <FileText className="w-12 h-12 opacity-20" />
                                        <p>No resume available for this candidate</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                {student?.resumeUrl && (
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
}
