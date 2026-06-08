import React from 'react';
import ReactMarkdown from 'react-markdown';
import './InsightsPanel.css';

export default function InsightsPanel({ insights, recommendations, statistics }) {
  if (!insights && (!recommendations || recommendations.length === 0)) return null;

  const topCorrelations = statistics?.top_correlations || [];
  const skewedCols = statistics?.skewed_columns || [];

  return (
    <div className="insights-section fade-in-delay-3">
      <div className="section-title">
        <span className="icon">💡</span>
        AI Insights &amp; Recommendations
      </div>

      <div className="insights-layout">
        {/* Left — Insights markdown */}
        {insights && (
          <div className="insights-card glass-card">
            <div className="insights-card-header">
              <span>🧠</span> Analysis Insights
            </div>
            <div className="insights-body">
              <ReactMarkdown>{insights}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Right column */}
        <div className="insights-right">
          {/* Recommendations */}
          {recommendations?.length > 0 && (
            <div className="rec-card glass-card">
              <div className="rec-header">
                <span>✅</span> Recommendations
                <span className="badge badge-green">{recommendations.length}</span>
              </div>
              <ul className="rec-list">
                {recommendations.map((rec, i) => (
                  <li key={i} className="rec-item">
                    <div className="rec-num">{i + 1}</div>
                    <p>{rec}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top correlations */}
          {topCorrelations.length > 0 && (
            <div className="corr-card glass-card">
              <div className="rec-header">
                <span>🔗</span> Top Correlations
              </div>
              <div className="corr-list">
                {topCorrelations.slice(0, 5).map((c, i) => {
                  const strength = Math.abs(c.correlation);
                  const color = strength >= 0.7
                    ? 'var(--accent-green)'
                    : strength >= 0.4
                    ? 'var(--accent-orange)'
                    : 'var(--accent-blue)';
                  return (
                    <div key={i} className="corr-item">
                      <div className="corr-pair">
                        <span className="corr-col">{c.col_a}</span>
                        <span className="corr-arrow">↔</span>
                        <span className="corr-col">{c.col_b}</span>
                      </div>
                      <div className="corr-bar-wrap">
                        <div
                          className="corr-bar"
                          style={{
                            width: `${Math.abs(c.correlation) * 100}%`,
                            background: color,
                          }}
                        />
                        <span className="corr-val" style={{ color }}>
                          {c.correlation >= 0 ? '+' : ''}{c.correlation.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skewed columns */}
          {skewedCols.length > 0 && (
            <div className="skew-card glass-card">
              <div className="rec-header">
                <span>📐</span> Skewed Columns
                <span className="badge badge-orange">{skewedCols.length}</span>
              </div>
              <div className="skew-list">
                {skewedCols.map((col, i) => (
                  <span key={i} className="chip">{col}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
