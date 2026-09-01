from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from .database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    roll_number = Column(String(50), unique=True, nullable=False, index=True)
    branch = Column(String(100), nullable=False)
    semester = Column(String(20), nullable=False)
    face_encoding_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, nullable=False, index=True)
    date = Column(String(20), nullable=False, index=True)
    time = Column(String(20), nullable=False)
    status = Column(String(20), default="Present")
    method = Column(String(30), default="Face Recognition")
