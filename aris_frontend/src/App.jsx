import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import CollegeToppers from './pages/CollegeToppers';
import ScienceToppers from './pages/ScienceToppers';
import CommerceToppers from './pages/CommerceToppers';
import SectionToppers from './pages/SectionToppers';
import Sections from './pages/Sections';
import Heatmap from './pages/Heatmap';
import Subjects from './pages/Subjects';
import Upload from './pages/Upload';
import { getStatus, clearData } from './services/api';

const routes = [
  "/",
  "/college-toppers",
  "/science-toppers",
  "/commerce-toppers",
  "/section-toppers",
  "/sections",
  "/heatmap",
  "/subjects",
  "/upload"
];

function Toast({ message, onClear }) {
  useEffect(() => {
    const timer = setTimeout(onClear, 3000);
    return () => clearTimeout(timer);
  }, [onClear, message]);

  if (!message) return null;

  return (
    <div className="toast-container">
      <div className="toast">{message}</div>
    </div>
  );
}

function KeyboardNavigator({ presentationMode, setPresentationMode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!presentationMode) return;

    const handleKey = (e) => {
      const currentPath = location.pathname;
      const currentIndex = routes.indexOf(currentPath);

      if (e.key === "ArrowRight") {
        const nextIndex = (currentIndex + 1) % (routes.length - 1); 
        navigate(routes[nextIndex]);
      }
      if (e.key === "ArrowLeft") {
        const prevIndex = (currentIndex - 1 + (routes.length - 1)) % (routes.length - 1);
        navigate(routes[prevIndex]);
      }
      if (e.key === "Escape") {
        setPresentationMode(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [presentationMode, location.pathname, navigate, setPresentationMode]);

  return null;
}

function AppRoutes() {
  const [presentationMode, setPresentationMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusData, setStatusData] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      setIsAuthenticated(true);
    }
    setAuthChecked(true);
  }, []);

  const updateStatus = () => {
    getStatus().then(data => setStatusData(data)).catch(() => {});
  };

  useEffect(() => {
    if (isAuthenticated) {
      updateStatus();
      // Show message to upload file
      setToastMessage('Please upload an Excel file to view results');
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    // Clear all cached data and reset state on login
    setStatusData(null);
    setRefreshKey(0);
    setIsAuthenticated(true);
    navigate('/upload');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('cachedData');
    sessionStorage.clear();
    setStatusData(null);
    setRefreshKey(0);
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleClear = async () => {
    try {
      // Call backend API to clear data
      await clearData();
      // Clear local state
      localStorage.removeItem('cachedData');
      sessionStorage.clear();
      setStatusData(null);
      setRefreshKey(prev => prev + 1);
      setToastMessage('Results cleared. Please upload a new file to continue.');
      navigate('/upload');
    } catch (error) {
      console.error('Error clearing data:', error);
      setToastMessage('Error clearing results. Please try again.');
    }
  };

  // Show loading state while checking authentication
  if (!authChecked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '18px', color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const triggerRefresh = (summary) => {
    // 1. Immediately update status signals from backend
    getStatus()
      .then(data => {
        setStatusData(data);
        // 2. Increment refresh key for all page consumers
        setRefreshKey(prev => prev + 1);
        // 3. Trigger success toast
        if (summary) {
          setToastMessage(`Results updated • ${summary.toppers} toppers processed`);
        }
      })
      .catch(() => {
        setRefreshKey(prev => prev + 1);
      });
  };

  return (
    <div className={presentationMode ? "presentation-view" : ""}>
      <KeyboardNavigator 
        presentationMode={presentationMode} 
        setPresentationMode={setPresentationMode} 
      />
      <Toast message={toastMessage} onClear={() => setToastMessage("")} />
      <Routes>
        <Route path="/" element={
          <Layout 
            presentationMode={presentationMode} 
            setPresentationMode={setPresentationMode}
            statusData={statusData}
            refreshKey={refreshKey}
            onLogout={handleLogout}
            onClear={handleClear}
          />
        }>
          <Route index element={<Navigate to="/college-toppers" replace />} />
          <Route path="college-toppers" element={<CollegeToppers />} />
          <Route path="science-toppers" element={<ScienceToppers />} />
          <Route path="commerce-toppers" element={<CommerceToppers />} />
          <Route path="section-toppers" element={<SectionToppers />} />
          <Route path="sections" element={<Sections />} />
          <Route path="heatmap" element={<Heatmap />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="upload" element={<Upload triggerRefresh={triggerRefresh} />} />
        </Route>
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
