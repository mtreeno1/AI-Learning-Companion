"""
Focus Detection Module
Handles concentration monitoring using YOLOv8 models for phone detection and pose estimation.
"""
from ultralytics import YOLO
import cv2
import numpy as np
from typing import Tuple, Optional, Dict, Any


class FocusDetector:
    """
    Detects user focus based on phone detection and head pose estimation.
    """
    
    def __init__(
        self,
        detection_model_path: str = "models/yolov8n.pt",
        pose_model_path: str = "models/yolov8n-pose.pt",
        phone_conf_threshold: float = 0.5,
        yaw_threshold: float = 25.0,
        pitch_threshold: float = 20.0
    ):
        """
        Initialize the focus detector with YOLO models.
        
        Args:
            detection_model_path: Path to object detection model
            pose_model_path: Path to pose estimation model
            phone_conf_threshold: Confidence threshold for phone detection
            yaw_threshold: Maximum allowed yaw angle for focus
            pitch_threshold: Maximum allowed pitch angle for focus
        """
        self.det_model = YOLO(detection_model_path)
        self.pose_model = YOLO(pose_model_path)
        self.phone_conf_threshold = phone_conf_threshold
        self.yaw_threshold = yaw_threshold
        self.pitch_threshold = pitch_threshold
    
    def detect_phone(self, frame: np.ndarray) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Detect if a phone is present in the frame.
        
        Args:
            frame: Input image frame
            
        Returns:
            Tuple of (phone_detected, detection_info)
        """
        det_results = self.det_model(frame, conf=self.phone_conf_threshold, verbose=False)
        
        for r in det_results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                label = self.det_model.names[cls_id]
                conf = float(box.conf[0])
                
                if label == "cell phone":
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    return True, {
                        "bbox": [x1, y1, x2, y2],
                        "confidence": conf,
                        "label": label
                    }
        
        return False, None
    
    def estimate_head_pose(self, frame: np.ndarray) -> Tuple[Optional[float], Optional[float], Optional[list]]:
        """
        Estimate head pose angles from keypoints.
        
        Args:
            frame: Input image frame
            
        Returns:
            Tuple of (yaw, pitch, keypoints)
        """
        pose_results = self.pose_model(frame, verbose=False)
        
        if (
            pose_results
            and pose_results[0].keypoints is not None
            and len(pose_results[0].keypoints.xy) > 0
        ):
            kpts = pose_results[0].keypoints.xy[0].cpu().numpy()
            
            # Extract face keypoints
            nose = kpts[0]
            left_eye = kpts[1]
            right_eye = kpts[2]
            eye_center = (left_eye + right_eye) / 2
            
            # Calculate head angles
            dx = nose[0] - eye_center[0]
            dy = nose[1] - eye_center[1]
            
            yaw = np.degrees(np.arctan2(dx, 100))
            pitch = np.degrees(np.arctan2(dy, 100))
            
            # Convert keypoints to list for JSON serialization
            keypoints_list = [[float(x), float(y)] for x, y in kpts]
            
            return yaw, pitch, keypoints_list
        
        return None, None, None
    
    def analyze_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Analyze a single frame for focus detection.
        
        Args:
            frame: Input image frame
            
        Returns:
            Dictionary containing focus analysis results
        """
        # Detect phone
        phone_detected, phone_info = self.detect_phone(frame)
        
        # Estimate head pose
        yaw, pitch, keypoints = self.estimate_head_pose(frame)
        
        # Determine focus status
        focused = True
        focus_reasons = []
        
        if phone_detected:
            focused = False
            focus_reasons.append("Phone detected in frame")
        
        if yaw is None:
            focused = False
            focus_reasons.append("No face detected")
        elif abs(yaw) > self.yaw_threshold:
            focused = False
            focus_reasons.append(f"Head turned too far (yaw: {yaw:.1f}°)")
        
        if pitch is not None and abs(pitch) > self.pitch_threshold:
            focused = False
            focus_reasons.append(f"Head tilted too far (pitch: {pitch:.1f}°)")
        
        return {
            "focused": focused,
            "phone_detected": phone_detected,
            "phone_info": phone_info,
            "head_pose": {
                "yaw": yaw if yaw is not None else None,
                "pitch": pitch if pitch is not None else None
            },
            "keypoints": keypoints,
            "focus_reasons": focus_reasons if not focused else ["User is focused"]
        }
