import os
import io
import base64
import logging
import tempfile
import requests
from urllib.request import urlopen
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import cv2
import os
from gradio_client import Client, file as gradio_file

# ============================================================
# CONFIGURATION
# ============================================================
PORT = int(os.getenv("PORT", 5001))
MODEL_NAME = "yisol/IDM-VTON"  # Hugging Face Space
HF_TOKEN = os.getenv("HF_TOKEN")
 # optional, only needed if private Space

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vton-idm")

app = Flask(__name__)
CORS(app)

# Initialize Gradio client once
logger.info(f"Connecting to Hugging Face model: {MODEL_NAME}")
client = Client(MODEL_NAME, hf_token=HF_TOKEN)

# ============================================================
# HELPERS
# ============================================================
def b64_to_tempfile(img_b64, suffix=".jpg"):
    """Convert base64 image → temporary file path"""
    img_data = base64.b64decode(img_b64)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(img_data)
    tmp.flush()
    return tmp.name

def url_to_tempfile(url, suffix=".jpg"):
    """Download image from URL → temporary file path"""
    resp = urlopen(url)
    img_data = resp.read()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(img_data)
    tmp.flush()
    return tmp.name

def image_to_base64(img_path):
    """Convert local image file → base64"""
    with open(img_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

# ============================================================
# MAIN TRY-ON ENDPOINT
# ============================================================
@app.route("/process-try-on", methods=["POST"])
def process_try_on():
    try:
        data = request.json or {}
        person_b64 = data.get("image")
        product_url = data.get("product_image_url")

        if not person_b64 or not product_url:
            return jsonify({"error": "Provide 'image' (base64) and 'product_image_url'"}), 400

        logger.info("⬆️ Received user image + product image")
        user_path = b64_to_tempfile(person_b64)
        cloth_path = url_to_tempfile(product_url)

        logger.info("🧠 Running IDM-VTON try-on via Hugging Face...")
        result = client.predict(
            dict={"background": gradio_file(user_path), "layers": [], "composite": None},
            garm_img=gradio_file(cloth_path),
            garment_des="Try-on",
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon"
        )

        # result → tuple of [output_image_path, masked_image_path]
        output_path = result[0]
        logger.info(f"✅ Model completed. Output path: {output_path}")

        processed_b64 = image_to_base64(output_path)

        return jsonify({
            "processed_image": processed_b64,
            "status": "success (IDM-VTON)"
        }), 200

    except Exception as e:
        logger.exception("❌ Try-on failed: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME})


if __name__ == "__main__":
    logger.info(f"🚀 Starting Virtual Try-On server (IDM-VTON) on port {PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=False)
