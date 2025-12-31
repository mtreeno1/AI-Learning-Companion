from ultralytics import YOLO
import cv2
import numpy as np

det = YOLO("models/yolov8n.pt")
pose = YOLO("models/yolov8n-pose.pt")

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # ---------- PHONE DETECTION ----------
    phone_detected = False
    det_results = det(frame, conf=0.5, verbose=False)

    for r in det_results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = det.names[cls_id]
            conf = float(box.conf[0])

            if label == "cell phone":
                phone_detected = True
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(
                    frame,
                    f"PHONE {conf:.2f}",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 0, 255),
                    2,
                )

    # ---------- POSE ESTIMATION ----------
    yaw, pitch = None, None
    pose_results = pose(frame, verbose=False)

    if (
        pose_results
        and pose_results[0].keypoints is not None
        and len(pose_results[0].keypoints.xy) > 0
    ):
        kpts = pose_results[0].keypoints.xy[0].cpu().numpy()

        # Draw keypoints
        for x, y in kpts:
            cv2.circle(frame, (int(x), int(y)), 3, (0, 255, 0), -1)

        # Head angle
        nose = kpts[0]
        left_eye = kpts[1]
        right_eye = kpts[2]
        eye_center = (left_eye + right_eye) / 2

        dx = nose[0] - eye_center[0]
        dy = nose[1] - eye_center[1]

        yaw = np.degrees(np.arctan2(dx, 100))
        pitch = np.degrees(np.arctan2(dy, 100))

        cv2.putText(
            frame,
            f"Yaw:{yaw:.1f} Pitch:{pitch:.1f}",
            (20, 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 0),
            2,
        )

    # ---------- FOCUS LOGIC ----------
    focused = True
    if phone_detected or yaw is None or abs(yaw) > 25 or abs(pitch) > 20:
        focused = False

    cv2.putText(
        frame,
        f"FOCUS: {'YES' if focused else 'NO'}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0) if focused else (0, 0, 255),
        2,
    )

    cv2.imshow("AI Engine Test", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
