from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.exceptions.app_exception import AppException
from app.exceptions.handlers import app_exception_handler
from app.routers import teacher_route, parent_route, student_route
import logging

logging.basicConfig(level=logging.INFO)
import app.models  # noqa: F401 — ensure all models are registered
from app.db.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EduX Backend MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for hackathon demo only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(teacher_route.router)
app.include_router(parent_route.router)
app.include_router(student_route.router)

app.add_exception_handler(AppException, app_exception_handler)

@app.get("/")
def root():
    return {"message": "EduX FastAPI backend is running"}