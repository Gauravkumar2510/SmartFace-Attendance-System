from pydantic import BaseModel, ConfigDict

class StudentCreate(BaseModel):
    name: str
    roll_number: str
    branch: str
    semester: str

class StudentOut(StudentCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class AttendanceCreate(BaseModel):
    student_id: int

class AttendanceOut(BaseModel):
    id: int
    student_id: int
    date: str
    time: str
    status: str
    method: str
    model_config = ConfigDict(from_attributes=True)
