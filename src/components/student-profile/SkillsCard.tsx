
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Plus } from 'lucide-react';
import { useUpdateStudentData } from '@/hooks/useStudentData';
import { useToast } from '@/hooks/use-toast';

export const SkillsCard = ({ skills = [], skillSections = [] }: { skills: string[], skillSections?: { heading: string; items: string[] }[] }) => {
    const updateStudentMutation = useUpdateStudentData();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const hasSections = skillSections && skillSections.length > 0;

    const startEditing = () => {
        setIsEditing(true);
        setEditValue(skills.join('\n'));
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditValue('');
    };

    const saveSkills = async () => {
        try {
            const updatedSkills = editValue.split('\n').filter(s => s.trim());
            await updateStudentMutation.mutateAsync({ skills: updatedSkills });
            setIsEditing(false);
            toast({ title: 'Skills updated successfully' });
        } catch (error) {
            toast({ title: 'Failed to update skills', variant: 'destructive' });
        }
    };

    const addSkill = async () => {
        const newSkill = prompt('Add new skill:');
        if (newSkill && newSkill.trim()) {
            const updatedSkills = [...skills, newSkill.trim()];
            await updateStudentMutation.mutateAsync({ skills: updatedSkills });
        }
    };

    const removeSkill = async (index: number) => {
        const updatedSkills = skills.filter((_, i) => i !== index);
        await updateStudentMutation.mutateAsync({ skills: updatedSkills });
    };

    return (
        <Card className="p-6 bg-slate-100 dark:bg-slate-800/50 border-none shadow-md flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-slate-800 dark:text-white">
                    <span className="text-blue-500">❖</span>
                    <h3 className="font-semibold text-lg">Skills</h3>
                </div>
                {!hasSections && (isEditing ? (
                    <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={saveSkills} className="text-green-500 p-1 h-auto"><Save className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditing} className="text-red-500 p-1 h-auto"><X className="w-4 h-4" /></Button>
                    </div>
                ) : (
                    <Button size="sm" variant="ghost" onClick={startEditing} className="text-blue-500 p-1 h-auto hover:bg-blue-50 dark:hover:bg-slate-700">
                        <Edit3 className="w-4 h-4" />
                    </Button>
                ))}
            </div>

            <div className="flex-1">
                {hasSections ? (
                    <div className="space-y-4">
                        {skillSections.map((section, idx) => (
                            <div key={idx} className="space-y-2">
                                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-1">
                                    {section.heading}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {section.items.map((skill, i) => (
                                        <Badge key={i} variant="secondary" className="px-3 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-0 shadow-sm">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    isEditing ? (
                        <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="min-h-[120px] bg-white dark:bg-slate-900 h-full"
                        />
                    ) : (
                        <div className="flex flex-wrap gap-2 content-start">
                            {skills.length > 0 ? (
                                skills.map((skill, i) => (
                                    <Badge key={i} variant="secondary" className="px-3 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 border-0 shadow-sm">
                                        {skill}
                                        <button onClick={() => removeSkill(i)} className="ml-2 text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-slate-400 text-sm">No skills added yet.</span>
                            )}
                            <Button variant="outline" size="sm" onClick={addSkill} className="rounded-full border-dashed border-slate-300 dark:border-slate-600 text-slate-500">
                                <Plus className="w-3 h-3 mr-1" /> Add
                            </Button>
                        </div>
                    )
                )}
            </div>
        </Card>
    );
};
