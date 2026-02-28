import React, { useState, useEffect } from 'react';
import { skillService } from '../services/api';
import { BookOpen, ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CircularProgress = ({ pct, size = 64, strokeWidth = 5 }) => {
    const radius = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (pct / 100) * circ;
    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#6366F1" strokeWidth={strokeWidth}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                className="transition-all duration-700"
            />
            <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
                className="fill-slate-900 font-bold" style={{ fontSize: size * 0.22 }}
                transform={`rotate(90 ${size / 2} ${size / 2})`}
            >
                {Math.round(pct)}%
            </text>
        </svg>
    );
};

const LearningProgress = () => {
    const [skills, setSkills] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const res = await skillService.getAll();
                setSkills(res.skills);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSkills();
    }, []);

    const handleTopicToggle = async (skill, topicId) => {
        const progress = skill.progress || { completion_pct: 0, topics_done: 0 };
        const totalTopics = skill.topics?.length || 1;
        const currentDone = progress.topics_done || 0;
        const isCompleting = true; // toggling on
        const newDone = Math.min(currentDone + 1, totalTopics);
        const newPct = Math.round((newDone / totalTopics) * 100);

        try {
            await skillService.updateProgress(skill.id, {
                topics_done: newDone,
                completion_pct: newPct
            });
            // Refresh
            const res = await skillService.getAll();
            setSkills(res.skills);
        } catch (err) { console.error(err); }
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h2 className="page-title">Learning Progress</h2>
                <p className="page-subtitle mt-1">Track your skill development journey</p>
            </div>

            {skills.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={28} className="text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">No skills added yet</h3>
                    <p className="text-sm text-slate-500">Skills will appear here when they are created by your admin or system.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skills.map((skill, i) => {
                        const pct = skill.progress?.completion_pct || 0;
                        const isExpanded = expandedId === skill.id;
                        return (
                            <motion.div
                                key={skill.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="card overflow-hidden"
                            >
                                <div
                                    className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : skill.id)}
                                >
                                    <CircularProgress pct={pct} />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-900">{skill.name}</h3>
                                        <p className="text-sm text-slate-500 truncate">{skill.description || 'No description'}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-xs font-medium text-slate-500">
                                                {skill.progress?.topics_done || 0}/{skill.topics?.length || 0} topics
                                            </span>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                                </div>

                                <AnimatePresence>
                                    {isExpanded && skill.topics && skill.topics.length > 0 && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-slate-100 overflow-hidden"
                                        >
                                            <div className="p-4 space-y-2">
                                                {skill.topics.sort((a, b) => a.order - b.order).map((topic, ti) => {
                                                    const isDone = ti < (skill.progress?.topics_done || 0);
                                                    return (
                                                        <div key={topic.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                                            {isDone ? (
                                                                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                                            ) : (
                                                                <button onClick={(e) => { e.stopPropagation(); handleTopicToggle(skill, topic.id); }}>
                                                                    <Circle size={18} className="text-slate-300 hover:text-indigo-400 shrink-0 transition-colors" />
                                                                </button>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className={`text-sm font-medium ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{topic.name}</p>
                                                                {topic.description && <p className="text-xs text-slate-400 truncate">{topic.description}</p>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LearningProgress;
