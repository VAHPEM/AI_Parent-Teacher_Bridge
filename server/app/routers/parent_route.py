from fastapi import APIRouter

router = APIRouter(prefix="/parent", tags=["Parent"])

@router.get("/report/{student_id}")
def get_report(student_id: int):
    pass

@router.get("/activities/{student_id}")
def get_activities(student_id: int):
    pass

@router.post("/chat/{student_id}")
def parent_chat(student_id: int):
    pass