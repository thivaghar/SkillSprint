import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';

// Lazy load routes for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const Sprint = lazy(() => import('./components/Sprint'));
const HabitTracker = lazy(() => import('./components/HabitTracker'));
const LearningProgress = lazy(() => import('./components/LearningProgress'));
const Analytics = lazy(() => import('./components/Analytics'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 text-sm">Loading...</p>
    </div>
  </div>
);

// Simple PrivateRoute wrapper
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={
          <PrivateRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Onboarding />
            </Suspense>
          </PrivateRoute>
        } />

        {/* All protected pages wrapped in Layout */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Layout><Dashboard /></Layout>
            </Suspense>
          </PrivateRoute>
        } />
        <Route path="/habits" element={
          <PrivateRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Layout><HabitTracker /></Layout>
            </Suspense>
          </PrivateRoute>
        } />
        <Route path="/learning" element={
          <PrivateRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Layout><LearningProgress /></Layout>
            </Suspense>
          </PrivateRoute>
        } />
        <Route path="/practice" element={
          <PrivateRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Layout><Sprint /></Layout>
            </Suspense>
          </PrivateRoute>
        } />
        <Route path="/analytics" element={
          <PrivateRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Layout><Analytics /></Layout>
            </Suspense>
          </PrivateRoute>
        } />

        {/* Default Route */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
