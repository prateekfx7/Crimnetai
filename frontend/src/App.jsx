import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NetworkPage from './pages/NetworkPage';
import EntitiesPage from './pages/EntitiesPage';
import PatternsPage from './pages/PatternsPage';
import UploadPage from './pages/UploadPage';
import { getCases } from './api';

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [currentCaseId, setCurrentCaseId] = useState(() => {
    return localStorage.getItem('currentCaseId') || 'demo-case-001';
  });

  useEffect(() => {
    if (user) {
      getCases()
        .then(res => {
          if (res?.data?.length > 0) {
            const firstId = res.data[0]._id;
            setCurrentCaseId(prev => {
              const selected = (prev && prev !== 'demo-case-001') ? prev : firstId;
              localStorage.setItem('currentCaseId', selected);
              return selected;
            });
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const handleCaseChange = (newCaseId) => {
    setCurrentCaseId(newCaseId);
    localStorage.setItem('currentCaseId', newCaseId);
  };

  return (
    <BrowserRouter>
      {!user ? (
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Layout
          user={user}
          onLogout={handleLogout}
          currentCaseId={currentCaseId}
          onCaseChange={handleCaseChange}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage caseId={currentCaseId} />} />
            <Route path="/network" element={<NetworkPage caseId={currentCaseId} />} />
            <Route path="/entities" element={<EntitiesPage caseId={currentCaseId} />} />
            <Route path="/patterns" element={<PatternsPage caseId={currentCaseId} />} />
            <Route path="/upload" element={<UploadPage caseId={currentCaseId} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  );
}

export default App;
