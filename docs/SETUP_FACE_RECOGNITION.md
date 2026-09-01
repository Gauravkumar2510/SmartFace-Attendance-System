# Face Recognition Setup

## Windows
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload
```

If `face-recognition` installation fails on Windows because of a native dependency, use a supported Python environment/version and install the required build tools, or run the backend in a Linux/WSL environment.

## Frontend
```bash
cd frontend
npm install
npm run dev
```

Open the frontend URL shown by Vite.

## Demo Flow
1. Start backend.
2. Start frontend.
3. Add a student.
4. Select that student under Face Recognition.
5. Upload one clear image containing only that student's face.
6. Click Register Face.
7. Upload a new image containing the registered face.
8. Click Recognize & Mark.
9. Check Recent Attendance.

## Important
This is an academic prototype. Face recognition is biometric processing. Use consent, access control and secure storage for real deployments.
