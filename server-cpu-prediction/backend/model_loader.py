"""
model_loader.py — Loads trained models and metadata at startup
"""

import json
import pathlib
import joblib
import numpy as np
import pandas as pd

BASE_DIR = pathlib.Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"

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

MODEL_FILE_MAP = {
    "Random Forest": "rf_model.pkl",
    "Decision Tree (Shallow)": "dt_model.pkl",
    "Linear Regression": "lr_model.pkl",
}


class ModelLoader:
    def __init__(self):
        self.models = {}
        self.scaler = None
        self.metadata = {}
        self.loaded = False

    def load(self):
        """Load models, scaler, and metadata from disk."""
        meta_path = MODELS_DIR / "metadata.json"
        if not meta_path.exists():
            raise FileNotFoundError(
                "Models not found. Run 'python train.py' first."
            )

        with open(meta_path, "r") as f:
            self.metadata = json.load(f)

        self.scaler = joblib.load(MODELS_DIR / "scaler.pkl")

        for model_name, fname in MODEL_FILE_MAP.items():
            path = MODELS_DIR / fname
            if path.exists():
                self.models[model_name] = joblib.load(path)

        self.loaded = True
        return self

    def predict(self, cpu_utilization, memory_usage, clock_speed,
                ambient_temperature, voltage, current, model_name="Random Forest"):
        if not self.loaded:
            raise RuntimeError("Models not loaded. Call load() first.")

        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not available. Choose from: {list(self.models.keys())}")

        # Compute engineered features (same as training pipeline)
        power_load = voltage * current
        workload = cpu_utilization * memory_usage

        input_df = pd.DataFrame(
            [[cpu_utilization, memory_usage, clock_speed, ambient_temperature,
              voltage, current, power_load, workload]],
            columns=FEATURES,
        )

        input_scaled = self.scaler.transform(input_df)
        prediction = float(self.models[model_name].predict(input_scaled)[0])

        return prediction, power_load, workload

    def get_thermal_status(self, temperature: float):
        thresholds = self.metadata.get("thresholds", {"normal": 60.0, "warning": 80.0})
        if temperature < thresholds["normal"]:
            return "✅ NORMAL — Standard cooling profile active.", "normal"
        elif temperature < thresholds["warning"]:
            return "⚠️ WARNING — High load, fan speed ramping.", "warning"
        else:
            return "🔴 CRITICAL — Overheating risk! Thermal throttling recommended.", "critical"

    @property
    def available_models(self):
        return list(self.models.keys())


# Singleton instance
loader = ModelLoader()
