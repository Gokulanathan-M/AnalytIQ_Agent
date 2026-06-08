import React, { useState } from 'react';
import { analyzeDataset } from '../api/client';
import './AnalysisDashboard.css';

const PIPELINE_STEPS = [
  { key: 'planner',     label: 'Planner',     icon: '🗺️',  desc: 'Orchestrating pipeline' },
  { key: 'loader',      label: 'Loader',       icon: '📂',  desc: 'Loading dataset' },
  { key: 'cleaner',     label: 'Cleaner',      icon: '🧹',  desc: 'Cleaning & validating' },
  { key: 'analyzer',    label: 'Analyzer',     icon: '📊',  desc: 'Statistical analysis' },
  { key: 'visualizer',  label: 'Visualizer',   icon: '📈',  desc: 'Generating charts' },
  { key: 'insight_gen', label: 'Insights',     icon: '💡',  desc: 'Extracting AI insights' },
  { key: 'report_gen',  label: 'Reporter',     icon: '📄',  desc: 'Building PDF report' },
];

export default function AnalysisDashboard({ sessionId, fileName, onAnalysisComplete }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(null);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  const handleAnalyze = async () => {
    setError('');
    setCompletedSteps([]);
    setActiveStep(null);
    setSummary(null);
    setAnalyzing(true);

    // Simulate step-by-step progress while waiting for the API
    let stepIndex = 0;
    const stepTimer = setInterval(() => {
      if (stepIndex < PIPELINE_STEPS.length) {
        setActiveStep(PIPELINE_STEPS[stepIndex].key);
        if (stepIndex > 0) {
          setCompletedSteps(prev => [...prev, PIPELINE_STEPS[stepIndex - 1].key]);
        }
        stepIndex++;
      }
    }, 2500);

    try {
      const res = await analyzeDataset(sessionId, prompt);
      clearInterval(stepTimer);
      // Mark all steps complete
      setCompletedSteps(PIPELINE_STEPS.map(s => s.key));
      setActiveStep(null);
      setSummary(res.data);
      onAnalysisComplete(res.data);
    } catch (err) {
      clearInterval(stepTimer);
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
      setActiveStep(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const getStepState = (key) => {
    if (completedSteps.includes(key)) return 'done';
    if (activeStep === key) return 'active';
    return 'pending';
  };

  return (
    <div className="dashboard-section fade-in-delay-1">
      <div className="section-title">
        <span className="icon">⚡</span>
        Run AI Analysis
      </div>

      {/* File badge */}
      <div className="file-badge">
        <span className="file-badge-icon">📁</span>
        <span className="file-badge-name">{fileName}</span>
        <span className="badge badge-blue">Ready</span>
      </div>

      {/* Optional prompt */}
      <div className="prompt-area">
        <label className="prompt-label">Custom Analysis Prompt (optional)</label>
        <textarea
          className="input"
          rows={2}
          placeholder="e.g. Focus on sales trends and regional performance..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={analyzing}
          id="analysis-prompt"
        />
      </div>

      {/* Trigger button */}
      <button
        className="btn btn-primary analyze-btn"
        onClick={handleAnalyze}
        disabled={analyzing || !sessionId}
        id="analyze-btn"
      >
        {analyzing ? (
          <><div className="spinner" /> Running Pipeline…</>
        ) : (
          <><span>🚀</span> Launch Analysis</>
        )}
      </button>

      {/* Pipeline stepper */}
      <div className="pipeline-stepper">
        {PIPELINE_STEPS.map((step, idx) => {
          const state = getStepState(step.key);
          return (
            <div key={step.key} className={`pipeline-step pipeline-step--${state}`}>
              <div className="step-connector" style={{ opacity: idx === 0 ? 0 : 1 }} />
              <div className="step-dot">
                {state === 'done' && <span className="step-check">✓</span>}
                {state === 'active' && <div className="spinner" style={{width:14,height:14,borderWidth:2}} />}
                {state === 'pending' && <span className="step-num">{idx + 1}</span>}
              </div>
              <div className="step-info">
                <span className="step-icon">{step.icon}</span>
                <div>
                  <p className="step-label">{step.label}</p>
                  <p className="step-desc">{step.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="summary-grid fade-in">
          <div className="summary-card">
            <p className="summary-value">{summary.statistics?.shape?.rows?.toLocaleString() ?? '—'}</p>
            <p className="summary-key">Rows</p>
          </div>
          <div className="summary-card">
            <p className="summary-value">{summary.statistics?.shape?.columns ?? '—'}</p>
            <p className="summary-key">Columns</p>
          </div>
          <div className="summary-card">
            <p className="summary-value">{summary.chart_names?.length ?? '—'}</p>
            <p className="summary-key">Charts</p>
          </div>
          <div className="summary-card">
            <p className="summary-value">{summary.recommendations?.length ?? '—'}</p>
            <p className="summary-key">Insights</p>
          </div>
        </div>
      )}

      {/* Cleaning log */}
      {summary?.cleaning_log?.length > 0 && (
        <details className="cleaning-log glass-card">
          <summary className="cleaning-log-header">
            🧹 Data Cleaning Log ({summary.cleaning_log.length} operations)
          </summary>
          <ul className="cleaning-log-list">
            {summary.cleaning_log.map((entry, i) => (
              <li key={i} className="cleaning-log-item">
                <span className="log-bullet">›</span> {entry}
              </li>
            ))}
          </ul>
        </details>
      )}

      {error && (
        <div className="upload-error fade-in">
          <span>⚠️</span> {error}
        </div>
      )}
    </div>
  );
}
