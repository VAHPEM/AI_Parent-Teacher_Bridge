from report_service import generate_report_for_student
from db import get_all_student_ids
def main():
    print("🚀 Starting AI report generation...")

    student_ids = get_all_student_ids()

    if not student_ids:
        print("❌ No students found in database.")
        return

    for student_id in student_ids:
        print(f"\n📊 Generating report for student_id = {student_id}...")
        try:
            generate_report_for_student(student_id)
            print("✅ Done")
        except Exception as e:
            print(f"❌ Error for student {student_id}: {e}")

    print("\n🎉 All reports generated successfully!")

if __name__ == "__main__":
    main()