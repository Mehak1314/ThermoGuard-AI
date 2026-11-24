# 🌡️ Server CPU Temperature Prediction — Full-Stack ML Application

A production-grade end-to-end machine learning web application that predicts server CPU temperature from hardware telemetry using **Linear Regression, Decision Tree, and Random Forest** regressors.

---

## 📋 Project Overview

| Item | Detail |
|---|---|
| **Task** | Regression — Predict CPU Core Temperature (°C) |
| **Dataset** | `server_cpu_dataset_nonlinear_6000_v2.csv` · 6,000 records |
| **Best Model** | Random Forest · R²=0.9633 · RMSE=11.46°C · MAPE=11.6% |
| **Frontend** | React 18 + Vite + Tailwind CSS + Recharts |
| **Backend** | FastAPI + Uvicorn + Pydantic |
| **ML Stack** | Scikit-learn + Pandas + NumPy + Joblib |

---

## 📁 Project Structure

```
server-cpu-prediction/
├── backend/
│   ├── main.py           # FastAPI application (all API endpoints)
│   ├── train.py          # Reproducible training script
│   ├── model_loader.py   # Model/scaler loading singleton
│   ├── schemas.py        # Pydantic request/response models
│   ├── requirements.txt  # Python dependencies
│   └── models/           # Saved model artifacts (after training)
│       ├── rf_model.pkl
│       ├── dt_model.pkl
│       ├── lr_model.pkl
│       ├── scaler.pkl
│       └── metadata.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Overview.jsx           # Dashboard with charts & stats
│   │   │   ├── DatasetExplorer.jsx    # Paginated table, distributions
│   │   │   ├── ModelPerformance.jsx   # Metrics, A vs P, residuals
│   │   │   ├── TemperaturePrediction.jsx # Prediction form + result
│   │   │   └── AboutProject.jsx       # Project documentation
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Topbar.jsx
│   │   ├── services/api.js            # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js                 # Proxy /api → localhost:8000
│   ├── tailwind.config.js
│   └── index.html
│
├── data/
│   └── server_cpu_dataset_nonlinear_6000_v2.csv
│
├── notebooks/
│   └── Final_Project_Improved3.ipynb  # Original ML notebook (preserved)
│
└── README.md
```

---

## ⚙️ ML Pipeline (from Original Notebook)

The training script faithfully reproduces the notebook methodology:

1. **Load dataset** (6,000 records, 7 columns)
2. **Imputation** — fill missing values with column means (0 missing in dataset)
3. **Feature Engineering**
   - `Power_Load = Voltage × Current`
   - `Workload = CPU_Utilization × Memory_Usage`
4. **IQR Outlier Filtering** — removes ~42 extreme rows (0.7%)
5. **Train-Test Split** — 70%/30%, `random_state=42`
6. **StandardScaler** — fitted on training data only (no data leakage)
7. **Model Training** with 5-fold cross-validation
8. **Evaluation** — R², RMSE, MSE, MAPE
9. **Joblib serialization** of models + scaler + metadata

### Models

| Model | Test R² | RMSE (°C) | MAPE | CV R² |
|---|---|---|---|---|
| Linear Regression | 0.6824 | 33.71 | 38.3% | 0.6918 |
| Decision Tree (Shallow) | 0.8335 | 24.40 | 25.8% | 0.8368 |
| **Random Forest** ✅ | **0.9633** | **11.46** | **11.6%** | **0.9608** |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+ 
- Node.js 18+ and pnpm (or npm)

---

### Step 1 — Install Python Dependencies

```bash
cd server-cpu-prediction/backend
pip install -r requirements.txt
```

---

### Step 2 — Train the ML Models

```bash
cd server-cpu-prediction/backend
python train.py
```

Expected output:
```
Dataset loaded: 5958 rows × 9 columns
Training: Random Forest …
  Test R²=0.9633  RMSE=11.46°C  MAPE=11.6%
ALL MODELS TRAINED AND SAVED SUCCESSFULLY
```

---

### Step 3 — Start the FastAPI Backend

```bash
cd server-cpu-prediction/backend
uvicorn main:app --reload --port 8000
```

API will be live at: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

---

### Step 4 — Install Frontend Dependencies

```bash
cd server-cpu-prediction/frontend
npm install
```

---

### Step 5 — Start the React Frontend

```bash
cd server-cpu-prediction/frontend
npm run dev
```

Frontend will be live at: `http://localhost:5173`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend & model status |
| `GET` | `/api/metrics` | Dataset stats + model evaluation metrics |
| `GET` | `/api/models` | Available trained models |
| `POST` | `/api/predict` | Predict CPU temperature |
| `GET` | `/api/dataset` | Paginated dataset records |
| `GET` | `/api/dataset/stats` | Charts data (distributions, correlations) |

### Example Prediction Request

```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "cpu_utilization": 75.0,
    "memory_usage": 60.0,
    "clock_speed": 3.0,
    "ambient_temperature": 28.0,
    "voltage": 1.2,
    "current": 25.0,
    "model_name": "Random Forest"
  }'
```

---

## 🎨 Application Pages

| Page | Description |
|---|---|
| **Overview** | Key stats, temperature distribution, feature importance, scatter plots |
| **Dataset Explorer** | Paginated table, feature distributions, correlation matrix, descriptive stats |
| **Model Performance** | Actual vs Predicted, residual analysis, R² comparison, overfitting diagnostic |
| **Temperature Prediction** | Interactive sliders, model selector, thermal gauge, status indicator |
| **About Project** | Problem statement, dataset, preprocessing, algorithms, architecture |

---

## 🏗️ Feature Engineering

| Feature | Formula | Importance (RF) |
|---|---|---|
| CPU_Utilization | Raw | 56.83% |
| Ambient_Temperature | Raw | 21.85% |
| **Workload** | CPU_Util × Memory_Usage | **15.38%** |
| Memory_Usage | Raw | 3.55% |
| Power_Load | Voltage × Current | 0.61% |
| Voltage | Raw | 0.61% |
| Clock_Speed | Raw | 0.59% |
| Current | Raw | 0.58% |

---

## ⚠️ Important Notes

- **Synthetic Dataset**: Temperatures can exceed physical CPU T_j Max (~105°C) as the dataset was generated using non-linear mathematical functions
- **Prediction Disclaimer**: ML estimates shown are not hardware safety guarantees
- **Data Leakage Prevention**: StandardScaler is fitted only on training data
- **Original Notebook**: `notebooks/Final_Project_Improved3.ipynb` is preserved unmodified

---

## 📄 License

This project is for academic and educational purposes.
