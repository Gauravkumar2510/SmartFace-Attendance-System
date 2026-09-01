# SmartFace Attendance System

An AI-based face recognition attendance management system built with
**React, FastAPI, Python and OpenCV**.

The project is designed to automate attendance using face recognition
while providing a modern web interface for managing attendance data.

---

## 🚀 Features

- Face detection using OpenCV
- Face recognition using LBPH
- Automated attendance marking
- FastAPI backend
- React-based frontend
- Attendance data management
- SQLite database support
- Modular backend architecture
- Responsive web interface
- Ready for future AI/ML improvements

---

## 🛠️ Technologies Used

### Frontend
- React
- JavaScript
- HTML5
- CSS3
- Vite

### Backend
- Python
- FastAPI
- OpenCV
- LBPH Face Recognizer

### Database
- SQLite

### Tools
- Git
- GitHub
- VS Code

---

## 📁 Project Structure

```text
SmartFace-Attendance-System/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── face_service.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── recognition_service.py
│   │   └── schemas.py
│   │
│   ├── data/
│   │   └── haarcascade_frontalface_default.xml
│   │
│   ├── face_encodings/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   │
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PROJECT_REPORT_OUTLINE.md
│   ├── ROADMAP.md
│   └── SETUP_FACE_RECOGNITION.md
│
├── README.md
└── .gitignore
