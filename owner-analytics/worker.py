#!/usr/bin/env python3
"""
Vision worker: reads sample videos, runs YOLO vehicle detection, maps boxes to slot rects,
counts cars crossing entry/exit lines drawn on the video, writes owner-analytics/output/{parkingId}.jpg,
POSTs live metrics to Spring Boot /api/internal/analytics/live-metrics.

Env:
  BACKEND_URL          default http://localhost:8080
  INTERNAL_TOKEN       default dev-internal-analytics (match app.internal-analytics-token)
  SMART_PARKING_ROOT   repo root (parent of owner-analytics); default: parent of this file's dir
  YOLO_MODEL_PATH      optional path to a custom .pt weights file (e.g. from Kaggle / Ultralytics YOLO)
  YOLO_CONF            confidence threshold (default 0.06; ground + aerial CCTV need low values)
  YOLO_IMGSZ           inference size long edge (default max(1280, min(w,h)); use 1920–2560 for 4K lots)
  YOLO_CLASSES           comma-separated COCO class ids (default 2,3,5,7 = car,motorcycle,bus,truck)
  YOLO_PREDICT_CLASSES   default 0 = infer all COCO classes then filter to YOLO_CLASSES (best for aerial).
                         Set to 1 to pass classes= into YOLO only (faster, often misses tiny cars).
  WORKER_EXIT_MIN_DY     blue/EXIT crossing: require centroid dy below this (default -0.35; more negative = stricter “up”).
  WORKER_ENTRY_MIN_DX    yellow/ENTRY crossing: require dx below this (default -0.35; more negative = stricter “left”).
  WORKER_RELAX_LINE_DIR  if 1: count ENTRY/EXIT when the centroid crosses the yellow/blue line with any direction
                           (only requires motion > WORKER_MIN_CROSS_MOTION_PX). Default for parking_id=1 is relaxed.
                           Set to 0 to force directional rules (aerial-style).
  WORKER_MIN_CROSS_MOTION_PX  min |dx|+|dy| between sampled frames to count a crossing (default 0.5).
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

import cv2
import numpy as np
import requests

# parking_id -> sample filename (must match DB)
#
# Per your request, we focus only on the new labeled entry/exit clip and output `1.jpg`.
# If you ever want to re-enable the other demo videos, set WORKER_ONLY_PARKING_ID= (empty)
# and add them back.
PARKING_VIDEOS = {
    1: "camera-entry:exit.mp4",
}

# Default COCO indices (YOLOv8): car, motorcycle, bus, truck — override with YOLO_CLASSES=2,5,7
DEFAULT_VEHICLE_CLASS_IDS = (2, 3, 5, 7)


def vehicle_class_ids() -> tuple[int, ...]:
    raw = os.environ.get("YOLO_CLASSES", "").strip()
    if not raw:
        return DEFAULT_VEHICLE_CLASS_IDS
    out: list[int] = []
    for part in raw.split(","):
        part = part.strip()
        if part.isdigit():
            out.append(int(part))
    return tuple(out) if out else DEFAULT_VEHICLE_CLASS_IDS


def repo_root() -> Path:
    override = os.environ.get("SMART_PARKING_ROOT", "").strip()
    if override:
        return Path(override).resolve()
    return Path(__file__).resolve().parent.parent


def norm_rect_to_xyxy(rect: list[float], w: int, h: int) -> tuple[int, int, int, int]:
    nx, ny, nw, nh = rect
    x1 = int(nx * w)
    y1 = int(ny * h)
    x2 = int((nx + nw) * w)
    y2 = int((ny + nh) * h)
    return x1, y1, x2, y2


def box_area(b: tuple[int, int, int, int]) -> int:
    x1, y1, x2, y2 = b
    return max(0, x2 - x1) * max(0, y2 - y1)


def intersection_xyxy(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> int:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    return max(0, ix2 - ix1) * max(0, iy2 - iy1)


def iou(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0, ix2 - ix1), max(0, iy2 - iy1)
    inter = iw * ih
    if inter <= 0:
        return 0.0
    aa = (ax2 - ax1) * (ay2 - ay1)
    ba = (bx2 - bx1) * (by2 - by1)
    union = aa + ba - inter
    return float(inter / union) if union > 0 else 0.0


def center_in_box(cx: float, cy: float, box: tuple[int, int, int, int]) -> bool:
    x1, y1, x2, y2 = box
    return x1 <= cx <= x2 and y1 <= cy <= y2


def slot_occupied(slot_xyxy: tuple[int, int, int, int], det_xyxy: np.ndarray) -> bool:
    """Aerial slots are huge vs. car boxes: IoU with slot is tiny; use center / frac-of-car / tiny frac-of-slot."""
    sx1, sy1, sx2, sy2 = slot_xyxy
    sw = max(1, sx2 - sx1)
    sh = max(1, sy2 - sy1)
    slot_area = max(1, sw * sh)
    for row in det_xyxy:
        bx = (int(row[0]), int(row[1]), int(row[2]), int(row[3]))
        x1, y1, x2, y2 = bx
        cx, cy = (x1 + x2) / 2.0, (y1 + y2) / 2.0
        car_area = max(1, box_area(bx))
        inter = intersection_xyxy(slot_xyxy, bx)
        if inter <= 0:
            continue
        if center_in_box(cx, cy, slot_xyxy):
            return True
        if iou(slot_xyxy, bx) > 0.02:
            return True
        # Much of the vehicle lies inside the zone (works when slot rect is a whole row)
        if inter / car_area > 0.12:
            return True
        # Tiny share of a huge "slot" still means a car is in that zone
        if inter / slot_area > 0.0015:
            return True
    return False


def _mask_color(frame_bgr: np.ndarray, kind: str) -> np.ndarray:
    """Return binary mask for the drawn line colors (blue exit, yellow entry)."""
    hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)
    if kind == "blue":
        # tuned for the thick cyan/blue line in the demo
        lower = np.array([85, 40, 40], dtype=np.uint8)
        upper = np.array([115, 255, 255], dtype=np.uint8)
    else:
        # tuned for the thick yellow line in the demo
        lower = np.array([15, 60, 60], dtype=np.uint8)
        upper = np.array([40, 255, 255], dtype=np.uint8)
    mask = cv2.inRange(hsv, lower, upper)
    mask = cv2.medianBlur(mask, 5)
    k = np.ones((5, 5), np.uint8)
    mask = cv2.dilate(mask, k, iterations=1)
    return mask


def _fit_line_from_mask(
    mask: np.ndarray,
    *,
    x_min: int | None = None,
    x_max: int | None = None,
    y_min: int | None = None,
    y_max: int | None = None,
) -> tuple[float, float, float] | None:
    """
    Fit a line ax+by+c=0 from a binary mask.

    Uses (in order):
    - ROI cropping (avoid label text interfering with fit)
    - largest connected component
    - Hough line segments fallback for thin/fragmented masks
    """
    h, w = mask.shape[:2]
    xm0 = 0 if x_min is None else max(0, int(x_min))
    xm1 = w if x_max is None else min(w, int(x_max))
    ym0 = 0 if y_min is None else max(0, int(y_min))
    ym1 = h if y_max is None else min(h, int(y_max))
    roi = mask[ym0:ym1, xm0:xm1]

    contours, _ = cv2.findContours(roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    pts: np.ndarray | None = None
    if contours:
        best = max(contours, key=cv2.contourArea)
        if cv2.contourArea(best) >= 400:
            c = best.reshape(-1, 2).astype(np.float32)
            if c.shape[0] >= 80:
                # shift ROI coords back to full-image coords
                c[:, 0] += float(xm0)
                c[:, 1] += float(ym0)
                pts = c

    if pts is None:
        # Hough fallback: robust to broken line masks
        edges = cv2.Canny(roi, 60, 180)
        lines = cv2.HoughLinesP(
            edges,
            rho=1,
            theta=np.pi / 180,
            threshold=60,
            minLineLength=max(30, int(min(w, h) * 0.12)),
            maxLineGap=25,
        )
        if lines is not None and len(lines) > 0:
            seg_pts = []
            for (x1, y1, x2, y2) in lines.reshape(-1, 4):
                seg_pts.append((x1 + xm0, y1 + ym0))
                seg_pts.append((x2 + xm0, y2 + ym0))
            pts = np.array(seg_pts, dtype=np.float32)

    if pts is None:
        ys, xs = np.where(roi > 0)
        if xs.size < 200:
            return None
        pts = np.stack([xs.astype(np.float32) + xm0, ys.astype(np.float32) + ym0], axis=1)

    vx, vy, x0, y0 = cv2.fitLine(pts, cv2.DIST_L2, 0, 0.01, 0.01)

    def _to_float(v) -> float:
        return float(np.asarray(v).reshape(-1)[0])

    vx = _to_float(vx)
    vy = _to_float(vy)
    x0 = _to_float(x0)
    y0 = _to_float(y0)
    # line normal (a,b) perpendicular to direction (vx,vy)
    a = -vy
    b = vx
    c = -(a * x0 + b * y0)
    # normalize
    n = (a * a + b * b) ** 0.5
    if n <= 1e-6:
        return None
    return a / n, b / n, c / n


def _side_of_line(line_abc: tuple[float, float, float], x: float, y: float) -> float:
    a, b, c = line_abc
    return a * x + b * y + c


def _iou_xyxy(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> float:
    return iou(a, b)


def _track_dets(prev_tracks: dict[int, tuple[int, int, int, int]], dets: np.ndarray) -> dict[int, tuple[int, int, int, int]]:
    """Very small IOU tracker: assigns detections to existing ids or creates new ones."""
    next_tracks: dict[int, tuple[int, int, int, int]] = {}
    used = set()
    next_id = (max(prev_tracks.keys()) + 1) if prev_tracks else 1

    det_boxes = [(int(d[0]), int(d[1]), int(d[2]), int(d[3])) for d in dets]
    for tid, tb in prev_tracks.items():
        best_j = -1
        best = 0.0
        for j, db in enumerate(det_boxes):
            if j in used:
                continue
            sc = _iou_xyxy(tb, db)
            if sc > best:
                best = sc
                best_j = j
        if best_j >= 0 and best >= 0.15:
            next_tracks[tid] = det_boxes[best_j]
            used.add(best_j)

    for j, db in enumerate(det_boxes):
        if j in used:
            continue
        next_tracks[next_id] = db
        next_id += 1
    return next_tracks


def _box_center(box: tuple[int, int, int, int]) -> tuple[float, float]:
    x1, y1, x2, y2 = box
    return (x1 + x2) / 2.0, (y1 + y2) / 2.0


def _assign_tracks(
    prev_tracks: dict[int, tuple[int, int, int, int]],
    dets: np.ndarray,
    max_center_dist_px: float,
) -> dict[int, tuple[int, int, int, int]]:
    """
    IOU tracker + center-distance fallback.
    The CCTV video has big per-step motion; pure IOU breaks IDs and causes wrong counts.
    """
    det_boxes = [(int(d[0]), int(d[1]), int(d[2]), int(d[3])) for d in dets]
    if not prev_tracks:
        return {i + 1: b for i, b in enumerate(det_boxes)}

    det_centers = [np.array(_box_center(b), dtype=np.float32) for b in det_boxes]
    prev_items = list(prev_tracks.items())
    prev_centers = [np.array(_box_center(b), dtype=np.float32) for _, b in prev_items]

    used = set()
    out: dict[int, tuple[int, int, int, int]] = {}

    # Greedy matching per previous track (stable ids > perfect optimality)
    for (tid, tb), pc in zip(prev_items, prev_centers):
        best_j = -1
        best_score = -1e9
        for j, db in enumerate(det_boxes):
            if j in used:
                continue
            iou_score = _iou_xyxy(tb, db)
            dc = float(np.linalg.norm(det_centers[j] - pc))
            if dc > max_center_dist_px and iou_score < 0.01:
                continue
            # Prefer IOU, but allow low-IOU matches if center stays close.
            score = (iou_score * 2.0) - (dc / max(1.0, max_center_dist_px))
            if score > best_score:
                best_score = score
                best_j = j
        if best_j >= 0:
            out[tid] = det_boxes[best_j]
            used.add(best_j)

    next_id = (max(prev_tracks.keys()) + 1) if prev_tracks else 1
    for j, db in enumerate(det_boxes):
        if j in used:
            continue
        out[next_id] = db
        next_id += 1
    return out


def run_vehicle_detection(model, frame: np.ndarray) -> np.ndarray:
    """Returns Nx4 xyxy in pixel coords. Aerial/drone frames: use large imgsz + post-filter COCO vehicle classes."""
    h, w = frame.shape[:2]
    long_edge = max(w, h)
    default_imgsz = max(1280, min(long_edge, 2560))
    imgsz = int(os.environ.get("YOLO_IMGSZ", str(default_imgsz)))
    imgsz = max(640, min(imgsz, 2560))
    conf = float(os.environ.get("YOLO_CONF", "0.06"))
    use_class_arg = os.environ.get("YOLO_PREDICT_CLASSES", "0").strip() != "0"
    allowed = set(vehicle_class_ids())

    kwargs: dict = dict(
        imgsz=imgsz,
        conf=conf,
        iou=0.5,
        max_det=500,
        verbose=False,
        agnostic_nms=True,
    )
    if use_class_arg:
        kwargs["classes"] = list(allowed)

    results = model.predict(frame, **kwargs)[0]
    if results.boxes is None or len(results.boxes) == 0:
        return np.zeros((0, 4))

    xyxy = results.boxes.xyxy.cpu().numpy()
    cls = results.boxes.cls.cpu().numpy().astype(int)
    mask = np.isin(cls, list(allowed))
    xyxy = xyxy[mask]
    if xyxy.size > 0 or use_class_arg:
        return xyxy

    # Retry: all classes at same conf, then keep vehicles (helps tiny aerial cars below class-specific threshold)
    results = model.predict(
        frame,
        imgsz=imgsz,
        conf=max(0.03, conf * 0.6),
        iou=0.5,
        max_det=500,
        verbose=False,
        agnostic_nms=True,
    )[0]
    if results.boxes is None or len(results.boxes) == 0:
        return np.zeros((0, 4))
    xyxy = results.boxes.xyxy.cpu().numpy()
    cls = results.boxes.cls.cpu().numpy().astype(int)
    mask = np.isin(cls, list(allowed))
    return xyxy[mask]


def run_vehicle_tracking(model, frame: np.ndarray) -> list[tuple[int, tuple[int, int, int, int]]]:
    """
    Returns a list of (track_id, xyxy) using Ultralytics built-in tracker (ByteTrack by default).
    This is more stable than our tiny IOU tracker on CCTV motion and reduces double-counting.
    """
    h, w = frame.shape[:2]
    long_edge = max(w, h)
    default_imgsz = max(960, min(long_edge, 1920))
    imgsz = int(os.environ.get("YOLO_IMGSZ", str(default_imgsz)))
    imgsz = max(640, min(imgsz, 1920))
    # Aerial CCTV: keep confidence low; do NOT pass classes= into track() (hurts recall on small cars).
    conf = float(os.environ.get("YOLO_CONF", "0.06"))
    allowed = set(vehicle_class_ids())
    tracker = os.environ.get("YOLO_TRACKER", "bytetrack.yaml")

    def _extract(res) -> list[tuple[int, tuple[int, int, int, int]]]:
        if res.boxes is None or len(res.boxes) == 0:
            return []
        xyxy = res.boxes.xyxy.cpu().numpy()
        cls = res.boxes.cls.cpu().numpy().astype(int)
        mask = np.isin(cls, list(allowed))
        xyxy = xyxy[mask]
        if xyxy.size == 0:
            return []
        if res.boxes.id is None:
            return []
        ids = res.boxes.id.cpu().numpy().astype(int)[mask]
        out: list[tuple[int, tuple[int, int, int, int]]] = []
        for tid, row in zip(ids, xyxy):
            out.append((int(tid), (int(row[0]), int(row[1]), int(row[2]), int(row[3]))))
        return out

    # NOTE: model.track defaults conf to 0.1 internally if omitted; we pass an explicit low conf for CCTV.
    res = model.track(
        frame,
        persist=True,
        imgsz=imgsz,
        conf=conf,
        iou=0.5,
        max_det=300,
        verbose=False,
        agnostic_nms=True,
        tracker=tracker,
    )[0]
    out = _extract(res)
    if out:
        return out

    # Retry: lower conf, still no classes= in track (better recall)
    res = model.track(
        frame,
        persist=True,
        imgsz=imgsz,
        conf=max(0.03, conf * 0.55),
        iou=0.5,
        max_det=300,
        verbose=False,
        agnostic_nms=True,
        tracker=tracker,
    )[0]
    return _extract(res)


def _reset_ultralytics_predictor_if_needed(model, frame_indices: dict, parking_id: int, use_ultra_track: bool) -> None:
    """ByteTrack state is global on the YOLO model; reset when switching demo parking videos."""
    if not use_ultra_track:
        return
    meta = frame_indices.setdefault("__tracker_last_pid", {"id": None})
    if meta["id"] == parking_id:
        return
    meta["id"] = parking_id
    if hasattr(model, "predictor") and model.predictor is not None:
        model.predictor = None

def process_parking(
    parking_id: int,
    video_path: Path,
    model,
    out_dir: Path,
    backend: str,
    token: str,
    frame_indices: dict,
) -> None:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"[skip] cannot open video {video_path}")
        return

    nframes = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 25.0)

    # Keep per-parking running totals and tracker state in frame_indices dict
    state = frame_indices.setdefault(
        parking_id,
        {
            "idx": 0,
            "entered": 0,
            "exited": 0,
            "tracks": {},
            "last_centers": {},
            "lines": None,
            "counted": {},  # tid -> {"blue": bool, "yellow": bool}
        },
    )
    idx = int(state.get("idx", 0)) % nframes
    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
    ok, frame = cap.read()
    cap.release()
    if not ok or frame is None:
        print(f"[skip] read frame failed {video_path}")
        return

    # Step by ~0.2s for more stable tracking on CCTV motion
    step = max(1, int(fps * float(os.environ.get("WORKER_STEP_SEC", "0.2"))))
    state["idx"] = idx + step

    h, w = frame.shape[:2]
    use_ultra_track = os.environ.get("USE_ULTRALYTICS_TRACK", "").strip() == "1" or parking_id == 1
    _reset_ultralytics_predictor_if_needed(model, frame_indices, parking_id, use_ultra_track)

    tracked: list[tuple[int, tuple[int, int, int, int]]] = []
    if use_ultra_track:
        tracked = run_vehicle_tracking(model, frame)

    diag = float((w * w + h * h) ** 0.5)
    prev_tracks = state.get("tracks") or {}

    if use_ultra_track and tracked:
        tracks = {tid: box for tid, box in tracked}
        cars_in_frame = len(tracks)
    else:
        det = run_vehicle_detection(model, frame)
        tracks = _assign_tracks(prev_tracks, det, max_center_dist_px=diag * 0.06)
        cars_in_frame = len(tracks)

    state["tracks"] = tracks

    # Detect lines once (from the drawn colors)
    if state.get("lines") is None:
        blue_mask = _mask_color(frame, "blue")
        yellow_mask = _mask_color(frame, "yellow")
        # ROI helps ignore the EXIT/ENTRY text and focus on the actual line.
        # Blue EXIT line is usually on the left; yellow ENTRY line on the right.
        blue_line = _fit_line_from_mask(blue_mask, x_max=int(w * 0.62))
        yellow_line = _fit_line_from_mask(yellow_mask, x_min=int(w * 0.38))
        state["lines"] = {"blue": blue_line, "yellow": yellow_line}

    lines = state.get("lines") or {}
    blue_line = lines.get("blue")
    yellow_line = lines.get("yellow")

    last_centers: dict[int, tuple[float, float]] = state.get("last_centers") or {}
    counted: dict[int, dict[str, bool]] = state.get("counted") or {}
    entered = int(state.get("entered", 0))
    exited = int(state.get("exited", 0))
    exit_dy_th = float(os.environ.get("WORKER_EXIT_MIN_DY", "-0.35"))
    entry_dx_th = float(os.environ.get("WORKER_ENTRY_MIN_DX", "-0.35"))
    relax_raw = os.environ.get("WORKER_RELAX_LINE_DIR", "").strip().lower()
    if relax_raw in ("1", "true", "yes"):
        relax_line_dir = True
    elif relax_raw in ("0", "false", "no"):
        relax_line_dir = False
    else:
        # Ground-level demo (parking 1) rarely matches fixed dx/dy signs; aerial-style defaults for others.
        relax_line_dir = parking_id == 1
    min_cross_m = float(os.environ.get("WORKER_MIN_CROSS_MOTION_PX", "0.5"))

    for tid, box in tracks.items():
        x1, y1, x2, y2 = box
        cx, cy = (x1 + x2) / 2.0, (y1 + y2) / 2.0
        prev = last_centers.get(tid)
        last_centers[tid] = (cx, cy)
        flags = counted.setdefault(tid, {"blue": False, "yellow": False})
        if prev is None:
            continue

        px, py = prev
        dx, dy = cx - px, cy - py
        motion_ok = abs(dx) + abs(dy) >= min_cross_m

        # EXIT: cross BLUE line. Strict mode: upward (dy < threshold). Relaxed: any crossing with real motion.
        if blue_line is not None:
            s1 = _side_of_line(blue_line, px, py)
            s2 = _side_of_line(blue_line, cx, cy)
            crosses = (s1 == 0 or s2 == 0 or (s1 > 0) != (s2 > 0))
            dir_ok = dy < exit_dy_th if not relax_line_dir else motion_ok
            if (not flags["blue"]) and crosses and dir_ok:
                exited += 1
                flags["blue"] = True
                continue

        # ENTRY: cross YELLOW line. Strict: leftward (dx < threshold). Relaxed: any crossing with real motion.
        if yellow_line is not None:
            s1 = _side_of_line(yellow_line, px, py)
            s2 = _side_of_line(yellow_line, cx, cy)
            crosses = (s1 == 0 or s2 == 0 or (s1 > 0) != (s2 > 0))
            dir_ok = dx < entry_dx_th if not relax_line_dir else motion_ok
            if (not flags["yellow"]) and crosses and dir_ok:
                entered += 1
                flags["yellow"] = True
                continue

    state["last_centers"] = last_centers
    state["counted"] = counted
    state["entered"] = entered
    state["exited"] = exited

    # Draw preview: detected lines + counts
    out = frame.copy()
    if blue_line is not None:
        # draw using mask contour for visual (fast): just overlay mask
        bm = _mask_color(frame, "blue")
        out[bm > 0] = (255, 140, 0)  # orange-ish overlay for blue line pixels
    if yellow_line is not None:
        ym = _mask_color(frame, "yellow")
        out[ym > 0] = (0, 255, 255)
    cv2.putText(out, f"EXIT (blue): {exited}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 200, 50), 2)
    cv2.putText(out, f"ENTRY (yellow): {entered}", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (50, 255, 255), 2)

    out_path = out_dir / f"{parking_id}.jpg"
    out_dir.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_path), out, [int(cv2.IMWRITE_JPEG_QUALITY), 88])

    if os.environ.get("WORKER_DRY_RUN", "").strip() == "1":
        print(f"[dry-run] parking {parking_id} entered={entered} exited={exited} cars={cars_in_frame}")
    else:
        payload = {
            "parkingId": parking_id,
            "carsInFrame": cars_in_frame,
            "enteredCount": entered,
            "exitedCount": exited,
        }
        url = f"{backend.rstrip('/')}/api/internal/analytics/live-metrics"
        r = requests.post(
            url,
            json=payload,
            headers={"X-Internal-Token": token, "Content-Type": "application/json"},
            timeout=30,
        )
        if r.status_code >= 300:
            print(f"[err] POST parking {parking_id}: {r.status_code} {r.text[:200]}")
        else:
            print(f"[ok] parking {parking_id} entered={entered} exited={exited} cars={cars_in_frame}")


def eval_video_counts(video_path: Path) -> tuple[int, int]:
    """
    Run through a single video from start to end and return totals (entered, exited).
    Use:
      WORKER_EVAL_VIDEO=owner-analytics/sample-videos/camera-entry:exit.mp4 WORKER_DRY_RUN=1 python3 worker.py
    """
    from ultralytics import YOLO

    weights = os.environ.get("YOLO_MODEL_PATH", "").strip() or "yolov8n.pt"
    wp = Path(weights)
    if not wp.is_absolute():
        wp = (Path.cwd() / wp).resolve()
    print(f"[eval] loading YOLO weights={wp}")
    model = YOLO(str(wp))
    print("[eval] model loaded")

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise SystemExit(f"cannot open video: {video_path}")
    nframes = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 25.0)
    print(f"[eval] opened video frames={nframes} fps={fps:.2f}")

    pid = 1
    # Local in-memory state like process_parking uses
    state = {"idx": 0, "entered": 0, "exited": 0, "tracks": {}, "last_centers": {}, "lines": None, "counted": {}}
    frame_indices: dict[int, dict] = {pid: state}

    # step for eval (slightly smaller than live loop)
    os.environ.setdefault("WORKER_STEP_SEC", "0.15")
    step = max(1, int(fps * float(os.environ.get("WORKER_STEP_SEC", "0.15"))))

    out_dir = repo_root() / "owner-analytics" / "output"
    backend = os.environ.get("BACKEND_URL", "http://localhost:8080").rstrip("/")
    token = os.environ.get("INTERNAL_TOKEN", "dev-internal-analytics")

    # Read sequentially (seeking per frame is extremely slow on some codecs).
    i = 0
    processed = 0
    while True:
        ok, frame = cap.read()
        if not ok or frame is None:
            break
        if i % step != 0:
            i += 1
            continue

        # emulate process_parking but with explicit frame
        h, w = frame.shape[:2]
        if processed == 0:
            t0 = time.time()
        det = run_vehicle_detection(model, frame)
        if processed == 0:
            print(f"[eval] first inference took {time.time() - t0:.2f}s frame={i} size={w}x{h}")
        cars_in_frame = int(len(det))

        if state.get("lines") is None:
            blue_mask = _mask_color(frame, "blue")
            yellow_mask = _mask_color(frame, "yellow")
            blue_line = _fit_line_from_mask(blue_mask)
            yellow_line = _fit_line_from_mask(yellow_mask)
            state["lines"] = {"blue": blue_line, "yellow": yellow_line}
        lines = state.get("lines") or {}
        blue_line = lines.get("blue")
        yellow_line = lines.get("yellow")

        prev_tracks = state.get("tracks") or {}
        diag = float((w * w + h * h) ** 0.5)
        tracks = _assign_tracks(prev_tracks, det, max_center_dist_px=diag * 0.06)
        state["tracks"] = tracks

        last_centers: dict[int, tuple[float, float]] = state.get("last_centers") or {}
        counted: dict[int, dict[str, bool]] = state.get("counted") or {}
        entered = int(state.get("entered", 0))
        exited = int(state.get("exited", 0))
        exit_dy_th = float(os.environ.get("WORKER_EXIT_MIN_DY", "-0.35"))
        entry_dx_th = float(os.environ.get("WORKER_ENTRY_MIN_DX", "-0.35"))
        relax_raw = os.environ.get("WORKER_RELAX_LINE_DIR", "").strip().lower()
        if relax_raw in ("1", "true", "yes"):
            relax_line_dir = True
        elif relax_raw in ("0", "false", "no"):
            relax_line_dir = False
        else:
            relax_line_dir = pid == 1
        min_cross_m = float(os.environ.get("WORKER_MIN_CROSS_MOTION_PX", "0.5"))

        for tid, box in tracks.items():
            cx, cy = _box_center(box)
            prev = last_centers.get(tid)
            last_centers[tid] = (cx, cy)
            flags = counted.setdefault(tid, {"blue": False, "yellow": False})
            if prev is None:
                continue
            px, py = prev
            dx, dy = cx - px, cy - py
            motion_ok = abs(dx) + abs(dy) >= min_cross_m

            if blue_line is not None:
                s1 = _side_of_line(blue_line, px, py)
                s2 = _side_of_line(blue_line, cx, cy)
                crosses = (s1 == 0 or s2 == 0 or (s1 > 0) != (s2 > 0))
                dir_ok = dy < exit_dy_th if not relax_line_dir else motion_ok
                if (not flags["blue"]) and crosses and dir_ok:
                    exited += 1
                    flags["blue"] = True
                    continue

            if yellow_line is not None:
                s1 = _side_of_line(yellow_line, px, py)
                s2 = _side_of_line(yellow_line, cx, cy)
                crosses = (s1 == 0 or s2 == 0 or (s1 > 0) != (s2 > 0))
                dir_ok = dx < entry_dx_th if not relax_line_dir else motion_ok
                if (not flags["yellow"]) and crosses and dir_ok:
                    entered += 1
                    flags["yellow"] = True
                    continue

        state["last_centers"] = last_centers
        state["counted"] = counted
        state["entered"] = entered
        state["exited"] = exited

        processed += 1
        if processed % int(os.environ.get("WORKER_EVAL_LOG_EVERY", "30")) == 0:
            print(f"[eval] frame={i}/{nframes} step={step} cars={cars_in_frame} entered={entered} exited={exited}")

        i += 1

    cap.release()
    return int(state["entered"]), int(state["exited"])


def main() -> None:
    eval_path = os.environ.get("WORKER_EVAL_VIDEO", "").strip()
    if eval_path:
        vp = Path(eval_path)
        if not vp.is_absolute():
            # Prefer resolving relative to current working directory (useful when running from owner-analytics/)
            cwd_candidate = Path.cwd() / eval_path
            if cwd_candidate.is_file():
                vp = cwd_candidate
            else:
                vp = repo_root() / eval_path
        vp = vp.resolve()
        entered, exited = eval_video_counts(vp)
        print(f"[eval-total] video={vp.name} entered={entered} exited={exited}")
        return

    root = repo_root()
    sample_dir = root / "owner-analytics" / "sample-videos"
    out_dir = root / "owner-analytics" / "output"
    backend = os.environ.get("BACKEND_URL", "http://localhost:8080").rstrip("/")
    token = os.environ.get("INTERNAL_TOKEN", "dev-internal-analytics")

    from ultralytics import YOLO

    weights = os.environ.get("YOLO_MODEL_PATH", "").strip()
    if weights:
        wp = Path(weights)
        if not wp.is_file():
            raise SystemExit(f"YOLO_MODEL_PATH not found: {wp}")
        model = YOLO(str(wp))
        print(f"Using custom weights: {wp}")
    else:
        model = YOLO("yolov8n.pt")
        print("Using default yolov8n.pt (set YOLO_MODEL_PATH for a Kaggle / custom .pt file)")
    frame_indices: dict[int, int] = {}
    interval = float(os.environ.get("WORKER_INTERVAL_SEC", "4"))

    print(f"Worker root={root} backend={backend} interval={interval}s")
    while True:
        for pid, fname in PARKING_VIDEOS.items():
            vpath = sample_dir / fname
            if not vpath.is_file():
                print(f"[warn] missing {vpath}")
                continue
            try:
                process_parking(pid, vpath, model, out_dir, backend, token, frame_indices)
            except Exception as e:
                print(f"[err] parking {pid}: {e}")
        time.sleep(interval)


if __name__ == "__main__":
    main()
