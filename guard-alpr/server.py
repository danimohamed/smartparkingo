"""
Local ALPR helper for Smart Parking guards.

Run:
  cd guard-alpr && python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  uvicorn server:app --host 127.0.0.1 --port 8790

Spring Boot: set APP_ALPR_URL=http://127.0.0.1:8790

POST /read-plate multipart field "file" -> JSON { "plate": "...", "confidence": 0.0-1.0 }
"""
from __future__ import annotations

import io
import re
from typing import Any

import numpy as np
from fastapi import FastAPI, File, UploadFile
from PIL import Image

app = FastAPI(title="Guard ALPR")
_reader: Any = None


def _normalize_plate(text: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", text.upper())


@app.on_event("startup")
def _load() -> None:
    global _reader
    import easyocr

    _reader = easyocr.Reader(["en", "fr"], gpu=False)


@app.post("/read-plate")
async def read_plate(file: UploadFile = File(...)) -> dict[str, Any]:
    if _reader is None:
        return {"plate": None, "confidence": 0.0, "error": "reader not ready"}
    raw = await file.read()
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    arr = np.array(img)
    results = _reader.readtext(arr, detail=1, paragraph=False)
    best = ("", 0.0)
    for bbox, text, conf in results:
        norm = _normalize_plate(text)
        if len(norm) >= 4 and conf >= best[1]:
            best = (norm, float(conf))
    if not best[0]:
        # fallback: longest alphanumeric token from any detection
        for bbox, text, conf in results:
            for token in re.findall(r"[A-Za-z0-9]{4,}", text):
                t = _normalize_plate(token)
                if len(t) >= len(best[0]):
                    best = (t, float(conf))
    return {"plate": best[0] or None, "confidence": best[1]}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
