import React, { useState } from 'react';
import api from '../api/client';
import './ReportDownload.css';

export default function ReportDownload({ sessionId, reportPath }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadedCsv, setDownloadedCsv] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadedExcel, setDownloadedExcel] = useState(false);

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

  const handleDatasetDownload = async (format) => {
    if (format === 'csv') {
      setDownloadingCsv(true);
    } else {
      setDownloadingExcel(true);
    }

    try {
      const response = await api.get(`/download-cleaned/${sessionId}`, {
        params: { format },
        responseType: 'blob',
      });

      const blobType = format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const blob = new Blob([response.data], { type: blobType });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      
      const fileExt = format === 'csv' ? 'csv' : 'xlsx';
      a.download = `AnalytIQ_Cleaned_${sessionId}.${fileExt}`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => window.URL.revokeObjectURL(url), 3000);

      if (format === 'csv') {
        setDownloadedCsv(true);
      } else {
        setDownloadedExcel(true);
      }
    } catch (error) {
      console.error(`Download of ${format} failed:`, error);
    } finally {
      if (format === 'csv') {
        setDownloadingCsv(false);
      } else {
        setDownloadingExcel(false);
      }
    }
  };

  return (
    <div className="report-section fade-in">
      <div className="section-title">
        <span className="icon">📥</span>
        Export & Downloads
      </div>

      <div className="report-cards-container">
        {/* PDF REPORT CARD */}
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

        {/* CLEANED DATASET CARD */}
        <div className="report-card glass-card">
          <div className="report-icon-wrap">
            <div className={`report-pdf-icon ${downloadedCsv || downloadedExcel ? 'report-pdf-icon--done' : ''}`}>
              {downloadedCsv || downloadedExcel ? '✅' : '🧹'}
            </div>
          </div>

          <div className="report-info">
            <h3 className="report-title">Cleaned Dataset</h3>
            <p className="report-desc">
              Download the fully cleaned and processed version of your dataset. All missing values,
              data types, duplicates, and outliers have been systematically resolved.
            </p>
          </div>

          <div className="report-actions">
            <button
              className={`btn ${downloadedCsv ? 'btn-success' : 'btn-primary'} download-btn`}
              onClick={() => handleDatasetDownload('csv')}
              disabled={downloadingCsv || downloadingExcel || !sessionId}
            >
              {downloadingCsv ? (
                <><div className="spinner" /> Preparing CSV…</>
              ) : downloadedCsv ? (
                <><span>✓</span> CSV Downloaded!</>
              ) : (
                <><span>⬇</span> Download CSV</>
              )}
            </button>

            <button
              className={`btn ${downloadedExcel ? 'btn-success' : 'btn-primary'} download-btn`}
              onClick={() => handleDatasetDownload('excel')}
              disabled={downloadingCsv || downloadingExcel || !sessionId}
              style={{ marginTop: '4px' }}
            >
              {downloadingExcel ? (
                <><div className="spinner" /> Preparing Excel…</>
              ) : downloadedExcel ? (
                <><span>✓</span> Excel Downloaded!</>
              ) : (
                <><span>⬇</span> Download Excel</>
              )}
            </button>

            <div className="report-meta" style={{ marginTop: '6px' }}>
              <span className="badge badge-green">Cleaned Data</span>
              <span className="badge badge-yellow">CSV & XLSX</span>
            </div>
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

