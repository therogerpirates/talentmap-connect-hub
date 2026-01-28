
import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateStudentData } from '@/hooks/useStudentData';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileHeaderCardProps {
    studentData: any;
    detailsData: any;
}

export const ProfileHeaderCard = ({ studentData, detailsData }: ProfileHeaderCardProps) => {
    const { profile } = useAuth();
    const updateStudentMutation = useUpdateStudentData();
    const { toast } = useToast();

    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [profileForm, setProfileForm] = useState({
        fullName: '',
        year: '',
        department: '',
        cgpa: '',
    });

    const openEditProfile = () => {
        setProfileForm({
            fullName: profile?.full_name || '',
            year: studentData?.year || '',
            department: studentData?.department || '',
            cgpa: studentData?.gpa || ''
        });
        setIsEditProfileOpen(true);
    };

    const handleProfileSave = async () => {
        setIsLoading(true);
        try {
            // Update student details
            await updateStudentMutation.mutateAsync({
                year: profileForm.year,
                department: profileForm.department,
                gpa: profileForm.cgpa
            });

            // Update profile name if changed - update BOTH students and profiles tables
            if (profile?.id && profileForm.fullName !== profile.full_name) {
                // 1. Update students table
                const { error: studentError } = await supabase
                    .from('students')
                    .update({ full_name: profileForm.fullName } as any)
                    .eq('id', profile.id);

                if (studentError) throw studentError;

                // 2. Update profiles table (AuthContext prefers this)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ full_name: profileForm.fullName })
                    .eq('id', profile.id);

                // Ignore error if profile not found (might only exist in students)
                if (profileError && profileError.code !== 'PGRST116') {
                    console.warn("Could not update profiles table:", profileError);
                }
            }

            toast({
                title: "Profile Updated",
                description: "Your profile information has been successfully updated.",
            });
            setIsEditProfileOpen(false);

            // Reload to reflect name changes in global context if necessary
            if (profileForm.fullName !== profile?.full_name) {
                window.location.reload();
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update profile",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-500 p-8 pb-14 text-white shadow-xl">
                <div className="absolute top-4 right-4">
                    <Button variant="ghost" size="icon" onClick={openEditProfile} className="text-white/80 hover:text-white hover:bg-white/20">
                        <Edit3 className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-4 border-white/10 shrink-0">
                        {profile?.full_name?.[0] || 'S'}
                    </div>
                    <div className="space-y-1 text-center sm:text-left">
                        <h2 className="text-3xl font-bold">{profile?.full_name || 'Student Name'}</h2>
                        <p className="text-blue-100 text-lg">
                            {studentData?.year || 'Academic Year'} year • {studentData?.department || 'Department'}
                        </p>
                        <p className="text-white/90 font-medium pt-2">
                            CGPA: {detailsData.cgpa || 'N/A'}
                        </p>
                    </div>
                </div>
                {/* Decorative bubble */}
                <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Update your profile information below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fullName" className="text-right">
                                Full Name
                            </Label>
                            <Input
                                id="fullName"
                                value={profileForm.fullName}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="year" className="text-right">
                                Year
                            </Label>
                            <Input
                                id="year"
                                value={profileForm.year}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, year: e.target.value }))}
                                placeholder="e.g., 2nd, 3rd, Final"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="department" className="text-right">
                                Department
                            </Label>
                            <Input
                                id="department"
                                value={profileForm.department}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
                                placeholder="e.g., Computer Science"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cgpa" className="text-right">
                                CGPA
                            </Label>
                            <Input
                                id="cgpa"
                                value={profileForm.cgpa}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, cgpa: e.target.value }))}
                                placeholder="e.g., 8.5"
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleProfileSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
