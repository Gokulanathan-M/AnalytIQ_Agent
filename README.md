# AnalytIQ — Autonomous Data Analyst

A full-stack AI-powered data analyst application built with **FastAPI + LangGraph** (backend) and **React + Vite** (frontend).

## 📁 Project Structure

```
TEAM-PROJECT/
├── backend/          ← FastAPI + LangGraph backend
│   ├── main.py       ← App entry point (uvicorn)
│   ├── requirements.txt
│   ├── .env          ← GEMINI_API_KEY goes here
│   ├── src/
│   │   ├── agents/   ← 7 AI agents (loader, cleaner, analyzer, visualizer, insights, chat, reporter)
│   │   ├── api/      ← FastAPI routes
│   │   └── core/     ← State, orchestrator, config
│   └── data/         ← Uploads & generated reports
│
└── frontend/         ← React + Vite frontend
    ├── src/
    │   ├── api/client.js      ← Axios API layer
    │   └── components/        ← All UI components
    └── dist/                  ← Production build output
```

## 🚀 Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
# Add GEMINI_API_KEY to .env
uvicorn main:app --reload
# API docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/upload` | Upload CSV/XLSX dataset |
| `POST` | `/api/v1/analyze` | Run full AI pipeline |
| `POST` | `/api/v1/chat` | Chat with your data |
| `GET`  | `/api/v1/charts/{session_id}/{chart_name}` | Get Base64 chart |
| `GET`  | `/api/v1/report/{session_id}` | Download PDF report |
| `GET`  | `/api/v1/sessions` | List active sessions |

## ✨ Features

- **7-Agent AI Pipeline**: Planner → Loader → Cleaner → Analyzer → Visualizer → Insights → Reporter
- **Auto-Clean**: Missing values, type inference, outlier detection
- **Smart Charts**: Correlation heatmaps, distributions, box plots, categorical bars
- **AI Insights**: Gemini-powered natural language insights and recommendations
- **PDF Reports**: Professional multi-section PDF report via ReportLab
- **Data Chat**: Natural language Q&A about your dataset

## 🛠 Tech Stack

**Backend**: Python, FastAPI, LangGraph, LangChain, Google Gemini, Pandas, Matplotlib, Seaborn, ReportLab  
**Frontend**: React 18, Vite, Axios, react-dropzone, react-markdown, Vanilla CSS
