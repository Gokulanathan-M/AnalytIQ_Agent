# AnalytIQ — Autonomous Data Analyst: Technical Documentation

AnalytIQ is a full-stack, autonomous, multi-agent AI data analyst application. It automates the end-to-end workflow of data analysis—from raw dataset loading and cleaning to statistical profiling, chart generation, AI-driven insights, conversational data querying, and final PDF report assembly.

This document provides a complete breakdown of the project's architecture, workflow, backend modules, AI agents, frontend components, and the underlying Gemini models.

---

## 🗺️ High-Level System Architecture

AnalytIQ is structured as a decoupled client-server application:

```
[React + Vite Client]  <-- HTTP API Calls -->  [FastAPI Backend]
         │                                            │
         ▼                                            ▼
┌──────────────────┐                           ┌──────────────┐
│  UploadZone      │                           │  FastAPI Router
├──────────────────┤                           ├──────────────┤
│  Dashboard       │                           │  LangGraph Orchestrator
├──────────────────┤                           │  (Planner, Loader, Cleaner,
│  ChartGallery    │                           │   Analyzer, Visualizer,
├──────────────────┤                           │   Insights, Reporter, Chat)
│  InsightsPanel   │                           └──────────────┘
├──────────────────┤                                  │
│  ChatPanel       │                                  ▼
├──────────────────┤                           ┌──────────────┐
│  ReportDownload  │                           │  Google Gemini API
└──────────────────┘                           └──────────────┘
```

---

## 🔄 Project Workflow (Execution Flow)

The application executes a state-driven pipeline coordinates via **LangGraph**. A shared state context (`AnalystState`) is passed between nodes, allowing agents to inspect, manipulate, or append analytical data.

### The Pipeline Steps (01 to 06)

1. **Upload Dataset (`01`)**: The user drops a CSV or Excel dataset. The file is uploaded to the backend and stored in `data/uploads`. A unique `session_id` is returned.
2. **Autonomous Analysis (`02`)**: The frontend initiates `/analyze`, triggering the LangGraph state machine.
   * **Planner**: Devises the pipeline plan (`loader` -> `cleaner` -> `analyzer` -> `visualizer` -> `insight_gen` -> `report_gen`).
   * **Loader**: Detects encoding and loads the dataset into a Pandas DataFrame.
   * **Cleaner**: Renames columns to `snake_case`, infers/coerces datatypes, handles missing values, removes duplicates, and clips outliers.
   * **Analyzer**: Conducts statistical tests (normality, correlations, distributions).
   * **Visualizer**: Generates charts (Matplotlib/Seaborn) and encodes them as Base64 strings.
   * **Insights**: Sends statistical summaries to Gemini to write natural language analytical narratives.
   * **Reporter**: Compiles everything into a professional multi-section PDF report via ReportLab.
3. **Smart Charts (`03`)**: Base64 chart strings are returned and displayed in a premium interactive gallery.
4. **AI Insights (`04`)**: The Gemini-generated Executive Summary, Key Findings, Data Quality Notes, and Business Recommendations are displayed.
5. **Interactive Chat (`05`)**: The user can ask arbitrary natural language questions about their dataset. The chat agent generates Pandas code, runs it, and replies with formatted results.
6. **PDF Report Download (`06`)**: The user downloads the ReportLab-generated PDF report.

---

## 🤖 Backend Models & Configuration

All AI interactions leverage Google's Gemini models via LangChain's `ChatGoogleGenerativeAI` library.

### Models Used
* **`gemini-2.5-flash`**: The default model used for general tasks, analysis summary generation, and dataset chatting. It is fast, highly responsive, and cost-effective.
* **`gemini-2.5-pro`**: An optional, higher-capacity model configured via environment variables for complex reasoning tasks.
* **Pro-to-Flash Fallback**: To ensure reliability, the `llm_factory.py` configures a fallback chain. If `gemini-2.5-pro` encounters rate limits or service interruptions, it fallbacks to `gemini-2.5-flash`.

### Hyperparameter Settings
* **Dataset Chat Agent Temperature (`0.1`)**: Set low for structural tasks (translating text to Python/Pandas code) to ensure strict, deterministic, and syntax-accurate code output.
* **General LLM Temperature (`0.2` - `0.3`)**: Kept low for statistical analysis to prevent hallucinations and enforce factual adherence to the dataset. Set slightly higher (`0.3`) for insight generation to allow fluent business phrasing.

---

## 📁 Module-wise Codebase Walkthrough

### ⚙️ Core Configuration & State Management

#### 1. Configuration: `backend/src/core/config.py`
Uses `pydantic_settings` to read environments from `.env`.
* Configures `gemini_api_key` and `gemini_model`.
* Defines paths for uploads (`data/uploads`) and generated PDF reports (`data/reports`).

#### 2. Shared State: `backend/src/core/state.py`
Defines the `AnalystState` dictionary, tracking:
* `messages`: Full message history (annotated with `operator.add` to support incremental history appending).
* `dataset` / `raw_dataset`: Current working copy and original unmodified Pandas DataFrame.
* `metadata`: Data schema, snake_case mapping, shape, and null percentages.
* `cleaning_log`: List of cleaning operations performed.
* `statistics`: Value counts, descriptive metrics, Pearson correlations, normality tests.
* `visualizations`: Key-value store mapping chart names to Base64-encoded PNG strings.
* `insights` / `recommendations`: Markdown summary and list of business ideas.
* `report_path`: Absolute path to the generated PDF.
* `current_plan` / `next_agent`: Execution queue.
* `error_count` / `error_log`: Tracks pipeline execution safety.

#### 3. Orchestration Engine: `backend/src/core/orchestrator.py`
Compiles the LangGraph workflow structure:
* Entry point is the `planner`.
* Employs a conditional routing edge after the planner runs: if `state["next_agent"]` is a registered node, it routes there. If it's `"END"`, execution terminates.
* Non-terminal nodes return to the `planner` for routing after finishing. `report_gen` routes directly to `END` as it is the final node.

---

### 🕵️ Agent Nodes Detail (`backend/src/agents/`)

#### 1. Planner Agent: `planner.py`
A deterministic planner that prevents redundant LLM calls.
* First call: initializes the queue with `["loader", "cleaner", "analyzer", "visualizer", "insight_gen", "report_gen"]`.
* Subsequent calls: pops the next agent from `current_plan` and updates `next_agent`.
* Safety Guard: aborts pipeline if `error_count >= 3` to prevent infinite loops on failing tasks.

#### 2. Data Loader Agent: `loader.py`
Handles file reading:
* Uses `chardet` to detect character encoding of CSVs (falling back to `latin-1` if `utf-8` fails).
* Supports Excel files (`.xlsx`, `.xls`) via pandas.
* Downcasts numeric floats (`float64` to `float32`) and integers to reduce memory footprint.
* Compiles initial dataset metadata (shape, unique counts, null percentages, data types).

#### 3. Data Cleaner Agent: `cleaner.py`
Prepares the data:
* **Snake Case Standardisation**: Normalizes column names (removes punctuation, converts spaces/camelCase to `snake_case`). Maps original names to new ones in state.
* **Datetime Parser**: Automatically parses object columns with date/time keywords if $>50\%$ of values are parsable.
* **Numeric and Boolean Coercion**: Strips formatting symbols (e.g. `$`, `%`, `,`, currency symbols) and attempts numeric conversion. Coerces boolean strings (`yes`/`no`, `y`/`n`, `1`/`0`) to booleans.
* **Categorical Normalisation**: Title-cases strings to clean inconsistent text casing.
* **Null Imputation**: Numeric values get median values; categorical get modes (or `"Unknown"`).
* **Outliers Clipping**: Detects outliers using Interquartile Range ($IQR \times 3.0$) and clips them.
* Logs all transformations applied.

#### 4. Statistical Analyzer Agent: `analyzer.py`
Builds statistical profile:
* Generates count, mean, median, standard deviation, IQR, min/max, skewness, and kurtosis.
* Calculates a Pearson correlation matrix and pulls top-10 correlated column pairs.
* Checks normality using **Shapiro-Wilk** ($n \le 5000$) or **D'Agostino-Pearson** ($n > 5000$).
* Identifies skewed numeric columns ($|skewness| > 1$).

#### 5. Visualization Agent: `visualizer.py`
Generates high-quality charts using Matplotlib/Seaborn:
* Configures a clean theme (`whitegrid` style, `coolwarm` or `muted` palette).
* Generates:
  1. **Missing Heatmap**: Visualizes missing value rates.
  2. **Numeric Distributions**: Multi-grid histograms with KDE curves.
  3. **Correlation Heatmap**: Triangle-masked Pearson correlation matrix.
  4. **Box Plots**: Visualizes outliers and variable spreads.
  5. **Categorical Bar Charts**: Top-10 counts for high-cardinality categorical fields.
  6. **Top Correlations Bar Chart**: Shows positive vs negative correlation coefficients.
* Saves all charts directly to memory buffers as Base64 strings.

#### 6. Insight Generation Agent: `insights.py`
Gemini-powered business analyst:
* Packs a summarized JSON context of the stats (shape, column types, correlation highlights, outliers, skewness) to fit within context windows.
* Passes the context with a `SYSTEM_PROMPT` instructing Gemini to write a report containing:
  - **Executive Summary**
  - **Key Findings**
  - **Data Quality Notes**
  - **Business Recommendations**
* Fallback: provides a rule-based statistics summary if the LLM API fails.

#### 7. Report Generation Agent: `reporter.py`
Compiles everything into a multi-page PDF via **ReportLab**:
* Creates A4 sheets with customized colors (Navy headers `#1B2A4A`, Teal `#2E9E8E`, Soft Gray backings `#F4F6FB`).
* Sections built:
  1. **Cover Page**: Dark Navy banner with metadata.
  2. **Dataset Overview & Data Quality**: Table showing data shapes and missing value rates.
  3. **Cleaning Report**: Chronological bullet points of operations.
  4. **Statistical Analysis**: Custom formatted tables representing descriptive stats.
  5. **Visualizations**: Decodes and embeds the Base64 visualization charts.
  6. **Key Insights**: Formats markdown insights into ReportLab flowables.
  7. **Appendix**: Comprehensive layout of data types, counts, and sample values.
* Uses custom footers displaying the date and running page count.

#### 8. Dataset Chat Agent: `chat.py`
Translates natural language questions to code:
* Reads dataset properties, column schemas, and column mapping dictionaries.
* Prompts Gemini to write a single Python/Pandas snippet executing against variable `df` and storing the answer in `result`.
* Runs a **ReAct reflection loop**: if the code throws an execution error, the traceback is fed back to the LLM to fix its syntax. Runs up to 3 times.
* Implements safety guards blocking code with system imports (`os`, `sys`, `subprocess`, `open(`, `exec(`).
* Formats results (e.g. outputs DataFrames to Markdown tables, lists, text) and responds.

---

### 🌐 API Layer: `backend/src/api/routes.py`

FastAPI endpoints that drive the frontend interactions:

* `POST /api/v1/upload` - Upload file (accepts `.csv`, `.xlsx`, `.xls`). Creates a new analysis session.
* `POST /api/v1/analyze` - Triggers the full multi-agent state graph pipeline and saves state in memory.
* `POST /api/v1/chat` - Chats with the dataset by executing sandboxed Python code snippets.
* `GET /api/v1/report/{session_id}` - Downloads the generated PDF report.
* `GET /api/v1/download-cleaned/{session_id}` - Downloads the cleaned dataset in CSV/Excel formats.
* `GET /api/v1/charts/{session_id}/{chart_name}` - Gets Base64-encoded chart images.
* `GET /api/v1/sessions` - Lists all active analysis sessions.

---

## 🎨 Frontend Application Walkthrough

The frontend is a single-page application built with **React 18** and **Vite**, using **Vanilla CSS** for modern styling (featuring dark modes, glassmorphism card styling, interactive states, and progress meters).

### Component Tree
```
App.jsx (Main Orchestrator)
├── Header.jsx (Displays status indicators and session context)
├── UploadZone.jsx (Dropzone file upload with drag/drop states)
├── AnalysisDashboard.jsx (Runs prompt and streams pipeline steps progress)
├── ChartGallery.jsx (Visualizes the Base64 charts in a responsive layout)
├── InsightsPanel.jsx (Displays markdown narrative summaries & business ideas)
├── ChatPanel.jsx (Interactive chat widget for querying the data)
└── ReportDownload.jsx (Triggers export files and ReportLab PDF downloads)
```

### Dev Server Proxy Configuration: `frontend/vite.config.js`
To avoid CORS issues during local development, Vite is configured with a development proxy that forwards requests starting with `/api` to the FastAPI backend running on port `8000`:
```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

---

## 💡 Summary of Key Technical Highlights

1. **Self-Correction Code Loop**: The dataset chat node doesn't just crash on bad syntax; it catches Python tracebacks and asks Gemini to fix its own code recursively.
2. **Deterministic Orchestration**: Using a rule-based LangGraph Planner instead of a chat agent router makes the pipeline consistent, fast, and cost-effective.
3. **ReportLab Table Autoscaling**: The report generator handles varying numbers of columns by scaling headers, formatting values, and implementing word-wrap.
4. **Intelligent Cleaning**: The data cleaner strips trailing text/currency formatting before converting to numbers, ensuring files load cleanly without user intervention.
5. **Base64 Chart Transmission**: Generating graphs inside the FastAPI thread, encoding them to Base64, and sending them inside the JSON payload avoids writing temp image assets to disk.
