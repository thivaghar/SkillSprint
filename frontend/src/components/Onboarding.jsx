import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { BookOpen, Database, Wifi, Terminal, Cloud, Code } from 'lucide-react';

const Onboarding = () => {
    const [skill, setSkill] = useState('Python');
    const [difficulty, setDifficulty] = useState('beginner');
    const [questionCount, setQuestionCount] = useState(5);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleStart = async () => {
        setLoading(true);
        try {
            await authService.updateGoal(skill.toLowerCase(), difficulty, questionCount);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const skills = [
        { id: 'Python', icon: <BookOpen className="text-blue-500" /> },
        { id: 'SQL', icon: <Database className="text-indigo-500" /> },
        { id: 'Networking', icon: <Wifi className="text-green-500" /> },
        { id: 'Linux', icon: <Terminal className="text-gray-600" /> },
        { id: 'AWS', icon: <Cloud className="text-orange-500" /> },
        { id: 'JavaScript', icon: <Code className="text-yellow-500" /> }
    ];

    const difficulties = ['beginner', 'intermediate', 'expert'];
    const questionCounts = [5, 10];

    return (
        <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
            <div className="w-full max-w-2xl p-8 bg-white rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Set Your Goal</h2>
                <p className="text-center text-gray-500 mb-8">What do you want to master?</p>

                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Select Skill</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {skills.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setSkill(s.id)}
                                className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${skill === s.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-gray-200 hover:border-indigo-300'}`}
                            >
                                {s.icon}
                                <span className="font-semibold text-center">{s.id}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Difficulty Level</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {difficulties.map(d => (
                            <div
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`cursor-pointer p-3 rounded-xl border text-center font-medium capitalize transition-all ${difficulty === d ? 'border-indigo-600 bg-indigo-600 text-white shadow-md transform scale-105' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                            >
                                {d}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-10">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Number of MCQ Questions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {questionCounts.map(count => (
                            <div
                                key={count}
                                onClick={() => setQuestionCount(count)}
                                className={`cursor-pointer p-4 rounded-xl border text-center font-bold transition-all ${questionCount === count ? 'border-indigo-600 bg-indigo-600 text-white shadow-md transform scale-105' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                            >
                                {count} Questions
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleStart} disabled={loading}
                    className="w-full py-4 rounded-xl text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                    {loading ? 'Setting up...' : 'Start building habit'}
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
