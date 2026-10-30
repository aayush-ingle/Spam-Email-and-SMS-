"""FastAPI endpoints that serve the existing trained spam model."""

from functools import lru_cache
import os
from pathlib import Path
from typing import Any, Literal

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


PROJECT_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(
    os.environ.get(
        "SPAM_MODEL_PATH", str(PROJECT_DIR / "models" / "spam_model.pkl")
    )
)


@lru_cache(maxsize=1)
def load_artifact() -> dict[str, Any]:
    """Load the model artifact once for the lifetime of this API process."""
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    try:
        artifact = joblib.load(MODEL_PATH)
    except Exception as error:
        raise ValueError(f"Could not load model file: {error}") from error
    if not isinstance(artifact, dict) or "pipeline" not in artifact:
        raise ValueError("The model file has an unsupported format.")
    return artifact


class PredictionRequest(BaseModel):
    message: str = Field(min_length=1, max_length=20_000)
    message_type: Literal["email", "sms"]


app = FastAPI(
    title="SpamShield AI API",
    description="Health, prediction, and evaluation endpoints for the trained NLP model.",
    version="1.0.0",
)

allowed_origins = [
    origin.strip()
    for origin in os.environ.get(
        "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def get_health() -> dict[str, Any]:
    """Report API availability separately from trained-model availability."""
    try:
        artifact = load_artifact()
    except (FileNotFoundError, OSError, ValueError, EOFError) as error:
        return {
            "status": "ok",
            "model_ready": False,
            "model_name": None,
            "message": str(error),
        }
    return {
        "status": "ok",
        "model_ready": True,
        "model_name": artifact.get("model_name", "Trained NLP classifier"),
    }


@app.post("/api/predict")
def predict_message(request: PredictionRequest) -> dict[str, Any]:
    """Classify a message using the saved TF-IDF and Naive Bayes pipeline."""
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Enter a message to analyze.")

    try:
        artifact = load_artifact()
    except (FileNotFoundError, OSError, ValueError, EOFError) as error:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {error}") from error

    pipeline = artifact["pipeline"]
    classes = list(pipeline.classes_)
    if "spam" not in classes:
        raise HTTPException(status_code=503, detail="The trained model has no spam class.")

    try:
        prediction = str(pipeline.predict([message])[0])
        probabilities = pipeline.predict_proba([message])[0]
        spam_probability = float(probabilities[classes.index("spam")])
    except Exception as error:
        raise HTTPException(status_code=500, detail="The model could not analyze this message.") from error

    return {
        "prediction": prediction,
        "spam_probability": spam_probability,
        "message_type": request.message_type,
        "model_name": artifact.get("model_name", "Trained NLP classifier"),
        "disclaimer": "This is a model estimate, not a guarantee; verify suspicious messages independently.",
    }


@app.get("/api/metrics")
def get_metrics() -> dict[str, Any]:
    """Return metrics saved during training; never substitute made-up scores."""
    try:
        artifact = load_artifact()
    except (FileNotFoundError, OSError, ValueError, EOFError) as error:
        raise HTTPException(status_code=503, detail=f"Model metrics unavailable: {error}") from error

    metrics = artifact.get("metrics")
    if not metrics:
        raise HTTPException(status_code=404, detail="No evaluation metrics are stored in this model.")
    return {
        "metrics": metrics,
        "source_metrics": artifact.get("source_metrics", {}),
        "training_samples": artifact.get("training_samples", {}),
        "training_data": artifact.get("training_data", {}),
        "evaluation_note": artifact.get("evaluation_note", ""),
    }