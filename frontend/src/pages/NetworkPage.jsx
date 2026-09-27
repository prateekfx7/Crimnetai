import { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getNetwork } from '../api';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

const NODE_COLORS = {
  PERSON: '#1d4ed8',
  PHONE_NUMBER: '#15803d',
  LOCATION: '#e8b94a',
  ORGANIZATION: '#7e22ce',
  VEHICLE_NO: '#be123c',
  ACCOUNT: '#0369a1',
};

const EDGE_COLORS = {
  CALL: '#15803d',
  FINANCIAL: '#e8b94a',
  CO_OCCURRENCE: '#b8a4ed',
  LOCATION_SHARED: '#ffb084',
  ASSOCIATE: '#ff4d8b',
};

export default function NetworkPage({ caseId }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const activeCaseId = caseId || 'demo-case-001';

  useEffect(() => {
    setLoading(true);
    getNetwork(activeCaseId)
      .then(res => {
        const nodes = res.data?.nodes || [];
        const edges = res.data?.edges || res.data?.links || [];
        setGraphData({
          nodes: nodes.map(n => ({
            ...n,
            color: NODE_COLORS[n.type] || '#6a6a6a',
            size: Math.max(4, (n.influenceScore || 0) * 30 + 5),
          })),
          links: edges.map(e => ({
            ...e,
            color: EDGE_COLORS[e.type] || '#e5e5e5',
          })),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCaseId]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: Math.max(500, window.innerHeight - 200),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node || null);
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? 'pointer' : 'default';
    }
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 500);
      graphRef.current.zoom(3, 500);
    }
  }, []);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;
    const size = node.size || 5;

    // Glow effect for high-influence nodes
    if (node.influenceScore > 0.1) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
      ctx.fillStyle = `${node.color}22`;
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = isSelected ? '#ff4d8b' : (isHovered ? '#ff6b5a' : node.color);
    ctx.fill();

    // Border
    ctx.strokeStyle = isSelected ? '#ff4d8b' : (isHovered ? '#ff6b5a' : 'rgba(255,255,255,0.8)');
    ctx.lineWidth = isSelected ? 3 : (isHovered ? 2 : 1);
    ctx.stroke();

    // Flagged indicator
    if (node.flagged) {
      ctx.beginPath();
      ctx.arc(node.x + size * 0.7, node.y - size * 0.7, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }

    // Label
    if (globalScale > 1.2 || isSelected || isHovered || node.influenceScore > 0.05) {
      const label = node.label || '';
      const fontSize = Math.max(10 / globalScale, 3);
      ctx.font = `600 ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text background
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(
        node.x - textWidth / 2 - 2,
        node.y + size + 2,
        textWidth + 4,
        fontSize + 2
      );

      ctx.fillStyle = '#0a0a0a';
      ctx.fillText(label, node.x, node.y + size + 2 + fontSize / 2 + 1);
    }
  }, [selectedNode, hoveredNode]);

  const linkCanvasObject = useCallback((link, ctx) => {
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = link.color || '#e5e5e5';
    ctx.lineWidth = Math.min(Math.max(link.weight * 0.5, 0.5), 4);
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, []);

  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300);
  const handleFit = () => graphRef.current?.zoomToFit(400, 40);
  const handleReset = () => { setSelectedNode(null); graphRef.current?.zoomToFit(400, 40); };

  if (!caseId) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🕸️</div>
        <h3 className="title-md">No Case Selected</h3>
        <p className="body-sm">Select a case to view its network graph.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Building network graph...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2>Criminal Network Graph</h2>
        <p className="page-subtitle">
          Interactive visualization — {graphData.nodes.length} entities, {graphData.links.length} relationships
        </p>
      </div>

      <div className="graph-container" ref={containerRef} style={{ height: dimensions.height }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={nodeCanvasObject}
          linkCanvasObject={linkCanvasObject}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          nodeRelSize={5}
          linkDirectionalParticles={1}
          linkDirectionalParticleWidth={2}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          warmupTicks={50}
          cooldownTicks={100}
          backgroundColor="white"
          enableNodeDrag={true}
        />

        {/* Controls */}
        <div className="graph-controls">
          <button className="graph-control-btn" onClick={handleZoomIn} title="Zoom In"><ZoomIn size={16} /></button>
          <button className="graph-control-btn" onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={16} /></button>
          <button className="graph-control-btn" onClick={handleFit} title="Fit to View"><Maximize2 size={16} /></button>
          <button className="graph-control-btn" onClick={handleReset} title="Reset"><RotateCcw size={16} /></button>
        </div>

        {/* Legend */}
        <div className="graph-legend">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: color }} />
              {type.replace('_', ' ')}
            </div>
          ))}
        </div>

        {/* Node tooltip / detail panel */}
        {selectedNode && (
          <div style={{
            position: 'absolute', top: 16, left: 16,
            background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--hairline)', borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)', maxWidth: 320, zIndex: 20,
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div className="title-sm" style={{ marginBottom: 8 }}>{selectedNode.label}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className={`badge badge-${selectedNode.type.toLowerCase().replace('_', '')}`}>
                {selectedNode.type.replace('_', ' ')}
              </span>
              {selectedNode.flagged && <span className="badge badge-critical">Flagged</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="caption">
                <strong>Influence Score:</strong> {((selectedNode.influenceScore || 0) * 100).toFixed(1)}%
              </div>
              <div className="caption">
                <strong>Degree Centrality:</strong> {((selectedNode.degreeCentrality || 0) * 100).toFixed(1)}%
              </div>
              <div className="caption">
                <strong>Betweenness:</strong> {((selectedNode.betweennessCentrality || 0) * 100).toFixed(1)}%
              </div>
              <div className="caption">
                <strong>PageRank:</strong> {((selectedNode.pageRank || 0) * 100).toFixed(1)}%
              </div>
              {selectedNode.aliases?.length > 0 && (
                <div className="caption">
                  <strong>Aliases:</strong> {selectedNode.aliases.join(', ')}
                </div>
              )}
              <div className="caption">
                <strong>Confidence:</strong> {((selectedNode.confidence || 0) * 100).toFixed(0)}%
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 12, width: '100%' }}
              onClick={() => setSelectedNode(null)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
