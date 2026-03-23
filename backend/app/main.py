from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.models import User  # noqa: F401 - import for table creation
from app.auth.routes import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Recruitment AI API",
    description="AI-powered recruitment system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
