from fastapi import APIRouter, HTTPException

from app.dto.api_response import ApiResponse
from app.schemas.ai_report import AiReportPatchBody
from app.services.parent_chat import approve_ai_report
from app.services.teacher_reports_service import (
    generate_draft_parent_report,
    get_pending_reports,
    get_report,
    patch_draft_report,
    students_for_dropdown,
)

router = APIRouter(prefix="/teacher", tags=["Teacher"])


@router.post("/student-record")
def create_student_record():
    pass


@router.get("/student-record/{student_id}")
def get_student_record(student_id: int):
    return ApiResponse(
        body={
            "student_id": student_id,
            "name": f"<Student ID> {student_id}",
        },
        message="success",
    )


@router.get("/students")
def list_students():
    """Students available for AI report generation."""
    return ApiResponse(body=students_for_dropdown(), message="success")


@router.post("/generate-report/{student_id}")
def generate_report(student_id: int):
    """
    Run the AI pipeline and save a parent report as **pending** until the teacher approves.
    Parents only see approved reports in chat / parent API.
    """
    try:
        report_id = generate_draft_parent_report(student_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Report generation failed: {e!s}",
        ) from e
    return ApiResponse(
        body={"report_id": report_id, "student_id": student_id},
        message="pending_review",
    )


@router.get("/ai-reports/pending")
def pending_ai_reports():
    return ApiResponse(body=get_pending_reports(), message="success")


@router.get("/ai-reports/{report_id}")
def get_ai_report(report_id: int):
    row = get_report(report_id)
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
    return ApiResponse(body=row, message="success")


@router.patch("/ai-reports/{report_id}")
def patch_ai_report(report_id: int, body: AiReportPatchBody):
    ok = patch_draft_report(
        report_id,
        summary=body.summary,
        strengths=body.strengths,
        support_areas=body.support_areas,
        recommendations=body.recommendations,
    )
    if not ok:
        raise HTTPException(
            status_code=400,
            detail="Report not found, already approved, or nothing to update",
        )
    return ApiResponse(body={"report_id": report_id}, message="updated")


@router.post("/approve-report/{report_id}")
def approve_report(report_id: int):
    """Publish report to parents (used by parent chat RAG / GET parent report)."""
    ok = approve_ai_report(report_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Report not found")
    return ApiResponse(body={"report_id": report_id}, message="approved")
