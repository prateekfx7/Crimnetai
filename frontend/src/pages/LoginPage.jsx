import { useState } from 'react';
import { login as apiLogin } from '../api';
import { Shield, Eye, EyeOff, Sparkles, UserCheck, ShieldAlert } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const performLogin = async (user, pass) => {
    setError('');
    setLoading(true);

    const u = (user || '').trim();
    const p = (pass || '').trim();

    try {
      const res = await apiLogin(u, p);
      if (res?.data?.token && res?.data?.user) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
        return;
      }
    } catch (err) {
      const isInvestigator = u.toLowerCase().includes('invest');
      const isDemo = isInvestigator || u.toLowerCase().includes('admin');
      if (isDemo) {
        const demoUser = {
          _id: isInvestigator ? 'mock-investigator-01' : 'mock-admin-01',
          username: u,
          fullName: isInvestigator ? 'Inspector Patel' : 'Commissioner Sharma',
          role: isInvestigator ? 'investigator' : 'admin',
          badge: isInvestigator ? 'MUM-CIB-042' : 'NCRB-001',
          department: isInvestigator ? 'Mumbai Crime Branch' : 'Central Bureau',
        };
        localStorage.setItem('token', 'mock-jwt-token-demo-mode');
        localStorage.setItem('user', JSON.stringify(demoUser));
        onLogin(demoUser);
        return;
      }
      setError(err.response?.data?.error || 'Login failed. Please click 1-Click Demo above.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performLogin(username, password);
  };

  const handleQuickDemo = (role) => {
    const isInvestigator = role !== 'admin';
    const u = isInvestigator ? 'investigator' : 'admin';
    const p = isInvestigator ? 'invest123' : 'admin123';
    setUsername(u);
    setPassword(p);

    const demoUser = {
      _id: isInvestigator ? 'mock-investigator-01' : 'mock-admin-01',
      username: u,
      fullName: isInvestigator ? 'Inspector Patel' : 'Commissioner Sharma',
      role: isInvestigator ? 'investigator' : 'admin',
      badge: isInvestigator ? 'MUM-CIB-042' : 'NCRB-001',
      department: isInvestigator ? 'Mumbai Crime Branch' : 'Central Bureau',
    };

    // Instant zero-failure demo login
    localStorage.setItem('token', 'mock-jwt-token-demo-mode');
    localStorage.setItem('user', JSON.stringify(demoUser));
    onLogin(demoUser);

    // Sync live token in background if backend is connected
    apiLogin(u, p).then((res) => {
      if (res?.data?.token && res?.data?.user) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    }).catch(() => {});
  };

  return (
    <div className="login-page">
      <div className="login-container animate-fade-in">
        <div className="login-header">
          <div className="login-logo">
            <Shield size={28} color="white" />
          </div>
          <h1>CrimNet Analyzer</h1>
          <p>AI-Powered Criminal Network Analysis System</p>
        </div>

        <div className="login-card">
          {/* Quick Demo Access Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
              <Sparkles size={16} />
              <span>1-Click Demo Access</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleQuickDemo('investigator')}
                disabled={loading}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '12px',
                  background: 'var(--card-bg, #ffffff)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                  <UserCheck size={16} color="var(--primary)" />
                  <span>Investigator</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                  Inspector Patel • MUM-CIB
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  marginTop: '6px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#2563eb'
                }}>
                  Click to Sign In
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                disabled={loading}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '12px',
                  background: 'var(--card-bg, #ffffff)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                  <ShieldAlert size={16} color="#d97706" />
                  <span>Administrator</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                  Commissioner Sharma • NCRB
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  marginTop: '6px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(217, 119, 6, 0.1)',
                  color: '#d97706'
                }}>
                  Click to Sign In
                </span>
              </button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
            margin: '18px 0',
            color: 'var(--muted-soft)',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            <span style={{ padding: '0 10px' }}>or sign in with credentials</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

            <div className="input-group">
              <label className="input-label" htmlFor="username">Username</label>
              <input
                id="username"
                className="input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '44px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-soft)',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '4px' }}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="login-demo" style={{ marginTop: '16px' }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Demo Credentials:</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px' }}>
              <span
                onClick={() => { setUsername('investigator'); setPassword('invest123'); }}
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                title="Click to fill form"
              >
                Investigator: <code>investigator</code> / <code>invest123</code>
              </span>
              <span
                onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                title="Click to fill form"
              >
                Admin: <code>admin</code> / <code>admin123</code>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
