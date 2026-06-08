import React, { useState } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import AnalysisDashboard from './components/AnalysisDashboard';
import ChartGallery from './components/ChartGallery';
import InsightsPanel from './components/InsightsPanel';
import ChatPanel from './components/ChatPanel';
import ReportDownload from './components/ReportDownload';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);          // { sessionId, fileName }
  const [analysisResult, setAnalysisResult] = useState(null); // full /analyze response

  const handleUploadSuccess = ({ sessionId, fileName }) => {
    setSession({ sessionId, fileName });
    setAnalysisResult(null);
  };

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    // Scroll to charts after analysis
    setTimeout(() => {
      document.getElementById('charts-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  };

  const analyzed = !!analysisResult;

  return (
    <div className="app">
      <Header sessionId={session?.sessionId} analyzed={analyzed} />

      {/* ── Hero section ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge fade-in">
            <div className="pulse-dot blue" />
            <span>Powered by Google Gemini + LangGraph</span>
          </div>
          <h2 className="hero-headline fade-in-delay-1">
            Upload. Analyze. <span className="gradient-text">Understand.</span>
          </h2>
          <p className="hero-sub fade-in-delay-2">
            Drop any CSV or Excel dataset and our 7-agent AI pipeline will automatically clean,
            analyze, visualize, and generate a full professional report — in minutes.
          </p>

          {/* Feature pills */}
          <div className="feature-pills fade-in-delay-3">
            {['🧹 Auto-Clean', '📊 Smart Analysis', '📈 Auto Charts', '💡 AI Insights', '📄 PDF Report', '💬 Data Chat'].map(f => (
              <span key={f} className="feature-pill">{f}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="glow-line" />

      {/* ── Main content ── */}
      <main className="main-content">
        <div className="content-grid">

          {/* ═══ STEP 1: Upload ═══ */}
          <section className="step-section" id="upload-section">
            <div className="step-label">
              <span className="step-number">01</span>
              <div className="step-line" />
            </div>
            <div className="step-content">
              <UploadZone onUploadSuccess={handleUploadSuccess} />
            </div>
          </section>

          {/* ═══ STEP 2: Analyze ═══ */}
          {session && (
            <section className="step-section" id="analyze-section">
              <div className="step-label">
                <span className="step-number">02</span>
                <div className="step-line" />
              </div>
              <div className="step-content">
                <AnalysisDashboard
                  sessionId={session.sessionId}
                  fileName={session.fileName}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              </div>
            </section>
          )}

          {/* ═══ STEP 3: Charts ═══ */}
          {analyzed && analysisResult.chart_names?.length > 0 && (
            <section className="step-section" id="charts-section">
              <div className="step-label">
                <span className="step-number">03</span>
                <div className="step-line" />
              </div>
              <div className="step-content">
                <ChartGallery
                  sessionId={session.sessionId}
                  chartNames={analysisResult.chart_names}
                />
              </div>
            </section>
          )}

          {/* ═══ STEP 4: Insights ═══ */}
          {analyzed && (analysisResult.insights || analysisResult.recommendations?.length > 0) && (
            <section className="step-section" id="insights-section">
              <div className="step-label">
                <span className="step-number">04</span>
                <div className="step-line" />
              </div>
              <div className="step-content">
                <InsightsPanel
                  insights={analysisResult.insights}
                  recommendations={analysisResult.recommendations}
                  statistics={analysisResult.statistics}
                />
              </div>
            </section>
          )}

          {/* ═══ STEP 5: Chat ═══ */}
          {analyzed && (
            <section className="step-section" id="chat-section">
              <div className="step-label">
                <span className="step-number">05</span>
                <div className="step-line" />
              </div>
              <div className="step-content">
                <ChatPanel sessionId={session.sessionId} />
              </div>
            </section>
          )}

          {/* ═══ STEP 6: Report ═══ */}
          {analyzed && (
            <section className="step-section" id="report-section">
              <div className="step-label">
                <span className="step-number">06</span>
                <div className="step-line" style={{ display: 'none' }} />
              </div>
              <div className="step-content">
                <ReportDownload
                  sessionId={session.sessionId}
                  reportPath={analysisResult.report_path}
                />
              </div>
            </section>
          )}

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="glow-line" />
        <div className="footer-inner">
          <p className="footer-brand">
            <span className="gradient-text">AnalytIQ</span>
            <span className="footer-sep">—</span>
            Autonomous Data Analyst
          </p>
          <p className="footer-tech">
            FastAPI · LangGraph · Google Gemini · React · Vite
          </p>
        </div>
      </footer>
    </div>
  );
}
