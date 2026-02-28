import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { practiceService, skillService } from '../services/api';
import { CheckCircle2, XCircle, ArrowRight, Loader2, Award, Clock, Zap, Plus, X, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DIFFICULTIES = [
    { id: 'beginner', label: 'Beginner', desc: 'Fundamentals & basics', color: 'from-emerald-500 to-teal-500' },
    { id: 'intermediate', label: 'Intermediate', desc: 'Applied concepts', color: 'from-amber-500 to-orange-500' },
    { id: 'advanced', label: 'Advanced', desc: 'Expert-level depth', color: 'from-red-500 to-rose-500' },
];

const PREDEFINED_SKILLS = [
    { id: 'Python', name: 'Python', icon: '🐍', description: 'Python Programming' },
    { id: 'SQL', name: 'SQL', icon: '🗄️', description: 'Database & SQL' },
    { id: 'Networking', name: 'Networking', icon: '📡', description: 'Network Protocols' },
    { id: 'Linux', name: 'Linux', icon: '🖥️', description: 'Linux System Admin' },
    { id: 'AWS', name: 'AWS', icon: '☁️', description: 'AWS Services' },
    { id: 'JavaScript', name: 'JavaScript', icon: '💻', description: 'JavaScript & Web Dev' }
];

const Sprint = () => {
    // Selection state
    const [phase, setPhase] = useState('select');
    const [skills, setSkills] = useState([]);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState('beginner');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [questionCount, setQuestionCount] = useState(5);
    const [skillsLoading, setSkillsLoading] = useState(true);

    // Add skill modal
    const [showAddSkill, setShowAddSkill] = useState(false);
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillDesc, setNewSkillDesc] = useState('');
    const [newTopicsText, setNewTopicsText] = useState('');

    // Add topic modal
    const [showAddTopic, setShowAddTopic] = useState(false);
    const [newTopicName, setNewTopicName] = useState('');

    // Quiz state
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [timedMode, setTimedMode] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Fetch skills from API
    const fetchSkills = async () => {
        try {
            const res = await skillService.getAll();
            setSkills(res.skills || []);
            if (res.skills?.length > 0 && !selectedSkill) {
                setSelectedSkill(res.skills[0]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSkillsLoading(false);
        }
    };

    useEffect(() => { fetchSkills(); }, []);

    // Set default topic when skill changes
    useEffect(() => {
        if (selectedSkill?.topics?.length > 0) {
            setSelectedTopic(selectedSkill.topics[0].name);
        } else {
            setSelectedTopic('');
        }
    }, [selectedSkill]);

    // Timer logic
    useEffect(() => {
        if (!timedMode || phase !== 'quiz' || !questions.length) return;
        if (timeLeft <= 0) { handleNext(); return; }
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timedMode, timeLeft, phase, questions.length]);

    useEffect(() => { setTimeLeft(30); }, [currentIndex]);

    const handleAddSkill = async () => {
        if (!newSkillName.trim()) return;
        try {
            console.log('Adding skill:', { name: newSkillName, desc: newSkillDesc, topics: newTopicsText });
            const topics = newTopicsText.split(',').map(t => t.trim()).filter(Boolean);
            const res = await skillService.create(newSkillName.trim(), newSkillDesc.trim(), topics);
            console.log('Skill created response:', res);
            setNewSkillName('');
            setNewSkillDesc('');
            setNewTopicsText('');
            setShowAddSkill(false);
            await fetchSkills();
            // Select the new skill
            if (res.skill) {
                const refreshed = await skillService.getAll();
                const newSkill = (refreshed.skills || []).find(s => s.id === res.skill.id);
                if (newSkill) setSelectedSkill(newSkill);
            }
        } catch (err) { 
            console.error('Error adding skill:', err);
            alert(`Failed to add skill: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDeleteSkill = async (e, skillId) => {
        e.stopPropagation();
        try {
            await skillService.delete(skillId);
            if (selectedSkill?.id === skillId) setSelectedSkill(null);
            fetchSkills();
        } catch (err) { console.error(err); }
    };

    const handleAddTopic = async () => {
        if (!newTopicName.trim() || !selectedSkill) return;
        try {
            await skillService.addTopic(selectedSkill.id, newTopicName.trim());
            setNewTopicName('');
            setShowAddTopic(false);
            // Refresh skills to get updated topics
            const res = await skillService.getAll();
            setSkills(res.skills || []);
            const updated = (res.skills || []).find(s => s.id === selectedSkill.id);
            if (updated) setSelectedSkill(updated);
        } catch (err) { console.error(err); }
    };

    const handleGenerate = async () => {
        if (!selectedSkill) {
            setError('Please select a skill first');
            return;
        }
        setPhase('loading');
        setError('');
        try {
            const topicStr = selectedTopic
                ? `${selectedSkill.name} - ${selectedTopic}`
                : selectedSkill.name;
            console.log('Generating questions for:', topicStr, selectedDifficulty, questionCount);
            const res = await practiceService.generateQuestions(topicStr, selectedDifficulty, questionCount);
            console.log('Questions response:', res);
            if (res.questions && res.questions.length > 0) {
                setQuestions(res.questions);
                setPhase('quiz');
            } else {
                setError(res.message || 'No questions generated. Please try another skill or difficulty.');
                setPhase('select');
            }
        } catch (err) {
            console.error('Generate error:', err);
            setError(err.response?.data?.message || 'Failed to generate questions. Please try again.');
            setPhase('select');
        }
    };

    const handleSelect = (key) => setSelectedOption(key);

    const handleNext = async () => {
        const currentQ = questions[currentIndex];
        const newAnswers = [...answers, {
            question_id: currentQ.id,
            selected_option: selectedOption || '',
            time_taken: timedMode ? 30 - timeLeft : 0
        }];
        setAnswers(newAnswers);
        setSelectedOption(null);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsSubmitting(true);
            try {
                const res = await practiceService.submitAnswers(newAnswers);
                setResults(res);
                setPhase('results');
            } catch (err) { console.error(err); }
            finally { setIsSubmitting(false); }
        }
    };

    const handleRestart = () => {
        setPhase('select');
        setQuestions([]);
        setCurrentIndex(0);
        setSelectedOption(null);
        setResults(null);
        setAnswers([]);
        setError('');
    };

    // --- SELECTION SCREEN ---
    if (phase === 'select') {
        const topics = selectedSkill?.topics || [];
        return (
            <div className="max-w-3xl mx-auto space-y-8">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">AI-Powered Practice</h2>
                            <p className="text-sm text-slate-500">Pick a skill or add your own — questions generated dynamically</p>
                        </div>
                    </div>
                </motion.div>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        {error}
                    </motion.div>
                )}

                {/* Step 1: Skill */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">1</span>
                            <h3 className="font-semibold text-slate-900">Choose Skill</h3>
                        </div>
                        <button onClick={() => setShowAddSkill(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                            <Plus size={14} /> Add Skill
                        </button>
                    </div>

                    {skillsLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : skills.length === 0 ? (
                        <div className="space-y-6">
                            <div className="text-center py-4">
                                <p className="text-slate-600 text-sm mb-2">No custom skills yet. Choose a predefined skill to start practicing or add your own:</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {PREDEFINED_SKILLS.map(skill => {
                                    const isSelected = selectedSkill?.id === skill.id;
                                    return (
                                        <button
                                            type="button"
                                            key={skill.id}
                                            onClick={() => {
                                                const newSkill = {
                                                    id: skill.id,
                                                    name: skill.name,
                                                    icon: skill.icon,
                                                    description: skill.description,
                                                    topics: []
                                                };
                                                console.log('Skill selected:', newSkill);
                                                setSelectedSkill(newSkill);
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all text-center cursor-pointer ${isSelected
                                                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                                : 'border-slate-100 hover:border-indigo-400 hover:bg-indigo-50'
                                            }`}
                                        >
                                            <span className="text-3xl mb-2 block">{skill.icon}</span>
                                            <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>{skill.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">{skill.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="text-center pt-4 border-t border-slate-200">
                                <button onClick={() => setShowAddSkill(true)} className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5 mx-auto">
                                    <Plus size={14} /> Add Custom Skill
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {skills.map(s => {
                                const active = selectedSkill?.id === s.id;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedSkill(s)}
                                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all text-left group relative ${active
                                                ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span className="text-lg">{s.icon || '📚'}</span>
                                        <span className={`text-sm font-medium truncate ${active ? 'text-indigo-700' : 'text-slate-600'}`}>{s.name}</span>
                                        <button
                                            onClick={(e) => handleDeleteSkill(e, s.id)}
                                            className="absolute top-1.5 right-1.5 p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete skill"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Step 2: Difficulty */}
                {selectedSkill && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">2</span>
                            <h3 className="font-semibold text-slate-900">Select Difficulty</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {DIFFICULTIES.map(d => {
                                const active = selectedDifficulty === d.id;
                                return (
                                    <button
                                        key={d.id}
                                        onClick={() => setSelectedDifficulty(d.id)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${active
                                                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${d.color} mb-2`} />
                                        <p className={`text-sm font-semibold ${active ? 'text-indigo-700' : 'text-slate-700'}`}>{d.label}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{d.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Topic */}
                {selectedSkill && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">3</span>
                                <h3 className="font-semibold text-slate-900">Pick Topic</h3>
                            </div>
                            <button onClick={() => setShowAddTopic(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                                <Plus size={14} /> Add Topic
                            </button>
                        </div>
                        {topics.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-slate-400 text-sm mb-2">No topics added yet for {selectedSkill.name}.</p>
                                <p className="text-xs text-slate-400">Add topics or practice the whole skill → questions will cover general {selectedSkill.name}.</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedTopic('')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTopic === ''
                                            ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    All Topics
                                </button>
                                {topics.sort((a, b) => a.order - b.order).map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTopic(t.name)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTopic === t.name
                                                ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Step 4: Question Count */}
                {selectedSkill && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">4</span>
                            <h3 className="font-semibold text-slate-900">Number of Questions</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[5, 10].map(count => (
                                <button
                                    key={count}
                                    onClick={() => setQuestionCount(count)}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${questionCount === count
                                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <p className={`text-2xl font-bold ${questionCount === count ? 'text-indigo-700' : 'text-slate-700'}`}>{count}</p>
                                    <p className="text-xs text-slate-400 mt-1">Questions</p>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Timer option + Generate */}
                {selectedSkill && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-4">
                        <div className="card p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <Clock size={16} className="text-slate-400" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-700">Timed Mode</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">Optional</span>
                                    </div>
                                    <span className="text-xs text-slate-400">(30s/question)</span>
                                </div>
                                <button
                                    onClick={() => setTimedMode(!timedMode)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${timedMode ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${timedMode ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>
                        </div>
                        <button onClick={handleGenerate} className="btn-primary flex items-center gap-2 w-full justify-center text-base py-3.5 px-8">
                            <Sparkles size={18} /> Generate Questions
                        </button>
                    </motion.div>
                )}

                {/* Add Skill Modal */}
                <AnimatePresence>
                    {showAddSkill && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowAddSkill(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold text-slate-900">Add New Skill</h3>
                                    <button onClick={() => setShowAddSkill(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Skill Name *</label>
                                        <input
                                            type="text" value={newSkillName} onChange={e => setNewSkillName(e.target.value)}
                                            placeholder="e.g. Machine Learning, Java, DevOps"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                                        <input
                                            type="text" value={newSkillDesc} onChange={e => setNewSkillDesc(e.target.value)}
                                            placeholder="Brief description (optional)"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Topics (comma-separated)</label>
                                        <textarea
                                            value={newTopicsText} onChange={e => setNewTopicsText(e.target.value)}
                                            placeholder="e.g. Regression, Classification, Neural Networks, NLP"
                                            rows={3}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors resize-none"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Separate topics with commas. You can add more later.</p>
                                    </div>
                                    <button onClick={handleAddSkill} disabled={!newSkillName.trim()} className="btn-primary w-full">
                                        Create Skill
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Add Topic Modal */}
                <AnimatePresence>
                    {showAddTopic && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowAddTopic(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold text-slate-900">Add Topic to {selectedSkill?.name}</h3>
                                    <button onClick={() => setShowAddTopic(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic Name</label>
                                        <input
                                            type="text" value={newTopicName} onChange={e => setNewTopicName(e.target.value)}
                                            placeholder="e.g. Variables, OOP, APIs"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors"
                                            autoFocus
                                        />
                                    </div>
                                    <button onClick={handleAddTopic} disabled={!newTopicName.trim()} className="btn-primary w-full">
                                        Add Topic
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // --- LOADING SCREEN ---
    if (phase === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200"
                >
                    <Sparkles size={20} className="text-white" />
                </motion.div>
                <div className="text-center">
                    <p className="font-semibold text-slate-900">Generating questions...</p>
                    <p className="text-sm text-slate-500 mt-1">Crafting {selectedSkill?.name} questions for you</p>
                </div>
            </div>
        );
    }

    // --- RESULTS SCREEN ---
    if (phase === 'results' && results) {
        const scoreNum = parseInt(results.score.split('/')[0]);
        const total = parseInt(results.score.split('/')[1]);
        const pct = total > 0 ? Math.round((scoreNum / total) * 100) : 0;
        return (
            <div className="max-w-2xl mx-auto">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-center text-white">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                            <Award size={56} className="mx-auto mb-4 text-yellow-300" />
                        </motion.div>
                        <h2 className="text-3xl font-bold">Sprint Complete!</h2>
                        <p className="text-5xl font-extrabold mt-3">{pct}%</p>
                        <p className="text-indigo-200 mt-1">{results.score} correct</p>
                        <p className="text-sm text-indigo-200 mt-2 opacity-80">{selectedSkill?.name} • {selectedDifficulty}{selectedTopic ? ` • ${selectedTopic}` : ''}</p>
                        {results.streak_maintained && (
                            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/15 rounded-full backdrop-blur-sm">
                                <span className="text-lg">🔥</span>
                                <span className="text-sm font-medium">{results.current_streak} day streak!</span>
                            </div>
                        )}
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[40vh] overflow-y-auto">
                        {results.results.map((r, i) => (
                            <div key={i} className="p-5 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-slate-600">Question {i + 1}</span>
                                    {r.is_correct ? (
                                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                            <CheckCircle2 size={12} /> Correct
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                                            <XCircle size={12} /> Wrong
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg mt-2">
                                    <span className="font-medium text-slate-700">Explanation: </span>
                                    {r.explanation || `The correct answer was option ${r.correct_option}.`}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <button onClick={handleRestart} className="flex-1 py-3 rounded-xl font-semibold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 transition-colors">
                            Practice Again
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="flex-1 btn-primary text-center">
                            Dashboard
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // --- QUIZ SCREEN ---
    const currentQ = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
                <motion.div className="h-full bg-indigo-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25 }}
                    className="card p-6 sm:p-8"
                >
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                            {selectedSkill?.name} • {selectedDifficulty}
                        </span>
                        <div className="flex items-center gap-3">
                            {timedMode && (
                                <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${timeLeft <= 10 ? 'text-red-600 bg-red-50 animate-pulse' : 'text-slate-500 bg-slate-100'}`}>
                                    {timeLeft}s
                                </span>
                            )}
                            <span className="text-sm font-bold text-slate-400">{currentIndex + 1}/{questions.length}</span>
                        </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-8 leading-relaxed">{currentQ.question_text}</h2>

                    <div className="space-y-3">
                        {Object.entries(currentQ.options).map(([key, value]) => (
                            <button
                                key={key} onClick={() => handleSelect(key)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedOption === key
                                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                        : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${selectedOption === key ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>{key}</div>
                                <span className={`text-sm sm:text-base ${selectedOption === key ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>{value}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button onClick={handleNext} disabled={!selectedOption || isSubmitting} className="btn-primary flex items-center gap-2">
                            {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                            {currentIndex === questions.length - 1 ? 'Finish Sprint' : 'Continue'}
                            {!isSubmitting && currentIndex !== questions.length - 1 && <ArrowRight size={16} />}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Sprint;
