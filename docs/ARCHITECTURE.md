# Architecture

Camera/Webcam
    |
    v
OpenCV Face Detection / Recognition
    |
    v
FastAPI Backend
    |
    +---- SQLite/PostgreSQL
    |
    +---- Attendance API
    |
    v
React Dashboard

Recommended future upgrades:
1. Replace demo recognition with a validated embedding model.
2. Add liveness detection.
3. Add role-based authentication.
4. Move biometric data to secure storage.
5. Add audit logs and consent management.
