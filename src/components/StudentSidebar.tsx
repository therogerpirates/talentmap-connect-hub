import { Link, useLocation } from 'react-router-dom';
import { User, Scan, FileText, LogOut, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const StudentSidebar = () => {
    const { pathname } = useLocation();
    const { signOut } = useAuth();

    const links = [
        { href: '/student-details', label: 'Profile', icon: User },
        { href: '/resume-scanner', label: 'Resume Scanner', icon: Scan },
        { href: '/resume-builder', label: 'Resume Builder', icon: FileText },
    ];

    return (
        <div className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <Link to="/" className="flex items-center space-x-3 group">
                    <div className="relative">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                            TalentMap
                        </span>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Student Portal</div>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link key={link.href} to={link.href}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start space-x-3 px-4 py-6 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors",
                                    isActive
                                        ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                                        : "text-slate-600 dark:text-slate-400"
                                )}
                            >
                                <Icon className={cn("w-5 h-5", isActive ? "text-blue-600 dark:text-blue-400" : "")} />
                                <span>{link.label}</span>
                            </Button>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                    variant="ghost"
                    onClick={() => signOut()}
                    className="w-full justify-start space-x-3 px-4 py-6 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-700"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </Button>
            </div>
        </div>
    );
};

export default StudentSidebar;
