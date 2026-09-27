import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Network, Users, AlertTriangle, Upload,
  ChevronDown, LogOut, Search, FileText
} from 'lucide-react';
import { getCases } from '../api';
import { MOCK_CASE } from '../mockData';

export default function Layout({ children, user, onLogout, currentCaseId, onCaseChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [cases, setCases] = useState([MOCK_CASE]);

  useEffect(() => {
    getCases()
      .then(res => {
        if (res?.data?.length) setCases(res.data);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/network', icon: Network, label: 'Network Graph' },
    { path: '/entities', icon: Users, label: 'Entities' },
    { path: '/patterns', icon: AlertTriangle, label: 'Patterns', badge: null },
    { path: '/upload', icon: Upload, label: 'Data Ingestion' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Shield size={20} color="white" />
          </div>
          <div>
            <h1>CrimNet</h1>
            <div className="subtitle">NCRB Analysis</div>
          </div>
        </div>

        {/* Case Selector */}
        {cases.length > 0 && (
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="nav-section-label">Active Case</div>
            <select
              value={currentCaseId || ''}
              onChange={(e) => onCaseChange(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--on-dark)',
                padding: '8px 10px',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {cases.map(c => (
                <option key={c._id} value={c._id} style={{ color: '#0a0a0a' }}>
                  {c.title.length > 30 ? c.title.substring(0, 30) + '...' : c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="nav-section-label">Investigation</div>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="name">{user?.fullName || 'User'}</div>
              <div className="role">{user?.role || 'investigator'}</div>
            </div>
            <button
              className="btn-ghost"
              onClick={handleLogout}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--on-dark-soft)', padding: '4px',
              }}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
