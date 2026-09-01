# SmartFace Attendance

AI-based attendance management starter project using React + FastAPI + OpenCV.

## Features
- Admin dashboard
- Student registration
- Attendance marking API
- Attendance history
- CSV export
- Real face embedding registration and recognition with `opencv-contrib-python` (LBPH)
- SQLite database for easy local setup
- One-face-at-a-time registration
- Recognition endpoint that can mark attendance automatically
- React frontend

## Project Structure
- `backend/` FastAPI API, SQLite database and OpenCV face service
- `frontend/` React/Vite dashboard
- `docs/` setup and architecture notes

## Run Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API: http://127.0.0.1:8000
Docs: http://127.0.0.1:8000/docs

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Notes
This repository is a clean academic/prototype foundation. For production use, add authentication, HTTPS, liveness detection, encrypted biometric storage, access controls and a proper consent/privacy workflow.


## Face Recognition Setup
The project uses the `face-recognition` Python package to create LBPH face templates. During registration, a single face is encoded and saved locally. During recognition, the uploaded image is compared with registered embeddings.

For a demo:
1. Register students.
2. Register one clear face image for each student.
3. Upload a photo containing one or more faces.
4. The `/api/recognize` endpoint identifies matches and marks today's attendance.

For production, add liveness detection, authentication, encrypted biometric storage, retention rules and explicit consent.
