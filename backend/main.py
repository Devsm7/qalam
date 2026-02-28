"""
Qalam - Hebr AI Backend
Calls the Roboflow Workflow REST API via httpx.
Correct URL: https://serverless.roboflow.com/{workspace}/workflows/{workflow_id}
"""

import base64
import json
import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(title="Qalam Hebr AI", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

ROBOFLOW_API_KEY     = os.getenv("ROBOFLOW_API_KEY", "")
ROBOFLOW_WORKSPACE   = os.getenv("ROBOFLOW_WORKSPACE", "devsm")
ROBOFLOW_WORKFLOW_ID = os.getenv("ROBOFLOW_WORKFLOW_ID", "detect-and-classify-3")

# Correct URL format per Roboflow's own cURL example
WORKFLOW_URL = (
    f"https://serverless.roboflow.com"
    f"/{ROBOFLOW_WORKSPACE}/workflows/{ROBOFLOW_WORKFLOW_ID}"
)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE_BYTES   = 10 * 1024 * 1024  # 10 MB


@app.get("/")
async def health():
    return {"status": "ok", "service": "Qalam Hebr AI", "workflow": WORKFLOW_URL}


def _parse_outputs(data: dict):
    """Recursively walk the workflow response to find top class + confidence."""
    print("\n===== ROBOFLOW RAW RESPONSE =====")
    print(json.dumps(data, indent=2, ensure_ascii=False))
    print("=================================\n")

    # Response shape: { "outputs": [ {...} ] }
    outputs = data.get("outputs", [])
    if not outputs:
        return "Unknown", 0.0, data

    output = outputs[0] if isinstance(outputs, list) else outputs

    def extract(obj):
        if not isinstance(obj, dict):
            return None, 0.0

        # `top` + `confidence` — direct fields (Roboflow classification output)
        if "top" in obj and obj["top"]:
            return str(obj["top"]), float(obj.get("confidence", 0.0))

        # `predicted_classes` list
        if "predicted_classes" in obj:
            classes = obj["predicted_classes"]
            preds   = obj.get("predictions", {})
            if classes and classes[0]:
                top  = classes[0]
                conf = 0.0
                if isinstance(preds, dict):
                    entry = preds.get(top, {})
                    conf  = entry.get("confidence", 0.0) if isinstance(entry, dict) else float(entry)
                return top, conf

        # `class_name` or `class`
        for key in ("class_name", "class"):
            if key in obj and obj[key]:
                return str(obj[key]), float(obj.get("confidence", 0.0))

        # Recurse into nested values
        for val in obj.values():
            if isinstance(val, dict):
                r = extract(val)
                if r[0]:
                    return r
            elif isinstance(val, list):
                for item in val:
                    if isinstance(item, dict):
                        r = extract(item)
                        if r[0]:
                            return r

        return None, 0.0

    top, conf = extract(output)
    return top or "Unknown", conf, output


@app.post("/classify")
async def classify_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported file type '{file.content_type}'.")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB limit.")

    if not ROBOFLOW_API_KEY:
        raise HTTPException(status_code=500, detail="ROBOFLOW_API_KEY is not set in backend/.env")

    encoded = base64.b64encode(image_bytes).decode("utf-8")

    payload = {
        "api_key": ROBOFLOW_API_KEY,
        "inputs": {
            "image": {
                "type":  "base64",
                "value": encoded
            }
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                WORKFLOW_URL,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach Roboflow: {exc}")

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Roboflow returned {response.status_code}: {response.text}"
        )

    top, conf, raw = _parse_outputs(response.json())

    return JSONResponse({
        "type":       top,
        "confidence": round(float(conf), 4),
        "raw":        raw   # keep for debugging; remove once stable
    })
