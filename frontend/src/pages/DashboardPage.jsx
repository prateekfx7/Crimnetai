import { useState, useEffect } from 'react';
import { getStats, getInfluencers, getPatterns } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, GitBranch, AlertTriangle, Database, Crown, TrendingUp, Shield } from 'lucide-react';

const ENTITY_COLORS = {
  PERSON: '#1d4ed8',
  PHONE_NUMBER: '#15803d',
  LOCATION: '#92400e',
  ORGANIZATION: '#7e22ce',
  VEHICLE_NO: '#be123c',
  ACCOUNT: '#0369a1',
};

const PIE_COLORS = ['#ff4d8b', '#1a3a3a', '#b8a4ed', '#ffb084', '#e8b94a', '#a4d4c5'];

export default function DashboardPage({ caseId }) {
  const [stats, setStats] = useState(null);
  const [influencers, setInfluencers] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    Promise.all([
      getStats(caseId),
      getInfluencers(caseId),
      getPatterns(caseId),
    ])
      .then(([statsRes, infRes, patRes]) => {
        setStats(statsRes.data);
        setInfluencers(infRes.data.slice(0, 10));
        setPatterns(patRes.data.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [caseId]);

  if (!caseId) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📂</div>
        <h3 className="title-md" style={{ marginBottom: 8 }}>No Case Selected</h3>
        <p className="body-sm">Select a case from the sidebar or upload data to get started.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const entityTypeData = stats?.entityTypes
    ? Object.entries(stats.entityTypes).map(([name, value]) => ({ name: name.replace('_', ' '), value }))
    : [];

  const severityData = stats?.patternSeverities
    ? Object.entries(stats.patternSeverities).map(([name, value]) => ({ name, value }))
    : [];

  const influencerChartData = influencers
    .filter(i => i.influenceScore > 0)
    .slice(0, 8)
    .map(i => ({
      name: i.name.length > 12 ? i.name.substring(0, 12) + '..' : i.name,
      score: Math.round(i.influenceScore * 1000) / 10,
      type: i.type,
    }));

  const severityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2>Investigation Dashboard</h2>
        <p className="page-subtitle">Real-time analytics for active criminal network investigation</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid stagger-children">
        <div className="stat-card coral">
          <div className="stat-icon"><Users size={28} /></div>
          <div className="stat-value">{stats?.entityCount || 0}</div>
          <div className="stat-label">Entities Tracked</div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon"><GitBranch size={28} /></div>
          <div className="stat-value">{stats?.relationshipCount || 0}</div>
          <div className="stat-label">Relationships</div>
        </div>
        <div className="stat-card pink">
          <div className="stat-icon"><AlertTriangle size={28} /></div>
          <div className="stat-value">{stats?.patternCount || 0}</div>
          <div className="stat-label">Suspicious Patterns</div>
        </div>
        <div className="stat-card ochre">
          <div className="stat-icon"><Database size={28} /></div>
          <div className="stat-value">{stats?.dataSourceCount || 0}</div>
          <div className="stat-label">Data Sources</div>
        </div>
      </div>

      {/* Key Influencer Highlight */}
      {stats?.topInfluencer && (
        <div className="card" style={{
          marginBottom: 'var(--space-lg)',
          background: 'linear-gradient(135deg, var(--surface-soft), var(--surface-card))',
          borderColor: 'var(--brand-ochre)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: 'var(--brand-ochre)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Crown size={24} color="var(--ink)" />
            </div>
            <div>
              <div className="caption-uppercase" style={{ marginBottom: 4 }}>Key Influencer Identified</div>
              <div className="title-lg" style={{ marginBottom: 2 }}>{stats.topInfluencer.name}</div>
              <div className="caption">
                Type: {stats.topInfluencer.type} · Influence Score: {(stats.topInfluencer.score * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="dashboard-charts">
        {/* Influencer Ranking Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Influencers</div>
              <div className="card-subtitle">Ranked by composite influence score</div>
            </div>
            <TrendingUp size={18} color="var(--muted)" />
          </div>
          <div style={{ height: 300 }}>
            {influencerChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={influencerChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6a6a6a' }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: '#3a3a3a' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,10,0.92)', border: 'none',
                      borderRadius: 8, color: 'white', fontSize: 13,
                    }}
                    labelStyle={{ color: 'white', fontWeight: 600 }}
                    formatter={(value) => [`${value}%`, 'Influence Score']}
                  />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} fill="var(--brand-coral)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No influencer data yet</p></div>
            )}
          </div>
        </div>

        {/* Entity Type Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Entity Types</div>
              <div className="card-subtitle">Distribution by category</div>
            </div>
          </div>
          <div style={{ height: 300 }}>
            {entityTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={entityTypeData}
                    cx="50%" cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {entityTypeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,10,0.92)', border: 'none',
                      borderRadius: 8, color: 'white', fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No entity data yet</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Patterns */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Suspicious Patterns Detected</div>
            <div className="card-subtitle">Latest alerts from pattern detection engine</div>
          </div>
          <AlertTriangle size={18} color="var(--error)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {patterns.length > 0 ? patterns.map((p, i) => (
            <div key={p._id || i} className="pattern-card" style={{ border: 'none', padding: 'var(--space-sm) 0', borderBottom: i < patterns.length - 1 ? '1px solid var(--hairline-soft)' : 'none' }}>
              <div className={`pattern-icon ${p.severity}`}>
                {severityEmoji[p.severity] || '⚪'}
              </div>
              <div className="pattern-content">
                <div className="pattern-title">{p.title}</div>
                <div className="pattern-desc">{p.description.substring(0, 150)}{p.description.length > 150 ? '...' : ''}</div>
                <div className="pattern-meta">
                  <span className={`badge badge-${p.severity}`}>{p.severity}</span>
                  <span className="pattern-score">Score: {p.score}/100</span>
                  <span className="pattern-score">{p.type.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
              <p>No patterns detected yet. Upload data to begin analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
