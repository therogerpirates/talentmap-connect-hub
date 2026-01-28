
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit3, Save, X, Linkedin, Github, Code } from 'lucide-react';
import { useUpdateStudentData } from '@/hooks/useStudentData';
import { useToast } from '@/hooks/use-toast';

interface ExternalProfilesCardProps {
    studentData: any;
}

export const ExternalProfilesCard = ({ studentData }: ExternalProfilesCardProps) => {
    const updateStudentMutation = useUpdateStudentData();
    const { toast } = useToast();
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const startEditing = (field: string, value: string) => {
        setEditingField(field);
        setEditValue(value || '');
    };

    const cancelEditing = () => {
        setEditingField(null);
        setEditValue('');
    };

    const saveField = async () => {
        if (!editingField) return;

        try {
            await updateStudentMutation.mutateAsync({ [editingField]: editValue });
            setEditingField(null);
            toast({ title: 'Link updated successfully' });
        } catch (error) {
            toast({ title: 'Failed to update link', variant: 'destructive' });
        }
    };

    const renderExternalProfile = (label: string, icon: any, field: string, url: string) => {
        const isEditing = editingField === field;

        return (
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                    {icon}
                    <span className="font-medium">{label}</span>
                </div>

                <div className="flex-1 mx-4">
                    {isEditing ? (
                        <div className="flex items-center space-x-2">
                            <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8 text-sm"
                                placeholder="https://..."
                            />
                            <Button size="sm" variant="ghost" onClick={saveField} className="h-8 w-8 p-0 text-green-600"><Save className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-8 w-8 p-0 text-red-600"><X className="w-4 h-4" /></Button>
                        </div>
                    ) : (
                        <div className="flex justify-end">
                            {url ? (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-[150px] block mr-2">
                                    {label} Profile
                                </a>
                            ) : (
                                <span className="text-sm text-slate-400 italic mr-2">Not linked</span>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => startEditing(field, url)} className="h-6 w-6 p-0 text-slate-400 hover:text-blue-600">
                                <Edit3 className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Card className="p-6 bg-slate-100 dark:bg-slate-800/50 border-none shadow-md flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-slate-800 dark:text-white">
                    <span className="text-blue-500">❖</span>
                    <h3 className="font-semibold text-lg">External Profiles</h3>
                </div>
            </div>
            <div className="space-y-1 flex-1">
                {renderExternalProfile("LinkedIn", <Linkedin className="w-5 h-5" />, "linkedin_url", studentData?.linkedin_url || studentData?.linkedin || '')}
                {renderExternalProfile("GitHub", <Github className="w-5 h-5" />, "github_url", studentData?.github_url || studentData?.github || '')}
                {renderExternalProfile("LeetCode", <Code className="w-5 h-5" />, "leetcode_url", studentData?.leetcode_url || '')}
            </div>
        </Card>
    );
};
