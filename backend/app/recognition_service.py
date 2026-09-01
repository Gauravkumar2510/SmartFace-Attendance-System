import os
import cv2
import numpy as np


class RecognitionService:

    def __init__(self):

        # Look for Haar Cascade inside project first
        project_cascade = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "..",
                "data",
                "haarcascade_frontalface_default.xml"
            )
        )

        # Also check OpenCV's default data directory
        opencv_cascade = os.path.join(
            cv2.data.haarcascades,
            "haarcascade_frontalface_default.xml"
        )

        if os.path.exists(project_cascade):
            cascade_path = project_cascade

        elif os.path.exists(opencv_cascade):
            cascade_path = opencv_cascade

        else:
            raise RuntimeError(
                "Haar Cascade XML file not found.\n"
                "Expected file:\n"
                + project_cascade
            )

        print("Using Haar Cascade:")
        print(cascade_path)

        self.detector = cv2.CascadeClassifier(
            cascade_path
        )

        if self.detector.empty():
            raise RuntimeError(
                "Haar Cascade could not be loaded."
            )

        print(
            "Face detector loaded successfully."
        )


    # =====================================================
    # READ IMAGE
    # =====================================================

    def _image(self, image_bytes):

        array = np.frombuffer(
            image_bytes,
            dtype=np.uint8
        )

        image = cv2.imdecode(
            array,
            cv2.IMREAD_GRAYSCALE
        )

        if image is None:
            raise ValueError(
                "Invalid image file."
            )

        return image


    # =====================================================
    # DETECT ONE FACE
    # =====================================================

    def _face_crop(self, gray):

        faces = self.detector.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80)
        )

        if len(faces) == 0:
            raise ValueError(
                "No face found. Please use a clear front-face photo."
            )

        if len(faces) > 1:
            raise ValueError(
                "Multiple faces found. Please upload an image with only one face."
            )

        x, y, w, h = faces[0]

        face = gray[
            y:y + h,
            x:x + w
        ]

        face = cv2.resize(
            face,
            (200, 200)
        )

        return face, (x, y, w, h)


    # =====================================================
    # REGISTER FACE
    # =====================================================

    def save_encoding(
        self,
        image_bytes,
        path
    ):

        gray = self._image(
            image_bytes
        )

        face, _ = self._face_crop(
            gray
        )

        folder = os.path.dirname(path)

        os.makedirs(
            folder,
            exist_ok=True
        )

        saved = cv2.imwrite(
            path,
            face
        )

        if not saved:
            raise ValueError(
                "Unable to save face image."
            )


    # =====================================================
    # RECOGNIZE FACE
    # =====================================================

    def recognize(
        self,
        image_bytes,
        known_students
    ):

        gray = self._image(
            image_bytes
        )

        faces = self.detector.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80)
        )

        results = []

        for x, y, w, h in faces:

            face = gray[
                y:y + h,
                x:x + w
            ]

            face = cv2.resize(
                face,
                (200, 200)
            )

            best_id = None
            best_distance = None

            for student in known_students:

                path = student.face_encoding_path

                if not path:
                    continue

                if not os.path.exists(path):
                    continue

                reference = cv2.imread(
                    path,
                    cv2.IMREAD_GRAYSCALE
                )

                if reference is None:
                    continue

                recognizer = (
                    cv2.face.LBPHFaceRecognizer_create()
                )

                recognizer.train(
                    [reference],
                    np.array(
                        [student.id],
                        dtype=np.int32
                    )
                )

                predicted_id, confidence = (
                    recognizer.predict(face)
                )

                if predicted_id == student.id:

                    if (
                        best_distance is None
                        or confidence < best_distance
                    ):
                        best_id = student.id
                        best_distance = float(
                            confidence
                        )

            # Lower LBPH distance = better match
            if (
                best_distance is not None
                and best_distance <= 75
            ):
                matched_id = best_id
            else:
                matched_id = None

            results.append({
                "student_id": matched_id,
                "distance": best_distance,
                "location": {
                    "top": int(y),
                    "right": int(x + w),
                    "bottom": int(y + h),
                    "left": int(x)
                }
            })

        return results