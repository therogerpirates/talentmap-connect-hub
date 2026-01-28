
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    FileText,
    Search,
    User,
    LogOut,
    ChevronLeft,
    ScanLine,
    Menu
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const SidebarItem = ({
    icon: Icon,
    label,
    path,
    isExpanded
}: {
    icon: any,
    label: string,
    path: string,
    isExpanded: boolean
}) => {
    const location = useLocation();
    const isActive = location.pathname === path;

    return (
        <NavLink
            to={path}
            className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
        >
            <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700")} />

            {/* Label - Animate opacity/width */}
            <AnimatePresence mode='wait'>
                {isExpanded && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Tooltip for collapsed state */}
            {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {label}
                </div>
            )}
        </NavLink>
    );
};

const StudentSidebar = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSignOut = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent sidebar expansion on logout click
        try {
            await signOut();
            toast({
                title: "Signed out",
                description: "You have been successfully logged out.",
            });
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const toggleSidebar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleContainerClick = () => {
        if (!isExpanded) {
            setIsExpanded(true);
        }
    };

    return (
        <motion.div
            initial={{ width: 80 }}
            animate={{ width: isExpanded ? 280 : 80 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
                "h-screen bg-white border-r border-slate-200 flex flex-col z-50 shadow-sm relative",
                !isExpanded && "cursor-pointer hover:bg-slate-50/50 transition-colors"
            )}
            onClick={handleContainerClick}
        >
            {/* Header / Logo Area */}
            <div className="p-4 flex items-center justify-between h-20 border-b border-slate-100/50">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                        <span className="text-white font-bold text-xl">T</span>
                    </div>
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex flex-col"
                            >
                                <span className="font-bold text-slate-900 leading-tight">TalentMap</span>
                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Connect Hub</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Toggle Button - Only visible when expanded usually, or always? 
            User request: "after the expand of the nav bar an arrow button will show" 
        */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={toggleSidebar}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200">
                <SidebarItem
                    icon={User}
                    label="My Profile"
                    path="/student-details"
                    isExpanded={isExpanded}
                />
                <SidebarItem
                    icon={ScanLine}
                    label="Resume Scanner"
                    path="/resume-scanner"
                    isExpanded={isExpanded}
                />
                <SidebarItem
                    icon={FileText}
                    label="Resume Builder"
                    path="/resume-builder"
                    isExpanded={isExpanded}
                />
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 mt-auto">
                <button
                    onClick={handleSignOut}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group overflow-hidden",
                        !isExpanded && "justify-center px-0"
                    )}
                >
                    <LogOut className="w-5 h-5 shrink-0 transition-colors group-hover:text-red-600" />
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="font-medium whitespace-nowrap"
                            >
                                Sign Out
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.div>
    );
};

export default StudentSidebar;
