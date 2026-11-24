from pydantic import BaseModel, Field
from pydantic import ConfigDict
from typing import Optional


class PredictionRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    cpu_utilization: float = Field(..., ge=10.0, le=100.0, description="CPU Utilization (%)")
    memory_usage: float = Field(..., ge=20.0, le=95.0, description="Memory Usage (%)")
    clock_speed: float = Field(..., ge=1.5, le=4.0, description="Clock Speed (GHz)")
    ambient_temperature: float = Field(..., ge=15.0, le=40.0, description="Ambient Temperature (°C)")
    voltage: float = Field(..., ge=0.9, le=1.5, description="Core Voltage (V)")
    current: float = Field(..., ge=5.0, le=40.0, description="Current Draw (A)")
    model_name: Optional[str] = Field(default="Random Forest", description="Model to use for prediction")


class PredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    predicted_temperature: float
    model_used: str
    thermal_status: str
    thermal_level: str  # "normal" | "warning" | "critical"
    power_load: float
    workload: float
    disclaimer: str


class ModelMetrics(BaseModel):
    name: str
    r2: float
    rmse: float
    mse: float
    mape: float
    cv_r2_mean: float
    cv_r2_std: float
    train_r2: float
    test_r2: float


class DatasetStats(BaseModel):
    total_records: int
    avg_temperature: float
    max_temperature: float
    min_temperature: float
    avg_cpu_utilization: float
    avg_memory_usage: float
    missing_values: int
    features_count: int
