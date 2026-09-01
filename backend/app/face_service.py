import cv2

class FaceService:
    """Basic OpenCV face detection helper.

    Recognition should be implemented with a validated embedding model
    (for example, a modern face-embedding pipeline) rather than treating
    Haar detection as identity recognition.
    """

    def __init__(self):
        self.detector = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

    def detect_faces(self, image_path: str):
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Unable to read image")
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.detector.detectMultiScale(gray, 1.1, 5)
        return [{"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
                for x, y, w, h in faces]
