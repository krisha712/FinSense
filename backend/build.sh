#!/usr/bin/env bash
set -e

echo "=== Installing system dependencies ==="
apt-get update -qq
apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-eng libgl1
echo "✅ Tesseract installed: $(tesseract --version 2>&1 | head -1)"

echo "=== Installing Python dependencies ==="
pip install --no-cache-dir -r requirements-render.txt

echo "=== Build complete ==="
