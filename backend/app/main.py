from datetime import datetime
import io
import os

import pandas as pd

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File,
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from sqlalchemy import func
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Student, Attendance
from .schemas import (
    StudentCreate,
    StudentOut,
    AttendanceCreate,
    AttendanceOut,
)
from .face_service import FaceService
from .recognition_service import RecognitionService


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="SmartFace Attendance API",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# SERVICES
# =========================================================

face_service = FaceService()
recognition_service = RecognitionService()


# =========================================================
# FACE ENCODING DIRECTORY
# =========================================================

ENCODINGS_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "face_encodings",
    )
)

os.makedirs(
    ENCODINGS_DIR,
    exist_ok=True,
)


# =========================================================
# CLEAN OLD DUPLICATE ATTENDANCE
# =========================================================

def cleanup_duplicate_attendance():
    """
    Keeps only one attendance record for each
    student on each date.

    This cleans old duplicate records created
    by previous live-camera recognition requests.
    """

    db = next(get_db())

    try:
        groups = (
            db.query(
                Attendance.student_id,
                Attendance.date,
                func.min(Attendance.id).label("keep_id"),
                func.count(Attendance.id).label("total"),
            )
            .group_by(
                Attendance.student_id,
                Attendance.date,
            )
            .having(
                func.count(Attendance.id) > 1
            )
            .all()
        )

        deleted = 0

        for group in groups:

            duplicates = (
                db.query(Attendance)
                .filter(
                    Attendance.student_id
                    == group.student_id,
                    Attendance.date
                    == group.date,
                    Attendance.id
                    != group.keep_id,
                )
                .all()
            )

            for record in duplicates:
                db.delete(record)
                deleted += 1

        db.commit()

        if deleted > 0:
            print(
                f"Cleaned {deleted} duplicate attendance records."
            )

    except Exception as exc:
        db.rollback()
        print(
            "Duplicate attendance cleanup warning:",
            exc,
        )

    finally:
        db.close()


# Run cleanup once when backend starts
cleanup_duplicate_attendance()


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "SmartFace Attendance API is running",
        "status": "online",
    }


# =========================================================
# STUDENTS
# =========================================================

@app.get(
    "/api/students",
    response_model=list[StudentOut],
)
def students(
    db: Session = Depends(get_db),
):
    return (
        db.query(Student)
        .order_by(Student.id.desc())
        .all()
    )


# =========================================================
# ADD STUDENT
# =========================================================

@app.post(
    "/api/students",
    response_model=StudentOut,
)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
):

    existing = (
        db.query(Student)
        .filter(
            Student.roll_number
            == payload.roll_number
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Roll number already exists",
        )

    student = Student(
        **payload.model_dump()
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return student


# =========================================================
# DELETE STUDENT
# =========================================================

@app.delete(
    "/api/students/{student_id}"
)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
):

    student = (
        db.query(Student)
        .filter(
            Student.id == student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    # Delete student's face image
    if student.face_encoding_path:

        try:
            if os.path.exists(
                student.face_encoding_path
            ):
                os.remove(
                    student.face_encoding_path
                )
        except Exception:
            pass

    # Delete attendance records
    (
        db.query(Attendance)
        .filter(
            Attendance.student_id
            == student_id
        )
        .delete(
            synchronize_session=False
        )
    )

    db.delete(student)
    db.commit()

    return {
        "message": "Student deleted successfully"
    }
    # =========================================================
# UPDATE STUDENT
# =========================================================

@app.put(
    "/api/students/{student_id}",
    response_model=StudentOut,
)
def update_student(
    student_id: int,
    payload: StudentCreate,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    # Check duplicate roll number
    existing = (
        db.query(Student)
        .filter(
            Student.roll_number == payload.roll_number,
            Student.id != student_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Roll number already exists",
        )

    student.name = payload.name
    student.roll_number = payload.roll_number
    student.branch = payload.branch
    student.semester = payload.semester

    db.commit()
    db.refresh(student)

    return student

# =========================================================
# MANUAL ATTENDANCE
# =========================================================

@app.post(
    "/api/attendance",
    response_model=AttendanceOut,
)
def mark_attendance(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
):

    student = (
        db.query(Student)
        .filter(
            Student.id
            == payload.student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    now = datetime.now()

    today = now.strftime(
        "%Y-%m-%d"
    )

    # =====================================================
    # PREVENT DUPLICATE SAME-DAY ATTENDANCE
    # =====================================================

    already = (
        db.query(Attendance)
        .filter(
            Attendance.student_id
            == student.id,
            Attendance.date
            == today,
        )
        .order_by(Attendance.id.asc())
        .first()
    )

    if already:
        return already

    record = Attendance(
        student_id=student.id,
        date=today,
        time=now.strftime("%H:%M:%S"),
        status="Present",
        method="Manual",
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


# =========================================================
# GET ATTENDANCE
# =========================================================

@app.get(
    "/api/attendance",
    response_model=list[AttendanceOut],
)
def attendance(
    db: Session = Depends(get_db),
):

    return (
        db.query(Attendance)
        .order_by(
            Attendance.id.desc()
        )
        .all()
    )


# =========================================================
# STATISTICS
# =========================================================

@app.get("/api/stats")
def stats(
    db: Session = Depends(get_db),
):

    today = datetime.now().strftime(
        "%Y-%m-%d"
    )

    # Total registered students
    total = (
        db.query(Student)
        .count()
    )

    # =====================================================
    # IMPORTANT:
    # Count DISTINCT students, not attendance rows.
    #
    # So even if old duplicate records exist,
    # Present Today cannot become 4 for one student.
    # =====================================================

    present = (
        db.query(
            func.count(
                func.distinct(
                    Attendance.student_id
                )
            )
        )
        .filter(
            Attendance.date == today,
            Attendance.status == "Present",
        )
        .scalar()
        or 0
    )

    # Never allow present > total
    present = min(
        present,
        total
    )

    absent = max(
        total - present,
        0,
    )

    rate = (
        round(
            (present / total) * 100,
            2,
        )
        if total
        else 0
    )

    # Safety limit
    rate = min(
        max(rate, 0),
        100
    )

    return {
        "total_students": total,
        "present_today": present,
        "absent_today": absent,
        "attendance_rate": rate,
    }


# =========================================================
# FACE DETECTION
# =========================================================

@app.post(
    "/api/face/detect"
)
async def detect_faces(
    file: UploadFile = File(...),
):

    data = await file.read()

    temp_path = os.path.join(
        os.path.dirname(__file__),
        "temp_face_upload.jpg",
    )

    try:

        with open(
            temp_path,
            "wb",
        ) as f:
            f.write(data)

        faces = (
            face_service
            .detect_faces(
                temp_path
            )
        )

        return {
            "faces": faces
        }

    finally:

        if os.path.exists(
            temp_path
        ):
            os.remove(
                temp_path
            )


# =========================================================
# EXPORT ATTENDANCE CSV
# =========================================================

@app.get(
    "/api/attendance/export"
)
def export_attendance(
    db: Session = Depends(get_db),
):

    rows = (
        db.query(Attendance)
        .order_by(
            Attendance.date.desc(),
            Attendance.time.desc(),
        )
        .all()
    )

    data = [
        {
            "Attendance ID": r.id,
            "Student ID": r.student_id,
            "Date": r.date,
            "Time": r.time,
            "Status": r.status,
            "Method": r.method,
        }
        for r in rows
    ]

    df = pd.DataFrame(data)

    output = io.StringIO()

    df.to_csv(
        output,
        index=False,
    )

    output.seek(0)

    return StreamingResponse(
        iter(
            [output.getvalue()]
        ),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                "attachment; "
                "filename=attendance.csv"
        },
    )


# =========================================================
# REGISTER FACE
# =========================================================

@app.post(
    "/api/students/{student_id}/register-face"
)
async def register_face(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    student = (
        db.query(Student)
        .filter(
            Student.id
            == student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Empty image file.",
        )

    face_path = os.path.abspath(
        os.path.join(
            ENCODINGS_DIR,
            f"{student_id}.png",
        )
    )

    try:

        recognition_service.save_encoding(
            image_bytes,
            face_path,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Face registration failed: "
                + str(exc)
            ),
        )

    student.face_encoding_path = face_path

    db.commit()
    db.refresh(student)

    return {
        "message":
            "Face registered successfully",
        "student_id":
            student_id,
        "face_path":
            face_path,
    }


# =========================================================
# RECOGNIZE FACE + AUTOMATIC ATTENDANCE
# =========================================================

@app.post(
    "/api/recognize"
)
async def recognize_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Empty image file.",
        )

    # =====================================================
    # GET ALL STUDENTS
    # =====================================================

    students_list = (
        db.query(Student)
        .all()
    )

    if not students_list:

        return {
            "success": True,
            "matches": [],
            "recognized_students": [],
            "attendance_marked": [],
            "message":
                "No students registered.",
        }

    # =====================================================
    # FACE RECOGNITION
    # =====================================================

    try:

        matches = (
            recognition_service
            .recognize(
                image_bytes,
                students_list,
            )
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Face recognition failed: "
                + str(exc)
            ),
        )

    # =====================================================
    # RESULT ARRAYS
    # =====================================================

    attendance_marked = []
    recognized_students = []

    # Prevent processing the same student twice
    # if recognition service returns duplicate matches.
    processed_student_ids = set()

    # =====================================================
    # PROCESS EACH MATCH
    # =====================================================

    for match in matches:

        student_id = match.get(
            "student_id"
        )

        # No match
        if student_id is None:
            continue

        student_id = int(student_id)

        # Duplicate match in same image/frame
        if student_id in processed_student_ids:
            continue

        processed_student_ids.add(
            student_id
        )

        # =================================================
        # FIND STUDENT
        # =================================================

        student = (
            db.query(Student)
            .filter(
                Student.id
                == student_id
            )
            .first()
        )

        if not student:
            continue

        # =================================================
        # RECOGNIZED STUDENT
        # =================================================

        recognized_students.append(
            {
                "student_id":
                    student.id,
                "name":
                    student.name,
                "roll_number":
                    student.roll_number,
                "branch":
                    student.branch,
                "distance":
                    match.get(
                        "distance"
                    ),
            }
        )

        # =================================================
        # DATE + TIME
        # =================================================

        now = datetime.now()

        today = now.strftime(
            "%Y-%m-%d"
        )

        current_time = now.strftime(
            "%H:%M:%S"
        )

        # =================================================
        # CHECK EXISTING ATTENDANCE
        # =================================================

        existing = (
            db.query(Attendance)
            .filter(
                Attendance.student_id
                == student.id,
                Attendance.date
                == today,
            )
            .order_by(
                Attendance.id.asc()
            )
            .first()
        )

        # =================================================
        # ALREADY PRESENT
        # =================================================

        if existing:

            attendance_marked.append(
                {
                    "attendance_id":
                        existing.id,
                    "student_id":
                        student.id,
                    "name":
                        student.name,
                    "roll_number":
                        student.roll_number,
                    "status":
                        "Already Present",
                    "time":
                        existing.time,
                    "method":
                        existing.method,
                }
            )

            continue

        # =================================================
        # CREATE NEW ATTENDANCE
        # =================================================

        record = Attendance(
            student_id=student.id,
            date=today,
            time=current_time,
            status="Present",
            method="Live Face Recognition",
        )

        db.add(record)

        db.commit()

        db.refresh(record)

        # =================================================
        # ADD RESPONSE
        # =================================================

        attendance_marked.append(
            {
                "attendance_id":
                    record.id,
                "student_id":
                    student.id,
                "name":
                    student.name,
                "roll_number":
                    student.roll_number,
                "status":
                    "Attendance Marked",
                "time":
                    record.time,
                "method":
                    record.method,
            }
        )

    # =====================================================
    # FINAL RESPONSE
    # =====================================================

    return {
        "success": True,
        "matches": matches,
        "recognized_students":
            recognized_students,
        "attendance_marked":
            attendance_marked,
    }