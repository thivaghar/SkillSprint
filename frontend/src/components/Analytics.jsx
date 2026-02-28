import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/api';
import { TrendingUp, Target, Flame, Calendar, Award, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

const GaugeChart = ({ value, max = 100, size = 160 }) => {
    const pct = Math.min(value / max, 1);
    const angle = pct * 180;
    const radius = size / 2 - 16;
    const endX = size / 2 + radius * Math.cos(Math.PI - (angle * Math.PI / 180));
    const endY = size / 2 - radius * Math.sin(angle * Math.PI / 180);
    const largeArc = angle > 180 ? 1 : 0;

    return (
        <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
            <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
                {/* Background arc */}
                <path
                    d={`M ${16} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 16} ${size / 2}`}
                    fill="none" stroke="#E2E8F0" strokeWidth="12" strokeLinecap="round"
                />
                {/* Value arc */}
                {pct > 0 && (
                    <path
                        d={`M ${16} ${size / 2} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
                        fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round"
                    />
                )}
                <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#A78BFA" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
                <span className="text-3xl font-bold text-slate-900">{Math.round(value)}</span>
                <span className="text-xs text-slate-500 mt-0.5">out of {max}</span>
            </div>
        </div>
    );
};

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await analyticsService.getSummary();
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!data) return (
        <div className="card p-12 text-center max-w-lg mx-auto mt-16">
            <BarChart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900">No data yet</h3>
            <p className="text-sm text-slate-500 mt-1">Start practicing to see your analytics</p>
        </div>
    );

    const stats = [
        { icon: Target, label: 'Accuracy', value: `${data.accuracy}%`, color: 'text-orange-500', bg: 'bg-orange-50' },
        { icon: Flame, label: 'Current Streak', value: `${data.current_streak} days`, color: 'text-orange-500', bg: 'bg-orange-50' },
        { icon: Award, label: 'Best Streak', value: `${data.longest_streak} days`, color: 'text-warm-500', bg: 'bg-warm-50' },
        { icon: Calendar, label: 'Active Days', value: `${data.active_days}/30`, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h2 className="page-title">Analytics</h2>
                <p className="page-subtitle mt-1">Deep dive into your performance data</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="stat-card"
                        >
                            <div className={`stat-icon ${s.bg}`}>
                                <Icon size={20} className={s.color} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{s.label}</p>
                                <p className="text-xl font-bold text-slate-900 mt-0.5">{s.value}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Productivity Gauge */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-6 flex flex-col items-center"
                >
                    <h3 className="font-semibold text-slate-900 mb-4 self-start">Productivity Score</h3>
                    <GaugeChart value={data.productivity_score} />
                    <p className="text-sm text-slate-500 mt-4 text-center">
                        Based on streak, accuracy & consistency
                    </p>
                </motion.div>

                {/* Weekly Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="card p-6 lg:col-span-2"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900">Weekly Performance</h3>
                        <Zap size={16} className="text-slate-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.weekly} barGap={8}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} width={30} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                            <Bar dataKey="attempted" fill="#CBD5E1" radius={[6, 6, 0, 0]} name="Attempted" />
                            <Bar dataKey="correct" fill="#6366F1" radius={[6, 6, 0, 0]} name="Correct" />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Accuracy Trend */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-slate-900">Accuracy Trend</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Last 14 days</p>
                    </div>
                    <TrendingUp size={16} className="text-slate-400" />
                </div>
                <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={data.daily_trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} width={35} unit="%" />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                        <Line type="monotone" dataKey="accuracy" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366F1' }} activeDot={{ r: 5 }} name="Accuracy %" />
                    </LineChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Summary */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="card p-6 bg-gradient-to-br from-slate-50 to-indigo-50/30"
            >
                <h3 className="font-semibold text-slate-900 mb-3">30-Day Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded-xl">
                        <p className="text-2xl font-bold text-slate-900">{data.total_attempted}</p>
                        <p className="text-xs text-slate-500 mt-1">Questions Attempted</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl">
                        <p className="text-2xl font-bold text-emerald-600">{data.total_correct}</p>
                        <p className="text-xs text-slate-500 mt-1">Correct Answers</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl">
                        <p className="text-2xl font-bold text-indigo-600">{data.accuracy}%</p>
                        <p className="text-xs text-slate-500 mt-1">Overall Accuracy</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl">
                        <p className="text-2xl font-bold text-orange-500">{data.current_streak}</p>
                        <p className="text-xs text-slate-500 mt-1">Day Streak</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Analytics;
