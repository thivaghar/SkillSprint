import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import {
    LayoutDashboard, Activity, BookOpen, Zap, BarChart3,
    LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/habits', label: 'Habits', icon: Activity },
    { path: '/learning', label: 'Learning', icon: BookOpen },
    { path: '/practice', label: 'Practice', icon: Zap },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const currentPage = navItems.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard';

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Mobile Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-[260px] flex flex-col
                bg-slate-900 text-slate-300
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-warm-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                            <Zap size={16} className="text-white" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">SkillSprint</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                    transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-orange-500/15 text-orange-400 shadow-sm'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }
                                `}
                            >
                                <Icon size={18} className="shrink-0" />
                                <span>{item.label}</span>
                                {location.pathname === item.path && (
                                    <ChevronRight size={14} className="ml-auto opacity-60" />
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-3 border-t border-slate-700/50">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/60">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-warm-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">
                                {user.email?.split('@')[0] || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user.email || ''}</p>
                        </div>
                        <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors" title="Logout">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white border-b border-slate-200/80 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">{currentPage}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {user.is_pro && (
                            <span className="px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full shadow-sm">
                                PRO
                            </span>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
