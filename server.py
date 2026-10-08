import warnings
warnings.filterwarnings('ignore')

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import os
import uvicorn

from model.feature_extractor import EmailClassifierService

app = FastAPI(
    title="AegisMail AI - Email Spam Classifier API",
    description="Sober & modern 3D AI Spam Classification Service",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Classifier (text-based TF-IDF + Logistic Regression)
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
classifier = EmailClassifierService(model_dir=MODEL_DIR)

class EmailRequest(BaseModel):
    subject: str = Field(default="", description="Subject line of email")
    body: str = Field(default="", description="Email body text")
    sender: str = Field(default="", description="Sender address")
    num_attachments: int = Field(default=0, ge=0)
    sender_reputation: Optional[float] = Field(default=None, ge=0.0, le=1.0)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AegisMail AI",
        "model_loaded": classifier.model is not None,
        "model_type": "TF-IDF + LogisticRegression (text-based)"
    }

@app.post("/api/predict")
def predict_email(payload: EmailRequest):
    try:
        result = classifier.predict(
            subject=payload.subject,
            body=payload.body,
            sender=payload.sender,
            num_attachments=payload.num_attachments
        )
        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount frontend directory for static serving
frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

if __name__ == "__main__":
    print("[INFO] Starting AegisMail server at http://localhost:8000")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
