import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    register: async (email, password) => {
        const response = await api.post('/auth/register', { email, password });
        return response.data;
    },
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    getCurrentUser: async () => {
        const response = await api.get('/users/me');
        return response.data;
    },
    updateGoal: async (topic, difficulty, questionCount = 5) => {
        const response = await api.post('/users/goals', { topic, difficulty, question_count: questionCount });
        return response.data;
    }
};

export const practiceService = {
    getDailyQuestions: async () => {
        const response = await api.get('/practice/daily');
        return response.data;
    },
    generateQuestions: async (topic, difficulty, count = 5) => {
        const response = await api.post('/practice/generate', { topic, difficulty, count });
        return response.data;
    },
    submitAnswers: async (answers) => {
        const response = await api.post('/practice/submit', { answers });
        return response.data;
    }
};

export const dashboardService = {
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    }
};

export const paymentService = {
    createCheckoutSession: async () => {
        const response = await api.post('/payments/create-checkout-session');
        return response.data;
    }
};

export const habitService = {
    getAll: async () => {
        const response = await api.get('/habits');
        return response.data;
    },
    create: async (name, frequency = 'daily') => {
        const response = await api.post('/habits', { name, frequency });
        return response.data;
    },
    update: async (id, name, frequency = 'daily') => {
        const response = await api.put(`/habits/${id}`, { name, frequency });
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/habits/${id}`);
        return response.data;
    },
    logToday: async (id) => {
        const response = await api.post(`/habits/${id}/log`);
        return response.data;
    },
    getHeatmap: async () => {
        const response = await api.get('/habits/heatmap');
        return response.data;
    }
};

export const skillService = {
    getAll: async () => {
        const response = await api.get('/skills');
        return response.data;
    },
    create: async (name, description = '', topics = []) => {
        const response = await api.post('/skills', { name, description, topics });
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/skills/${id}`);
        return response.data;
    },
    addTopic: async (skillId, name, description = '') => {
        const response = await api.post(`/skills/${skillId}/topics`, { name, description });
        return response.data;
    },
    getProgress: async (skillId) => {
        const response = await api.get(`/skills/${skillId}/progress`);
        return response.data;
    },
    updateProgress: async (skillId, data) => {
        const response = await api.put(`/skills/${skillId}/progress`, data);
        return response.data;
    }
};

export const analyticsService = {
    getSummary: async () => {
        const response = await api.get('/analytics/summary');
        return response.data;
    }
};

export default api;
