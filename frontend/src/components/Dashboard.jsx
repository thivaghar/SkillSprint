import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, authService, paymentService } from '../services/api';
import { Flame, Trophy, Target, Star, Zap, ArrowRight, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, color, bgColor, label, value, suffix = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="stat-card"
    >
        <div className={`stat-icon ${bgColor}`}>
            <Icon size={22} className={color} />
        </div>
        <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}{suffix}</p>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, userData] = await Promise.all([
                    dashboardService.getStats(),
                    authService.getCurrentUser()
                ]);
                setStats(statsData);
                setUser(userData.user);

                // If user has no goals, force onboarding
                if (!userData.goals || userData.goals.length === 0) {
                    navigate('/onboarding');
                }
            } catch (err) {
                console.error("Dashboard error:", err);
            }
        };
        fetchData();
    }, [navigate]);

    if (!stats) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 text-sm">Loading your dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Welcome */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user?.email?.split('@')[0]}! 👋</h2>
                <p className="text-slate-500 mt-1">Here's your progress today</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={Flame} color="text-orange-500" bgColor="bg-orange-50" label="Current Streak" value={stats.current_streak} suffix=" days" />
                <StatCard icon={Trophy} color="text-amber-500" bgColor="bg-amber-50" label="Best Streak" value={stats.longest_streak} suffix=" days" />
                <StatCard icon={Target} color="text-orange-500" bgColor="bg-orange-50" label="Accuracy" value={stats.accuracy} suffix="%" />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 card p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-slate-900">Weekly Progress</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Questions attempted vs correct</p>
                        </div>
                        <TrendingUp size={18} className="text-orange-500" />
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={stats.weekly || []}>
                            <defs>
                                <linearGradient id="gradAttempted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradCorrect" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6B9970" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#6B9970" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} width={30} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            />
                            <Area type="monotone" dataKey="attempted" stroke="#F97316" strokeWidth={2} fill="url(#gradAttempted)" name="Attempted" />
                            <Area type="monotone" dataKey="correct" stroke="#6B9970" strokeWidth={2} fill="url(#gradCorrect)" name="Correct" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Daily Sprint CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card p-6 flex flex-col justify-between bg-gradient-to-br from-orange-500 to-warm-600 border-0 text-white"
                >
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                            <Zap size={20} className="text-white" />
                        </div>
                        <h3 className="text-lg font-bold">Daily Sprint</h3>
                        <p className="text-sm text-indigo-100 mt-1">Practice MCQs on your chosen topic to keep your streak alive.</p>
                    </div>
                    <button
                        onClick={() => navigate('/practice')}
                        className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-colors shadow-lg"
                    >
                        Start Practice <ArrowRight size={16} />
                    </button>
                </motion.div>
            </div>

            {/* Heatmap */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card p-6"
            >
                <h3 className="font-semibold text-slate-900 mb-4">30-Day Activity</h3>
                <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 30 }).map((_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (29 - i));
                        const dateStr = date.toISOString().split('T')[0];
                        const isActive = stats.heatmap[dateStr] === 1;
                        return (
                            <div
                                key={i}
                                className={`w-5 h-5 rounded-md transition-all ${isActive ? 'bg-orange-500 shadow-sm shadow-orange-200' : 'bg-slate-100'}`}
                                title={`${dateStr}: ${isActive ? 'Active' : 'Inactive'}`}
                            />
                        );
                    })}
                </div>
            </motion.div>

            {/* Upgrade Banner */}
            {!user?.is_pro && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card p-6 lg:p-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
                            <Star size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Upgrade to Pro</h3>
                            <p className="text-sm text-slate-600">Unlimited practice, AI insights, and more.</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            try {
                                const res = await paymentService.createCheckoutSession();
                                window.location.href = res.url;
                            } catch (e) { console.error(e); }
                        }}
                        className="btn-primary whitespace-nowrap bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-200"
                    >
                        $4.99/mo →
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default Dashboard;
