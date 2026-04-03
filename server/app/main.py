from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import teacher_route, parent_route

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


@app.get("/")
def root():
    return {"message": "EduX FastAPI backend is running"}