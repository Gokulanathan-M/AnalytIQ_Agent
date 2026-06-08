import React, { useState } from 'react';
import api from '../api/client';
import './ReportDownload.css';

export default function ReportDownload({ sessionId, reportPath }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/report/${sessionId}`, {
        responseType: 'blob',
      });

      // Explicitly create blob with PDF MIME type
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `AnalytIQ_Report_${sessionId}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Delay revoke so the browser has time to start the download
      setTimeout(() => window.URL.revokeObjectURL(url), 3000);

      setDownloaded(true);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="report-section fade-in">
      <div className="section-title">
        <span className="icon">📄</span>
        Download Report
      </div>

      <div className="report-card glass-card">
        <div className="report-icon-wrap">
          <div className={`report-pdf-icon ${downloaded ? 'report-pdf-icon--done' : ''}`}>
            {downloaded ? '✅' : '📑'}
          </div>
        </div>

        <div className="report-info">
          <h3 className="report-title">Full Analysis Report</h3>
          <p className="report-desc">
            A professionally formatted PDF containing executive summary, dataset overview,
            cleaning report, statistical analysis, all charts, AI insights, and recommendations.
          </p>
          {reportPath && (
            <p className="report-path">
              <span className="report-path-label">Saved at: </span>
              <code>{reportPath}</code>
            </p>
          )}
        </div>

        <div className="report-actions">
          <button
            className={`btn ${downloaded ? 'btn-success' : 'btn-primary'} download-btn`}
            onClick={handleDownload}
            disabled={downloading || !sessionId}
            id="download-report-btn"
          >
            {downloading ? (
              <><div className="spinner" /> Preparing…</>
            ) : downloaded ? (
              <><span>✓</span> Downloaded!</>
            ) : (
              <><span>⬇</span> Download PDF</>
            )}
          </button>

          <div className="report-meta">
            <span className="badge badge-violet">PDF Report</span>
            <span className="badge badge-blue">Multi-page</span>
          </div>
        </div>
      </div>

      {/* Feature list */}
      <div className="report-features">
        {[
          { icon: '📋', label: 'Executive Summary' },
          { icon: '🧹', label: 'Cleaning Report' },
          { icon: '📊', label: 'Statistical Tables' },
          { icon: '📈', label: 'All Charts Embedded' },
          { icon: '💡', label: 'AI Insights' },
          { icon: '✅', label: 'Recommendations' },
        ].map((f, i) => (
          <div key={i} className="report-feature-chip">
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
