import React, { useState } from 'react';
import { getChart } from '../api/client';
import './ChartGallery.css';

const CHART_LABELS = {
  missing_heatmap:       { label: 'Missing Value Rate',       icon: '🔍' },
  numeric_distributions: { label: 'Numeric Distributions',    icon: '📊' },
  correlation_heatmap:   { label: 'Correlation Heatmap',      icon: '🔥' },
  boxplots:              { label: 'Box Plots & Outliers',      icon: '📦' },
  top_correlations_bar:  { label: 'Top Feature Correlations', icon: '🔗' },
};

function getChartMeta(key) {
  if (CHART_LABELS[key]) return CHART_LABELS[key];
  if (key.startsWith('bar_')) {
    const col = key.slice(4).replace(/_/g, ' ');
    return { label: `Distribution — ${col}`, icon: '📋' };
  }
  return { label: key.replace(/_/g, ' '), icon: '📈' };
}

export default function ChartGallery({ sessionId, chartNames }) {
  const [loadedCharts, setLoadedCharts] = useState({});
  const [loading, setLoading] = useState({});
  const [modal, setModal] = useState(null); // chart name for full-screen

  const loadChart = async (name) => {
    if (loadedCharts[name] || loading[name]) return;
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      const res = await getChart(sessionId, name);
      setLoadedCharts(prev => ({ ...prev, [name]: res.data.image_base64 }));
    } catch {
      setLoadedCharts(prev => ({ ...prev, [name]: null }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  if (!chartNames || chartNames.length === 0) return null;

  return (
    <div className="chart-section fade-in-delay-2">
      <div className="section-title">
        <span className="icon">📈</span>
        Chart Gallery
        <span className="badge badge-blue">{chartNames.length} charts</span>
      </div>
      <p className="chart-description">
        Click any chart to load and view it. Click a loaded chart to open full-screen.
      </p>

      <div className="chart-grid">
        {chartNames.map((name) => {
          const meta = getChartMeta(name);
          const b64 = loadedCharts[name];
          const isLoading = loading[name];

          return (
            <div
              key={name}
              className={`chart-card glass-card ${b64 ? 'chart-card--loaded' : ''}`}
              onClick={() => b64 ? setModal(name) : loadChart(name)}
              id={`chart-${name}`}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && (b64 ? setModal(name) : loadChart(name))}
            >
              <div className="chart-card-header">
                <span className="chart-icon">{meta.icon}</span>
                <p className="chart-label">{meta.label}</p>
              </div>

              <div className="chart-preview">
                {isLoading && (
                  <div className="chart-placeholder">
                    <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                    <p>Loading chart…</p>
                  </div>
                )}
                {b64 && !isLoading && (
                  <img
                    src={`data:image/png;base64,${b64}`}
                    alt={meta.label}
                    className="chart-img"
                  />
                )}
                {!b64 && !isLoading && (
                  <div className="chart-placeholder chart-placeholder--clickable">
                    <span className="chart-load-icon">🖼️</span>
                    <p>Click to load</p>
                  </div>
                )}
              </div>

              {b64 && (
                <div className="chart-footer">
                  <span className="chart-zoom-hint">🔍 Click to zoom</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && loadedCharts[modal] && (
        <div
          className="chart-modal-overlay"
          onClick={() => setModal(null)}
          id="chart-modal"
        >
          <div className="chart-modal-content" onClick={e => e.stopPropagation()}>
            <div className="chart-modal-header">
              <p className="chart-modal-title">
                {getChartMeta(modal).icon} {getChartMeta(modal).label}
              </p>
              <button
                className="btn btn-ghost chart-modal-close"
                onClick={() => setModal(null)}
                id="chart-modal-close"
              >
                ✕ Close
              </button>
            </div>
            <img
              src={`data:image/png;base64,${loadedCharts[modal]}`}
              alt={modal}
              className="chart-modal-img"
            />
          </div>
        </div>
      )}
    </div>
  );
}
