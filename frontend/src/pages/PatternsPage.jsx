import { useState, useEffect } from 'react';
import { getPatterns } from '../api';
import { AlertTriangle, Phone, Repeat, Smartphone, DollarSign, Zap, Clock, Filter } from 'lucide-react';

const PATTERN_CONFIG = {
  CALL_FREQUENCY_SPIKE: { icon: Phone, color: '#c2410c', label: 'Call Frequency Spike' },
  CIRCULAR_TRANSACTION: { icon: Repeat, color: '#7e22ce', label: 'Circular Transaction' },
  BURNER_PHONE: { icon: Smartphone, color: '#be123c', label: 'Burner Phone Pattern' },
  HIGH_VALUE_TRANSFER: { icon: DollarSign, color: '#0369a1', label: 'High-Value Transfer' },
  RAPID_TRANSACTIONS: { icon: Zap, color: '#a16207', label: 'Rapid Transactions' },
  NEW_CONNECTION: { icon: Clock, color: '#15803d', label: 'New Connection' },
  UNUSUAL_TIMING: { icon: Clock, color: '#6a6a6a', label: 'Unusual Timing' },
};

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function PatternsPage({ caseId }) {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const activeCaseId = caseId || 'demo-case-001';

  useEffect(() => {
    setLoading(true);
    getPatterns(activeCaseId)
      .then(res => setPatterns(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCaseId]);

  const filteredPatterns = patterns
    .filter(p => severityFilter === 'ALL' || p.severity === severityFilter)
    .filter(p => typeFilter === 'ALL' || p.type === typeFilter)
    .sort((a, b) => {
      const sevDiff = (SEVERITY_ORDER[a.severity] || 3) - (SEVERITY_ORDER[b.severity] || 3);
      if (sevDiff !== 0) return sevDiff;
      return (b.score || 0) - (a.score || 0);
    });

  const severityCounts = {
    critical: patterns.filter(p => p.severity === 'critical').length,
    high: patterns.filter(p => p.severity === 'high').length,
    medium: patterns.filter(p => p.severity === 'medium').length,
    low: patterns.filter(p => p.severity === 'low').length,
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2>Suspicious Patterns</h2>
        <p className="page-subtitle">{patterns.length} patterns detected by the analysis engine</p>
      </div>

      {/* Severity Summary */}
      <div className="stats-grid stagger-children" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-lg)' }}>
        {Object.entries(severityCounts).map(([sev, count]) => (
          <div
            key={sev}
            className="card"
            style={{
              textAlign: 'center', cursor: 'pointer',
              borderColor: severityFilter === sev ? 'var(--ink)' : 'var(--hairline)',
              borderWidth: severityFilter === sev ? 2 : 1,
            }}
            onClick={() => setSeverityFilter(severityFilter === sev ? 'ALL' : sev)}
          >
            <div style={{ fontSize: 28, marginBottom: 4 }}>
              {{ critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[sev]}
            </div>
            <div className="title-lg">{count}</div>
            <div className="caption" style={{ textTransform: 'capitalize' }}>{sev}</div>
          </div>
        ))}
      </div>

      {/* Type Filter */}
      <div className="filter-bar">
        <button
          className={`filter-chip ${typeFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setTypeFilter('ALL')}
        >
          <Filter size={14} /> All Types
        </button>
        {Object.entries(PATTERN_CONFIG).map(([type, config]) => {
          const count = patterns.filter(p => p.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              className={`filter-chip ${typeFilter === type ? 'active' : ''}`}
              onClick={() => setTypeFilter(typeFilter === type ? 'ALL' : type)}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Analyzing patterns...</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {filteredPatterns.length > 0 ? filteredPatterns.map((pattern, i) => {
            const config = PATTERN_CONFIG[pattern.type] || {};
            const Icon = config.icon || AlertTriangle;

            return (
              <div key={pattern._id || i} className="pattern-card" style={{ animationDelay: `${i * 60}ms` }}>
                <div className={`pattern-icon ${pattern.severity}`}>
                  <Icon size={20} />
                </div>
                <div className="pattern-content">
                  <div className="pattern-title">{pattern.title}</div>
                  <div className="pattern-desc">{pattern.description}</div>
                  <div className="pattern-meta" style={{ marginTop: 'var(--space-sm)' }}>
                    <span className={`badge badge-${pattern.severity}`}>
                      {pattern.severity}
                    </span>
                    <span className="badge" style={{ background: 'var(--surface-card)', color: 'var(--ink)' }}>
                      Score: {pattern.score}/100
                    </span>
                    <span className="badge" style={{ background: 'var(--surface-soft)', color: 'var(--muted)' }}>
                      {(config.label || pattern.type).replace(/_/g, ' ')}
                    </span>
                  </div>
                  {pattern.involvedEntityNames?.length > 0 && (
                    <div style={{ marginTop: 'var(--space-xs)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {pattern.involvedEntityNames.map((name, j) => (
                        <span key={j} className="badge badge-person" style={{ fontSize: 11 }}>{name}</span>
                      ))}
                    </div>
                  )}
                  {pattern.evidence && Object.keys(pattern.evidence).length > 0 && (
                    <div style={{
                      marginTop: 'var(--space-sm)', padding: 'var(--space-sm)',
                      background: 'var(--surface-soft)', borderRadius: 'var(--radius-sm)',
                      fontSize: 12, color: 'var(--muted)',
                    }}>
                      <strong>Evidence:</strong>{' '}
                      {Object.entries(pattern.evidence).map(([k, v]) => (
                        <span key={k} style={{ marginRight: 12 }}>
                          {k.replace(/([A-Z])/g, ' $1').trim()}: <strong>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="empty-state" style={{ padding: 'var(--space-xxl)' }}>
              <AlertTriangle size={40} color="var(--muted-soft)" />
              <h3 className="title-md" style={{ marginTop: 'var(--space-md)' }}>No patterns match your filters</h3>
              <p className="body-sm">Try adjusting your severity or type filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
