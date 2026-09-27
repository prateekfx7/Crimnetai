import { useState } from 'react';
import { uploadData, uploadText, analyzeCase } from '../api';
import { Upload, FileText, Phone, DollarSign, Eye, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function UploadPage({ caseId }) {
  const [activeTab, setActiveTab] = useState('fir');
  const [firText, setFirText] = useState('');
  const [file, setFile] = useState(null);
  const [sourceType, setSourceType] = useState('CDR');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleFIRUpload = async () => {
    if (!firText.trim()) return;
    setUploading(true);
    setError('');
    setResult(null);

    try {
      const res = await uploadText(caseId, firText, 'FIR');
      setResult(res.data);
      setFirText('');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceType', sourceType);
      const res = await uploadData(caseId, formData);
      setResult(res.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReanalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await analyzeCase(caseId);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!caseId) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📤</div>
        <h3 className="title-md">No Case Selected</h3>
        <p className="body-sm">Select a case to upload investigation data.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2>Data Ingestion</h2>
        <p className="page-subtitle">Upload FIR narratives, CDR records, and financial transaction data</p>
      </div>

      {/* Results / Errors */}
      {result && (
        <div className="card" style={{
          marginBottom: 'var(--space-lg)', background: '#f0fdf4',
          borderColor: 'var(--success)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <CheckCircle size={20} color="var(--success)" />
            <div>
              <div className="title-sm" style={{ color: 'var(--success)' }}>
                {result.message || 'Processing complete'}
              </div>
              {result.entitiesFound !== undefined && (
                <div className="caption">
                  Entities found: {result.entitiesFound} · Relationships created: {result.relationshipsCreated}
                </div>
              )}
              {result.metricsComputed !== undefined && (
                <div className="caption">
                  Metrics computed for {result.metricsComputed} nodes · Patterns detected: {result.patternsDetected}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card" style={{
          marginBottom: 'var(--space-lg)', background: '#fef2f2',
          borderColor: 'var(--error)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <AlertCircle size={20} color="var(--error)" />
            <div className="title-sm" style={{ color: 'var(--error)' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'fir' ? 'active' : ''}`} onClick={() => setActiveTab('fir')}>
          <FileText size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          FIR / Text Report
        </button>
        <button className={`tab ${activeTab === 'csv' ? 'active' : ''}`} onClick={() => setActiveTab('csv')}>
          <Upload size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          CSV Upload (CDR / Financial)
        </button>
        <button className={`tab ${activeTab === 'analyze' ? 'active' : ''}`} onClick={() => setActiveTab('analyze')}>
          <RefreshCw size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Re-Analyze
        </button>
      </div>

      {/* FIR Text Upload */}
      {activeTab === 'fir' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Upload FIR Narrative or Surveillance Report</div>
              <div className="card-subtitle">
                Paste unstructured text — the NLP engine will extract persons, phone numbers, locations, vehicles, and organizations.
              </div>
            </div>
          </div>
          <div className="input-group">
            <textarea
              className="input textarea"
              rows={12}
              placeholder="Paste FIR narrative, surveillance report, or intelligence notes here...&#10;&#10;Example: On 15th March 2024, officers raided a warehouse in Andheri East. The accused Rajesh Kumar (phone: 9876543210) was apprehended..."
              value={firText}
              onChange={(e) => setFirText(e.target.value)}
              style={{ minHeight: 250, lineHeight: 1.6 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
            <button
              className="btn btn-primary"
              onClick={handleFIRUpload}
              disabled={!firText.trim() || uploading}
            >
              {uploading ? 'Processing...' : 'Extract Entities & Build Graph'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setFirText('')}
              disabled={!firText}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* CSV Upload */}
      {activeTab === 'csv' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Upload Structured Data (CSV)</div>
              <div className="card-subtitle">
                Upload CDR (call detail records) or financial transaction CSV files.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
            <div
              className="card"
              style={{
                flex: 1, textAlign: 'center', cursor: 'pointer',
                borderColor: sourceType === 'CDR' ? 'var(--ink)' : 'var(--hairline)',
                borderWidth: sourceType === 'CDR' ? 2 : 1,
                background: sourceType === 'CDR' ? 'var(--surface-soft)' : 'white',
              }}
              onClick={() => setSourceType('CDR')}
            >
              <Phone size={24} color={sourceType === 'CDR' ? 'var(--ink)' : 'var(--muted)'} style={{ margin: '0 auto var(--space-sm)' }} />
              <div className="title-sm">CDR Data</div>
              <div className="caption" style={{ marginTop: 4 }}>
                Columns: caller, callee, timestamp, duration, tower_id
              </div>
            </div>

            <div
              className="card"
              style={{
                flex: 1, textAlign: 'center', cursor: 'pointer',
                borderColor: sourceType === 'FINANCIAL' ? 'var(--ink)' : 'var(--hairline)',
                borderWidth: sourceType === 'FINANCIAL' ? 2 : 1,
                background: sourceType === 'FINANCIAL' ? 'var(--surface-soft)' : 'white',
              }}
              onClick={() => setSourceType('FINANCIAL')}
            >
              <DollarSign size={24} color={sourceType === 'FINANCIAL' ? 'var(--ink)' : 'var(--muted)'} style={{ margin: '0 auto var(--space-sm)' }} />
              <div className="title-sm">Financial Data</div>
              <div className="caption" style={{ marginTop: 4 }}>
                Columns: sender_account, receiver_account, sender_name, receiver_name, amount, timestamp
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Select CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="input"
              style={{ padding: '10px 16px' }}
            />
          </div>

          {file && (
            <div className="caption" style={{ marginTop: 'var(--space-sm)' }}>
              Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ marginTop: 'var(--space-md)' }}
            onClick={handleFileUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Processing...' : `Upload ${sourceType} Data`}
          </button>
        </div>
      )}

      {/* Re-analyze */}
      {activeTab === 'analyze' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Re-Run Analysis</div>
              <div className="card-subtitle">
                Recompute centrality metrics (degree, betweenness, PageRank) and re-run suspicious pattern detection on all case data.
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleReanalyze}
            disabled={analyzing}
            style={{ marginTop: 'var(--space-sm)' }}
          >
            <RefreshCw size={16} className={analyzing ? 'spin' : ''} />
            {analyzing ? 'Analyzing...' : 'Re-Analyze Case Data'}
          </button>
        </div>
      )}
    </div>
  );
}
