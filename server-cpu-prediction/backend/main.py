"""
main.py — FastAPI backend for Server CPU Temperature Prediction
"""

import pathlib
import json
import numpy as np
import pandas as pd
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from schemas import PredictionRequest, PredictionResponse
from model_loader import loader

DATA_PATH = pathlib.Path(__file__).parent.parent / "data" / "server_cpu_dataset_nonlinear_6000_v2.csv"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models on startup
    try:
        loader.load()
        print("✅ Models loaded successfully.")
    except FileNotFoundError as e:
        print(f"⚠️  {e}")
        print("    Run: cd backend && python train.py")
    yield


app = FastAPI(
    title="Server CPU Temperature Prediction API",
    description="ML-powered API for predicting server CPU temperature based on hardware telemetry.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "models_loaded": loader.loaded,
        "available_models": loader.available_models if loader.loaded else [],
    }


# ── Metrics ────────────────────────────────────────────────────────────────────
@app.get("/api/metrics")
def get_metrics():
    if not loader.loaded:
        raise HTTPException(status_code=503, detail="Models not loaded. Run train.py first.")
    return {
        "dataset_stats": loader.metadata["dataset_stats"],
        "model_metrics": loader.metadata["metrics"],
        "feature_importance": loader.metadata["feature_importance"],
        "actual_vs_predicted": loader.metadata["actual_vs_predicted"],
        "thresholds": loader.metadata["thresholds"],
    }


# ── Models list ────────────────────────────────────────────────────────────────
@app.get("/api/models")
def get_models():
    if not loader.loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")
    models_info = []
    for name in loader.available_models:
        m = loader.metadata["metrics"].get(name, {})
        models_info.append({
            "name": name,
            "r2": m.get("r2", 0),
            "rmse": m.get("rmse", 0),
            "mse": m.get("mse", 0),
            "mape": m.get("mape", 0),
            "cv_r2_mean": m.get("cv_r2_mean", 0),
            "cv_r2_std": m.get("cv_r2_std", 0),
            "train_r2": m.get("train_r2", 0),
            "test_r2": m.get("test_r2", 0),
        })
    return {"models": models_info}


# ── Predict ────────────────────────────────────────────────────────────────────
@app.post("/api/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    if not loader.loaded:
        raise HTTPException(status_code=503, detail="Models not loaded. Run train.py first.")

    model_name = request.model_name or "Random Forest"
    if model_name not in loader.available_models:
        raise HTTPException(
            status_code=400,
            detail=f"Model '{model_name}' not found. Available: {loader.available_models}",
        )

    try:
        pred_temp, power_load, workload = loader.predict(
            cpu_utilization=request.cpu_utilization,
            memory_usage=request.memory_usage,
            clock_speed=request.clock_speed,
            ambient_temperature=request.ambient_temperature,
            voltage=request.voltage,
            current=request.current,
            model_name=model_name,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    status_msg, status_level = loader.get_thermal_status(pred_temp)

    return PredictionResponse(
        predicted_temperature=round(pred_temp, 2),
        model_used=model_name,
        thermal_status=status_msg,
        thermal_level=status_level,
        power_load=round(power_load, 4),
        workload=round(workload, 4),
        disclaimer=(
            "This is a machine learning estimate based on training data. "
            "It does not replace hardware safety monitoring, BIOS thermal protection, "
            "or physical server diagnostics."
        ),
    )


# ── Dataset ────────────────────────────────────────────────────────────────────
@app.get("/api/dataset")
def get_dataset(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    search: Optional[str] = None,
):
    if not DATA_PATH.exists():
        raise HTTPException(status_code=404, detail="Dataset file not found.")

    df = pd.read_csv(DATA_PATH)
    total_records = len(df)

    # Simple search: filter rows where any numeric value matches the search string
    if search:
        try:
            val = float(search)
            mask = (df.round(1) == round(val, 1)).any(axis=1)
            df = df[mask]
        except ValueError:
            pass  # non-numeric search — return all

    total_filtered = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    page_data = df.iloc[start:end]

    records = page_data.round(4).to_dict(orient="records")

    return {
        "records": records,
        "total_records": total_records,
        "total_filtered": total_filtered,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total_filtered + page_size - 1) // page_size),
        "columns": list(df.columns),
    }


# ── Dataset stats (chart data) ─────────────────────────────────────────────────
@app.get("/api/dataset/stats")
def get_dataset_stats():
    if not DATA_PATH.exists():
        raise HTTPException(status_code=404, detail="Dataset file not found.")

    df = pd.read_csv(DATA_PATH)
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    # Temperature distribution (histogram bins)
    temp_hist, temp_bins = np.histogram(df["Temperature"], bins=30)
    temp_distribution = [
        {"bin": f"{temp_bins[i]:.0f}-{temp_bins[i+1]:.0f}", "count": int(temp_hist[i])}
        for i in range(len(temp_hist))
    ]

    # CPU Utilization vs Temperature scatter (sample 300)
    sample = df.sample(n=min(300, len(df)), random_state=42)
    cpu_vs_temp = [
        {"cpu": round(float(r["CPU_Utilization"]), 2), "temp": round(float(r["Temperature"]), 2)}
        for _, r in sample.iterrows()
    ]
    mem_vs_temp = [
        {"memory": round(float(r["Memory_Usage"]), 2), "temp": round(float(r["Temperature"]), 2)}
        for _, r in sample.iterrows()
    ]

    # Correlation matrix
    corr = df[numeric_cols].corr().round(3)
    correlation = corr.to_dict()

    # Descriptive stats
    desc = df.describe().round(4)
    desc_dict = {col: desc[col].to_dict() for col in desc.columns}

    return {
        "temperature_distribution": temp_distribution,
        "cpu_vs_temperature": cpu_vs_temp,
        "memory_vs_temperature": mem_vs_temp,
        "correlation": correlation,
        "descriptive_stats": desc_dict,
        "missing_values": df.isnull().sum().to_dict(),
        "columns": numeric_cols,
    }
