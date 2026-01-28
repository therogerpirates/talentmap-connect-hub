
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, Save, X, Trash2 } from 'lucide-react';
import { useUpdateStudentData } from '@/hooks/useStudentData';
import { useToast } from '@/hooks/use-toast';

export const ProjectsCard = ({ projects = [] }: { projects: string[] }) => {
    const updateStudentMutation = useUpdateStudentData();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const startEditing = () => {
        setIsEditing(true);
        setEditValue(projects.join('\n'));
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditValue('');
    };

    const saveProjects = async () => {
        try {
            const updatedProjects = editValue.split('\n').filter(p => p.trim());
            await updateStudentMutation.mutateAsync({ projects: updatedProjects });
            setIsEditing(false);
            toast({ title: 'Projects updated successfully' });
        } catch (error) {
            toast({ title: 'Failed to update projects', variant: 'destructive' });
        }
    };

    const addProject = () => {
        const newProject = prompt('Add new project:');
        if (newProject && newProject.trim()) {
            const updatedProjects = [...projects, newProject.trim()];
            updateStudentMutation.mutateAsync({ projects: updatedProjects });
        }
    };

    const removeProject = (index: number) => {
        const updatedProjects = projects.filter((_, i) => i !== index);
        updateStudentMutation.mutateAsync({ projects: updatedProjects });
    };

    return (
        <Card className="p-6 bg-slate-200 dark:bg-slate-800 border-none shadow-md">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-slate-800 dark:text-white">
                    <span className="text-blue-500">❖</span>
                    <h3 className="font-semibold text-lg">Projects</h3>
                </div>
                {isEditing ? (
                    <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={saveProjects} className="text-green-500 p-1 h-auto"><Save className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditing} className="text-red-500 p-1 h-auto"><X className="w-4 h-4" /></Button>
                    </div>
                ) : (
                    <Button size="sm" variant="ghost" onClick={startEditing} className="text-blue-500 p-1 h-auto hover:bg-slate-300 dark:hover:bg-slate-700">
                        <Edit3 className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {isEditing ? (
                <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="min-h-[150px] bg-white dark:bg-slate-900"
                    placeholder="Enter project titles (one per line)"
                />
            ) : (
                <div className="min-h-[100px] space-y-2">
                    {projects.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                            {projects.map((proj, i) => (
                                <li key={i} className="flex items-center justify-between group p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
                                    <span>{proj.split('\n')[0]}</span>
                                    <Button variant="ghost" size="sm" onClick={() => removeProject(i)} className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500"><Trash2 className="w-3 h-3" /></Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-500 italic">No projects listed.</p>
                    )}
                    <Button variant="ghost" size="sm" onClick={addProject} className="text-blue-600 hover:underline px-0">
                        + Add Project
                    </Button>
                </div>
            )}
        </Card>
    );
};
