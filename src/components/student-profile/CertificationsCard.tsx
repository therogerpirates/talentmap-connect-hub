
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, Save, X, Trash2, Award } from 'lucide-react';
import { useUpdateStudentData } from '@/hooks/useStudentData';
import { useToast } from '@/hooks/use-toast';

export const CertificationsCard = ({ certifications = [] }: { certifications: string[] }) => {
    const updateStudentMutation = useUpdateStudentData();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const startEditing = () => {
        setIsEditing(true);
        setEditValue(certifications.join('\n'));
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditValue('');
    };

    const saveCertifications = async () => {
        try {
            const updatedCerts = editValue.split('\n').filter(e => e.trim());
            // @ts-ignore - type definition in hook needs update but this works if DB column exists
            await updateStudentMutation.mutateAsync({ certifications: updatedCerts });
            setIsEditing(false);
            toast({ title: 'Certifications updated successfully' });
        } catch (error) {
            toast({ title: 'Failed to update certifications', variant: 'destructive' });
        }
    };

    const addCertification = () => {
        const newCert = prompt('Add new certification:');
        if (newCert && newCert.trim()) {
            const updatedCerts = [...certifications, newCert.trim()];
            // @ts-ignore
            updateStudentMutation.mutateAsync({ certifications: updatedCerts });
        }
    };

    const removeCertification = (index: number) => {
        const updatedCerts = certifications.filter((_, i) => i !== index);
        // @ts-ignore
        updateStudentMutation.mutateAsync({ certifications: updatedCerts });
    };

    return (
        <Card className="p-6 bg-slate-200 dark:bg-slate-800 border-none shadow-md">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-slate-800 dark:text-white">
                    <span className="text-blue-500"><Award className="w-5 h-5" /></span>
                    <h3 className="font-semibold text-lg">Certifications</h3>
                </div>
                {isEditing ? (
                    <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={saveCertifications} className="text-green-500 p-1 h-auto"><Save className="w-4 h-4" /></Button>
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
                    placeholder="Enter certifications (one per line)"
                />
            ) : (
                <div className="min-h-[100px] space-y-2">
                    {certifications.length > 0 ? (
                        <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                            {certifications.map((cert, i) => (
                                <li key={i} className="flex items-center justify-between group p-2 bg-white/50 dark:bg-slate-900/50 rounded hover:bg-white transition-colors">
                                    <span>{cert}</span>
                                    <Button variant="ghost" size="sm" onClick={() => removeCertification(i)} className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500"><Trash2 className="w-3 h-3" /></Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-500 italic">No certifications listed.</p>
                    )}
                    <Button variant="ghost" size="sm" onClick={addCertification} className="text-blue-600 hover:underline px-0">
                        + Add Certification
                    </Button>
                </div>
            )}
        </Card>
    );
};
