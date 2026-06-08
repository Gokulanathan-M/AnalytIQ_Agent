import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadDataset } from '../api/client';
import './UploadZone.css';

export default function UploadZone({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError('');
    setFileName(file.name);
    setUploading(true);
    setProgress(0);

    try {
      const res = await uploadDataset(file, setProgress);
      const { session_id, file_name } = res.data;
      onUploadSuccess({ sessionId: session_id, fileName: file_name });
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Check if the backend is running.');
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="upload-section fade-in">
      <div className="section-title">
        <span className="icon">📤</span>
        Upload Dataset
      </div>
      <p className="upload-description">
        Drop a <strong>CSV</strong> or <strong>Excel</strong> file to begin. The AI pipeline will automatically
        load, clean, analyze, visualize and generate a full report.
      </p>

      <div
        {...getRootProps()}
        className={`dropzone glass-card ${isDragActive ? 'dropzone--active' : ''} ${isDragReject ? 'dropzone--reject' : ''} ${uploading ? 'dropzone--uploading' : ''}`}
        id="file-dropzone"
      >
        <input {...getInputProps()} id="file-input" />

        <div className="dropzone-inner">
          {uploading ? (
            <div className="upload-progress-state">
              <div className="upload-icon uploading">
                <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              </div>
              <p className="upload-filename">{fileName}</p>
              <p className="upload-hint">Uploading… {progress}%</p>
              <div className="progress-bar" style={{ marginTop: 12, width: '100%', maxWidth: 320 }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : isDragActive ? (
            <div className="upload-progress-state">
              <div className="upload-icon active">📂</div>
              <p className="upload-hint">Release to upload!</p>
            </div>
          ) : (
            <div className="upload-idle-state">
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="23" stroke="url(#ug)" strokeWidth="1.5" strokeDasharray="4 3"/>
                  <path d="M24 32V20m0 0l-5 5m5-5l5 5" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="14" y="34" width="20" height="2.5" rx="1.25" fill="#3b82f6" opacity="0.4"/>
                  <defs>
                    <linearGradient id="ug" x1="0" y1="0" x2="48" y2="48">
                      <stop stopColor="#3b82f6"/>
                      <stop offset="1" stopColor="#8b5cf6"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <p className="upload-main-text">
                {isDragReject ? '⚠️ Only CSV / XLSX files are supported' : 'Drag & drop your dataset here'}
              </p>
              <p className="upload-hint">or click to browse — CSV, XLSX, XLS supported</p>
              <div className="upload-formats">
                <span className="chip">.csv</span>
                <span className="chip">.xlsx</span>
                <span className="chip">.xls</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="upload-error fade-in">
          <span>⚠️</span> {error}
        </div>
      )}
    </div>
  );
}
