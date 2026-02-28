import React, { useState, useEffect } from 'react';
import { habitService } from '../services/api';
import { Plus, Trash2, CheckCircle2, Circle, Flame, X, Edit2, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HabitTracker = () => {
    const [habits, setHabits] = useState([]);
    const [heatmap, setHeatmap] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newFreq, setNewFreq] = useState('daily');
    const [editingHabit, setEditingHabit] = useState(null);
    const [selectedHabit, setSelectedHabit] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            console.log('Fetching habit data...');
            const [habitsRes, heatmapRes] = await Promise.all([
                habitService.getAll(),
                habitService.getHeatmap()
            ]);
            console.log('Habits fetched:', habitsRes);
            setHabits(habitsRes.habits);
            setHeatmap(heatmapRes.heatmap || {});
        } catch (err) {
            console.error('Error fetching data:', err);
            alert(`Failed to load data: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            console.log('Creating habit:', { name: newName, frequency: newFreq });
            const response = await habitService.create(newName.trim(), newFreq);
            console.log('Habit created:', response);
            setNewName('');
            setNewFreq('daily');
            setShowModal(false);
            fetchData();
        } catch (err) { 
            console.error('Error creating habit:', err);
            alert(`Failed to create habit: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleEdit = async () => {
        if (!editingHabit || !newName.trim()) return;
        try {
            console.log('Updating habit:', { id: editingHabit.id, name: newName, frequency: newFreq });
            const response = await habitService.update(editingHabit.id, newName.trim(), newFreq);
            console.log('Habit updated:', response);
            setNewName('');
            setEditingHabit(null);
            setShowEditModal(false);
            fetchData();
        } catch (err) { 
            console.error('Error updating habit:', err);
            alert(`Failed to update habit: ${err.response?.data?.message || err.message}`);
        }
    };

    const openEditModal = (habit) => {
        setEditingHabit(habit);
        setNewName(habit.name);
        setNewFreq(habit.frequency);
        setShowEditModal(true);
    };

    const openStatsModal = (habit) => {
        setSelectedHabit(habit);
        setShowStatsModal(true);
    };

    const handleToggle = async (id) => {
        try {
            console.log('Toggling habit:', id);
            await habitService.logToday(id);
            fetchData();
        } catch (err) { 
            console.error('Error toggling habit:', err);
            alert(`Failed to toggle habit: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this habit?')) return;
        try {
            console.log('Deleting habit:', id);
            await habitService.delete(id);
            fetchData();
        } catch (err) { 
            console.error('Error deleting habit:', err);
            alert(`Failed to delete habit: ${err.response?.data?.message || err.message}`);
        }
    };

    // Generate heatmap grid (last 365 days)
    const heatmapDays = [];
    for (let i = 364; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        heatmapDays.push({ date: ds, count: heatmap[ds] || 0 });
    }

    const getHeatColor = (count) => {
        if (count === 0) return 'bg-slate-100';
        if (count === 1) return 'bg-orange-200';
        if (count === 2) return 'bg-orange-400';
        return 'bg-orange-600';
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="page-title">Habit Tracker</h2>
                    <p className="page-subtitle mt-1">Build consistency, one day at a time</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                    <Plus size={16} /> Add Habit
                </button>
            </div>

            {/* Habits List */}
            {habits.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                        <Plus size={28} className="text-orange-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">No habits yet</h3>
                    <p className="text-sm text-slate-500">Create your first habit to start tracking</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {habits.map((h, i) => (
                            <motion.div
                                key={h.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className="card p-5 flex flex-col gap-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleToggle(h.id)}
                                            className="transition-transform hover:scale-110"
                                        >
                                            {h.done_today ? (
                                                <CheckCircle2 size={28} className="text-emerald-500" />
                                            ) : (
                                                <Circle size={28} className="text-slate-300 hover:text-orange-400" />
                                            )}
                                        </button>
                                        <div>
                                            <h4 className={`font-semibold ${h.done_today ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{h.name}</h4>
                                            <p className="text-xs text-slate-400 capitalize">{h.frequency}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => openStatsModal(h)} 
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                            title="View stats"
                                        >
                                            <BarChart3 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => openEditModal(h)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                                            title="Edit habit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(h.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete habit">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <Flame size={14} className="text-orange-500" />
                                        <span className="font-semibold text-slate-700">{h.streak}</span>
                                        <span className="text-slate-400">day streak</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Heatmap */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Yearly Activity</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <span>Less</span>
                        {[0, 1, 2, 3].map(level => (
                            <div key={level} className={`w-3 h-3 rounded-sm ${getHeatColor(level)}`} />
                        ))}
                        <span>More</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-[3px]">
                    {heatmapDays.map((d, i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-sm ${getHeatColor(d.count)} transition-colors`}
                            title={`${d.date}: ${d.count} habits done`}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Edit Habit Modal */}
            <AnimatePresence>
                {showEditModal && editingHabit && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Edit Habit</h3>
                                <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        placeholder="e.g. Read 30 minutes"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Frequency</label>
                                    <div className="flex gap-3">
                                        {['daily', 'weekly'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setNewFreq(f)}
                                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize border transition-all ${newFreq === f ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleEdit} disabled={!newName.trim()} className="btn-primary w-full mt-2">
                                    Update Habit
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Modal */}
            <AnimatePresence>
                {showStatsModal && selectedHabit && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowStatsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Habit Stats</h3>
                                <button onClick={() => setShowStatsModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500">Habit Name</p>
                                    <p className="text-lg font-semibold text-slate-900">{selectedHabit.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-orange-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Flame size={18} className="text-orange-500" />
                                            <p className="text-xs text-slate-500">Current Streak</p>
                                        </div>
                                        <p className="text-2xl font-bold text-orange-600">{selectedHabit.streak || 0}</p>
                                        <p className="text-xs text-slate-400 mt-1">days</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-emerald-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 size={18} className="text-emerald-500" />
                                            <p className="text-xs text-slate-500">Done Today</p>
                                        </div>
                                        <p className="text-2xl font-bold text-emerald-600">{selectedHabit.done_today ? '✓' : '○'}</p>
                                        <p className="text-xs text-slate-400 mt-1">status</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-sm text-slate-600 mb-2"><strong>Frequency:</strong> <span className="capitalize">{selectedHabit.frequency}</span></p>
                                    <p className="text-sm text-slate-600"><strong>Created:</strong> {new Date(selectedHabit.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Habit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900">New Habit</h3>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        placeholder="e.g. Read 30 minutes"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Frequency</label>
                                    <div className="flex gap-3">
                                        {['daily', 'weekly'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setNewFreq(f)}
                                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize border transition-all ${newFreq === f ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleCreate} disabled={!newName.trim()} className="btn-primary w-full mt-2">
                                    Create Habit
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HabitTracker;
