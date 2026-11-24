"""
train.py — Reproducible training script
Replicates the exact methodology from Final_Project_Improved3.ipynb
"""

import os
import sys
import json
import pathlib
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_percentage_error

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = pathlib.Path(__file__).parent
DATA_PATH = BASE_DIR.parent / "data" / "server_cpu_dataset_nonlinear_6000_v2.csv"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)


def train_and_save():
    print("=" * 60)
    print("SERVER CPU TEMPERATURE PREDICTION — MODEL TRAINING")
    print("=" * 60)

    # ── Step 1: Load dataset ───────────────────────────────────────────────────
    if not DATA_PATH.exists():
        print(f"ERROR: Dataset not found at {DATA_PATH}")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    print(f"\nDataset loaded: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"Columns: {list(df.columns)}")

    # ── Step 2: Fill missing values ────────────────────────────────────────────
    df.fillna(df.mean(numeric_only=True), inplace=True)
    print(f"Missing values after imputation: {df.isnull().sum().sum()}")

    # ── Step 3: Feature engineering (matches notebook exactly) ────────────────
    df["Power_Load"] = df["Voltage"] * df["Current"]
    df["Workload"] = df["CPU_Utilization"] * df["Memory_Usage"]

    FEATURES = [
        "CPU_Utilization",
        "Memory_Usage",
        "Clock_Speed",
        "Ambient_Temperature",
        "Voltage",
        "Current",
        "Power_Load",
        "Workload",
    ]
    TARGET = "Temperature"

    # ── Step 4: IQR outlier filtering (matches notebook) ──────────────────────
    rows_before = len(df)
    for col in FEATURES:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        df = df[(df[col] >= lower) & (df[col] <= upper)]

    rows_after = len(df)
    print(f"\nIQR filtering: {rows_before} → {rows_after} rows ({rows_before - rows_after} removed)")

    X = df[FEATURES]
    y = df[TARGET]

    # Compute dataset stats BEFORE split
    dataset_stats = {
        "total_records": int(len(df)),
        "avg_temperature": float(y.mean()),
        "max_temperature": float(y.max()),
        "min_temperature": float(y.min()),
        "avg_cpu_utilization": float(df["CPU_Utilization"].mean()),
        "avg_memory_usage": float(df["Memory_Usage"].mean()),
        "missing_values": 0,
        "features_count": len(FEATURES),
        "feature_ranges": {
            col: {"min": float(df[col].min()), "max": float(df[col].max()),
                  "mean": float(df[col].mean()), "std": float(df[col].std())}
            for col in FEATURES + [TARGET]
        },
        "correlation_with_target": {
            col: float(df[col].corr(y)) for col in FEATURES
        },
    }

    # ── Step 5: Train-test split (70/30, random_state=42) ─────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )
    print(f"Train: {X_train.shape[0]} | Test: {X_test.shape[0]}")

    # ── Step 6: Feature scaling (fit on train only) ────────────────────────────
    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc = scaler.transform(X_test)

    # ── Step 7: Model definitions (matches notebook exactly) ──────────────────
    models_def = {
        "Linear Regression": LinearRegression(),
        "Decision Tree (Shallow)": DecisionTreeRegressor(
            max_depth=2, min_samples_split=80, min_samples_leaf=40, random_state=42
        ),
        "Random Forest": RandomForestRegressor(
            n_estimators=300, max_depth=8, min_samples_split=8,
            min_samples_leaf=4, max_features="sqrt", random_state=42
        ),
    }

    metrics_all = {}
    actual_vs_predicted = {}

    for name, model in models_def.items():
        print(f"\nTraining: {name} …")
        model.fit(X_train_sc, y_train)

        # Predictions
        train_pred = model.predict(X_train_sc)
        test_pred = model.predict(X_test_sc)

        # Metrics
        train_r2 = float(r2_score(y_train, train_pred))
        test_r2 = float(r2_score(y_test, test_pred))
        mse = float(mean_squared_error(y_test, test_pred))
        rmse = float(np.sqrt(mse))
        mape = float(mean_absolute_percentage_error(y_test, test_pred) * 100)

        # 5-fold CV on training data
        cv_scores = cross_val_score(model, X_train_sc, y_train, cv=5, scoring="r2")
        cv_mean = float(cv_scores.mean())
        cv_std = float(cv_scores.std())

        metrics_all[name] = {
            "r2": test_r2,
            "rmse": rmse,
            "mse": mse,
            "mape": mape,
            "cv_r2_mean": cv_mean,
            "cv_r2_std": cv_std,
            "train_r2": train_r2,
            "test_r2": test_r2,
        }

        # Store sample of actual vs predicted (up to 200 points for charts)
        indices = np.random.RandomState(42).choice(len(y_test), size=min(200, len(y_test)), replace=False)
        actual_vs_predicted[name] = {
            "actual": [float(v) for v in y_test.values[indices]],
            "predicted": [float(v) for v in test_pred[indices]],
            "residuals": [float(a - p) for a, p in zip(y_test.values[indices], test_pred[indices])],
        }

        print(f"  Test R²={test_r2:.4f}  RMSE={rmse:.2f}°C  MAPE={mape:.1f}%  CV R²={cv_mean:.4f}±{cv_std:.4f}")

    # Feature importance from Random Forest
    rf = models_def["Random Forest"]
    feature_importance = {
        feat: float(imp) for feat, imp in zip(FEATURES, rf.feature_importances_)
    }

    # ── Step 8: Save artifacts ─────────────────────────────────────────────────
    model_files = {
        "Random Forest": "rf_model.pkl",
        "Decision Tree (Shallow)": "dt_model.pkl",
        "Linear Regression": "lr_model.pkl",
    }

    for name, fname in model_files.items():
        joblib.dump(models_def[name], MODELS_DIR / fname)
        print(f"Saved: {fname}")

    joblib.dump(scaler, MODELS_DIR / "scaler.pkl")
    print("Saved: scaler.pkl")

    # Save metadata as JSON (used by the API)
    metadata = {
        "features": FEATURES,
        "target": TARGET,
        "dataset_stats": dataset_stats,
        "metrics": metrics_all,
        "actual_vs_predicted": actual_vs_predicted,
        "feature_importance": feature_importance,
        "model_files": model_files,
        "thresholds": {"normal": 60.0, "warning": 80.0},
    }

    with open(MODELS_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    print("Saved: metadata.json")

    print("\n" + "=" * 60)
    print("ALL MODELS TRAINED AND SAVED SUCCESSFULLY")
    print("=" * 60)
    return metadata


if __name__ == "__main__":
    train_and_save()
