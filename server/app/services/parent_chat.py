def parent_chat_reply(student_id: int, message: str) -> str:
    from app.ai.parent_qa import answer_parent_question

    return answer_parent_question(student_id, message)


def get_latest_approved_report_for_parent(student_id: int):
    from app.ai.repository import fetch_latest_teacher_approved_report

    return fetch_latest_teacher_approved_report(student_id)


def approve_ai_report(report_id: int) -> bool:
    from app.ai.repository import set_report_teacher_approved

    return set_report_teacher_approved(
        report_id, sent_to_parent=True, status="approved"
    )
