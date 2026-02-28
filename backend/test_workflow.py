"""
Quick test: call the Roboflow workflow and print the raw JSON response.
Run from the backend directory with the venv active.
Usage: python test_workflow.py <path_to_image>
"""
import base64, json, sys, os
import httpx
from dotenv import load_dotenv

load_dotenv()

API_KEY     = os.getenv("ROBOFLOW_API_KEY")
WORKSPACE   = os.getenv("ROBOFLOW_WORKSPACE", "devsm")
WORKFLOW_ID = os.getenv("ROBOFLOW_WORKFLOW_ID", "detect-and-classify-2")
URL = f"https://serverless.roboflow.com/infer/workflows/{WORKSPACE}/{WORKFLOW_ID}"

# Use a tiny test image if none provided
img_path = sys.argv[1] if len(sys.argv) > 1 else None

if img_path:
    with open(img_path, "rb") as f:
        image_bytes = f.read()
else:
    # Download a sample calligraphy image for testing
    import urllib.request
    test_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Kufic_Quran.jpg/320px-Kufic_Quran.jpg"
    with urllib.request.urlopen(test_url) as r:
        image_bytes = r.read()
    print(f"Downloaded test image ({len(image_bytes)} bytes)")

encoded = base64.b64encode(image_bytes).decode("utf-8")

payload = {
    "api_key": API_KEY,
    "inputs": {
        "image": {"type": "base64", "value": encoded}
    }
}

print(f"\nCalling: {URL}\n")
resp = httpx.post(URL, json=payload, timeout=60)
print(f"Status: {resp.status_code}\n")
print("=== RAW RESPONSE ===")
print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
