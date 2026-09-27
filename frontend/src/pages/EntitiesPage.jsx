import { useState, useEffect } from 'react';
import { getEntities } from '../api';
import { Search, Users, Phone, MapPin, Building, Car, CreditCard, ArrowUpDown } from 'lucide-react';

const TYPE_CONFIG = {
  PERSON: { icon: Users, badgeClass: 'badge-person', label: 'Person' },
  PHONE_NUMBER: { icon: Phone, badgeClass: 'badge-phone', label: 'Phone' },
  LOCATION: { icon: MapPin, badgeClass: 'badge-location', label: 'Location' },
  ORGANIZATION: { icon: Building, badgeClass: 'badge-org', label: 'Organization' },
  VEHICLE_NO: { icon: Car, badgeClass: 'badge-vehicle', label: 'Vehicle' },
  ACCOUNT: { icon: CreditCard, badgeClass: 'badge-account', label: 'Account' },
};

export default function EntitiesPage({ caseId }) {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('influenceScore');

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    const params = {};
    if (typeFilter !== 'ALL') params.type = typeFilter;
    if (search) params.search = search;

    getEntities(caseId, params)
      .then(res => setEntities(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [caseId, typeFilter, search]);

  const sortedEntities = [...entities].sort((a, b) => {
    if (sortBy === 'influenceScore') return (b.influenceScore || 0) - (a.influenceScore || 0);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'confidence') return (b.confidence || 0) - (a.confidence || 0);
    return 0;
  });

  if (!caseId) {
    return (
      <div className="empty-state">
        <div className="empty-icon">👤</div>
        <h3 className="title-md">No Case Selected</h3>
        <p className="body-sm">Select a case to view extracted entities.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2>Extracted Entities</h2>
        <p className="page-subtitle">{entities.length} entities identified in this case</p>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 250 }}>
          <span className="search-icon"><Search size={16} /></span>
          <input
            className="input"
            placeholder="Search entities by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40, width: '100%' }}
          />
        </div>
        <select
          className="input"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ width: 'auto', cursor: 'pointer' }}
        >
          <option value="influenceScore">Sort by Influence</option>
          <option value="name">Sort by Name</option>
          <option value="confidence">Sort by Confidence</option>
        </select>
      </div>

      {/* Type Filters */}
      <div className="filter-bar">
        <button
          className={`filter-chip ${typeFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setTypeFilter('ALL')}
        >
          All ({entities.length})
        </button>
        {Object.entries(TYPE_CONFIG).map(([type, config]) => {
          const count = entities.filter(e => e.type === type).length;
          if (count === 0 && typeFilter !== type) return null;
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
        <div className="loading-state"><div className="spinner" /><p>Loading entities...</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Entity Name</th>
                <th>Type</th>
                <th>Influence</th>
                <th>Degree</th>
                <th>Betweenness</th>
                <th>PageRank</th>
                <th>Confidence</th>
                <th>Aliases</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntities.map((entity, i) => {
                const config = TYPE_CONFIG[entity.type] || {};
                const Icon = config.icon || Users;
                return (
                  <tr key={entity._id || i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                        <Icon size={16} color="var(--muted)" />
                        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{entity.name}</span>
                        {entity.flagged && <span className="badge badge-critical" style={{ fontSize: 10 }}>Flagged</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${config.badgeClass || ''}`}>
                        {entity.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, (entity.influenceScore || 0) * 100)}%`,
                              background: entity.influenceScore > 0.1 ? 'var(--brand-coral)' : 'var(--brand-mint)',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 40 }}>
                          {((entity.influenceScore || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {((entity.degreeCentrality || 0) * 100).toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {((entity.betweennessCentrality || 0) * 100).toFixed(1)}%
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {((entity.pageRank || 0) * 100).toFixed(1)}%
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="progress-bar" style={{ width: 50 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(entity.confidence || 0) * 100}%`,
                              background: entity.confidence > 0.9 ? 'var(--success)' : 'var(--brand-ochre)',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {((entity.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted-soft)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {entity.aliases?.length > 0 ? entity.aliases.join(', ') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedEntities.length === 0 && (
            <div className="empty-state" style={{ padding: 'var(--space-xxl)' }}>
              <p>No entities found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
