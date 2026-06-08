import re
import logging
from datetime import datetime
from typing import Dict, Optional, List, Tuple
import os
import shutil
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import io

logger = logging.getLogger(__name__)


def configure_tesseract() -> None:
    """Point pytesseract at the Tesseract binary.

    Priority order:
    1. TESSERACT_CMD env variable (explicit override)
    2. System PATH
    3. Common Linux paths (Render/Ubuntu)
    4. Common Windows install locations
    5. Common macOS (Homebrew) install locations
    """
    # 1. Explicit env override
    env_path = os.getenv("TESSERACT_CMD", "").strip()
    if env_path and os.path.exists(env_path):
        pytesseract.pytesseract.tesseract_cmd = env_path
        logger.info("✅ Tesseract configured from TESSERACT_CMD env: %s", env_path)
        return

    # 2. Already on PATH
    if shutil.which("tesseract"):
        found = shutil.which("tesseract")
        pytesseract.pytesseract.tesseract_cmd = found
        logger.info("✅ Tesseract found on system PATH: %s", found)
        return

    # 3. Common Linux paths (Render, Ubuntu, Debian)
    linux_paths = [
        "/usr/bin/tesseract",
        "/usr/local/bin/tesseract",
        "/usr/share/tesseract-ocr/tesseract",
    ]
    for path in linux_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            logger.info("✅ Tesseract configured from Linux path: %s", path)
            return

    # 4. Common Windows paths
    windows_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Users\Hp\AppData\Local\Programs\Tesseract-OCR\tesseract.exe",
    ]
    for path in windows_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            logger.info("✅ Tesseract configured from Windows path: %s", path)
            return

    # 5. Common macOS (Homebrew) paths
    macos_paths = [
        "/opt/homebrew/bin/tesseract",
        "/usr/local/bin/tesseract",
    ]
    for path in macos_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            logger.info("✅ Tesseract configured from macOS path: %s", path)
            return

    logger.warning("❌ Tesseract binary not found. Receipt scanning will not work.")


# ============================================================
# PREPROCESSING
# ============================================================

def preprocess_text(text: str) -> Tuple[List[str], str]:
    """Preprocess OCR text into normalized lines.
    Returns: (cleaned_lines, normalized_text)
    """
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        line = re.sub(r'\s+', ' ', line)
        if line:
            cleaned_lines.append(line)
    normalized_text = '\n'.join([line.lower() for line in cleaned_lines])
    return cleaned_lines, normalized_text


# ============================================================
# AMOUNT EXTRACTION
# ============================================================

def extract_amount_with_scoring(lines: List[str], normalized_text: str) -> Tuple[Optional[float], float]:
    """Extract amount using hierarchical approach."""
    logger.debug("[AMOUNT EXTRACTION] Starting")

    all_candidates = []
    item_prices = []

    for i, line in enumerate(lines):
        line_lower = line.lower()
        numbers = extract_numbers_from_line(line)

        for num in numbers:
            if num < 50:
                logger.debug("[FILTER] Rejected %s (< 50) from line %s", num, i)
                continue
            if num < 10:
                continue

            all_candidates.append({
                'value': num,
                'line_index': i,
                'line_text': line,
                'line_lower': line_lower
            })

            if i < len(lines) * 0.6 and num < 5000:
                item_prices.append(num)

    # Remove frequently-occurring values (OCR noise)
    value_counts: Dict = {}
    for c in all_candidates:
        value_counts[c['value']] = value_counts.get(c['value'], 0) + 1

    candidates = []
    for c in all_candidates:
        if value_counts[c['value']] > 3:
            logger.debug("[FILTER] Rejected %s (appears %s times)", c['value'], value_counts[c['value']])
        else:
            candidates.append(c)

    # Remove item rows (many numbers per line)
    filtered_candidates = []
    for c in candidates:
        line_numbers = extract_numbers_from_line(c['line_text'])
        if len(line_numbers) > 2:
            logger.debug("[FILTER] Rejected %s from line %s (item row)", c['value'], c['line_index'])
        else:
            filtered_candidates.append(c)
    candidates = filtered_candidates

    logger.debug("[FILTER] %s candidates after filtering", len(candidates))

    # --- TOTAL BLOCK OVERRIDE ---
    total_keywords = [
        'grand total', 'net total', 'total amount', 'amount payable',
        'bill amount', 'final amount', 'total payable', 'amount due',
        'net amount', 'payable amount', 'final total', 'net payable',
        'total bill', 'bill total', 'invoice total', 'net bill'
    ]
    # Stronger currency-prefixed amount extraction first
    currency_candidates = []
    for c in candidates:
        line = c['line_text']
        if re.search(r'[₹\$][\s]*\d', line) or re.search(r'\brs\.?\s*\d', line.lower()):
            currency_candidates.append(c)
    
    # If we have currency-prefixed amounts, prefer the largest one near end of receipt
    if currency_candidates:
        currency_candidates.sort(key=lambda x: (x['line_index'], x['value']), reverse=True)
        # Pick highest value currency-prefixed amount
        best_currency = max(currency_candidates, key=lambda x: x['value'])
        logger.debug("[CURRENCY] Selected amount %.2f from line %s", best_currency['value'], best_currency['line_index'])
        return best_currency['value'], 0.90
    exclude_keywords = ['subtotal', 'sub total', 'cgst', 'sgst', 'igst', 'tax', 'gst']

    total_lines = []
    for c in candidates:
        line_lower = c['line_lower']
        if any(excl in line_lower for excl in exclude_keywords):
            continue
        if 'total' in line_lower or 'amount' in line_lower or 'payable' in line_lower:
            keyword_match = next((kw for kw in total_keywords if kw in line_lower), None)
            if keyword_match or 'total' in line_lower:
                total_lines.append({
                    'candidate': c,
                    'keyword': keyword_match or 'total',
                    'priority': 2 if keyword_match else 1
                })
                logger.debug("[OVERRIDE] Found total line %s: %s", c['line_index'], c['line_text'])

    if total_lines:
        total_lines.sort(key=lambda x: x['candidate']['line_index'], reverse=True)
        selected = total_lines[0]['candidate']
        logger.debug("[OVERRIDE] Selected amount %.2f from line %s", selected['value'], selected['line_index'])

        confidence = 0.95
        if item_prices:
            max_item = max(item_prices)
            if selected['value'] < max_item * 0.8:
                logger.debug("[SANITY] Amount %.2f < max item %.2f", selected['value'], max_item)
                confidence = 0.7

        return selected['value'], confidence

    # --- SCORING FALLBACK ---
    logger.debug("[OVERRIDE] No total lines found, falling back to scoring")
    if not candidates:
        return None, 0.0

    for c in candidates:
        score = 0
        line_lower = c['line_lower']
        value = c['value']
        line_numbers = extract_numbers_from_line(c['line_text'])

        if value > 500 and any(sym in c['line_text'] for sym in ['rs.', 'rs ', 'inr', 'rupee']):
            score += 10
        if c['line_index'] >= len(lines) * 0.7:
            score += 8
        if len(line_numbers) <= 2:
            score += 5
        if '.' in str(value) or ',' in c['line_text']:
            score += 3
        if value < 100:
            score -= 10
        if len(line_numbers) > 2:
            score -= 10
        if any(kw in line_lower for kw in ['gst', 'cgst', 'sgst', 'tax']):
            score -= 5
        c['score'] = score

    candidates.sort(key=lambda x: (x['score'], x['line_index']), reverse=True)
    best = candidates[0]
    confidence = min(1.0, max(0.3, (best['score'] + 15) / 30))

    if item_prices:
        max_item = max(item_prices)
        if best['value'] < max_item:
            confidence = max(0.3, confidence - 0.3)

    logger.debug("[FALLBACK] Selected %.2f (score %s)", best['value'], best['score'])
    return best['value'], confidence


def extract_numbers_from_line(line: str) -> List[float]:
    """Extract all numeric values from a line."""
    cleaned = re.sub(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', ' ', line.lower())
    numbers = []
    for match in re.findall(r'(?:rs\.?|inr)?\s*(\d[\d,]*\.?\d{0,2})', cleaned):
        try:
            numbers.append(float(match.replace(',', '')))
        except ValueError:
            pass
    return numbers


# ============================================================
# DATE EXTRACTION
# ============================================================

def extract_date_with_scoring(lines: List[str]) -> Tuple[str, float]:
    """Extract date using scoring. Returns (date_string, confidence)."""
    date_patterns = [
        (r'(\d{2})[/-](\d{2})[/-](\d{4})', 'dd-mm-yyyy'),
        (r'(\d{4})[/-](\d{2})[/-](\d{2})', 'yyyy-mm-dd'),
        (r'(\d{2})[/-](\d{2})[/-](\d{2})', 'dd-mm-yy'),
    ]
    candidates = []

    for i, line in enumerate(lines):
        line_lower = line.lower()
        for pattern, fmt in date_patterns:
            for match in re.finditer(pattern, line):
                score = 0
                if i < len(lines) * 0.3:
                    score += 2
                if 'date' in line_lower or 'bill date' in line_lower:
                    score += 2
                if fmt in ('dd-mm-yyyy', 'yyyy-mm-dd'):
                    score += 1
                try:
                    g = match.groups()
                    if fmt == 'yyyy-mm-dd':
                        date_obj = datetime.strptime(f"{g[0]}-{g[1]}-{g[2]}", "%Y-%m-%d")
                    elif fmt == 'dd-mm-yyyy':
                        date_obj = datetime.strptime(f"{g[0]}-{g[1]}-{g[2]}", "%d-%m-%Y")
                    else:
                        date_obj = datetime.strptime(f"{g[0]}-{g[1]}-{g[2]}", "%d-%m-%y")

                    if date_obj > datetime.now():
                        score -= 3
                    if date_obj.year < 2010:
                        score -= 2

                    candidates.append({
                        'date': date_obj.strftime("%Y-%m-%d"),
                        'score': score,
                        'line_index': i,
                    })
                except ValueError:
                    continue

    if candidates:
        candidates.sort(key=lambda x: (x['score'], -x['line_index']), reverse=True)
        best = candidates[0]
        confidence = min(1.0, max(0.3, (best['score'] + 3) / 8))
        logger.debug("[DATE] Selected: %s (confidence %.2f)", best['date'], confidence)
        return best['date'], confidence

    today = datetime.now().strftime("%Y-%m-%d")
    logger.debug("[DATE] No date found, using today: %s", today)
    return today, 0.3


# ============================================================
# CATEGORY CLASSIFICATION
# ============================================================

def classify_category(lines: List[str], normalized_text: str) -> Tuple[str, float]:
    """Classify receipt category. Returns (category, confidence)."""
    scores = {
        'Food': 0, 'Transport': 0, 'Shopping': 0, 'Entertainment': 0,
        'Healthcare': 0, 'Utilities': 0, 'Travel': 0, 'Education': 0,
        'Rent': 0, 'Other': 0
    }

    keyword_map = {
        'Food': (['restaurant', 'cafe', 'hotel', 'dine', 'kitchen', 'bistro',
                  'swiggy', 'zomato', 'food delivery'], 3,
                 ['biryani', 'pizza', 'burger', 'chicken', 'rice', 'coffee', 'menu'], 2),
        'Transport': (['uber', 'ola', 'lyft', 'taxi', 'cab', 'rapido', 'petrol',
                       'diesel', 'fuel', 'pump'], 3, [], 0),
        'Shopping': (['mall', 'store', 'retail', 'mart', 'supermarket',
                      'amazon', 'flipkart', 'fashion', 'shop', 'apparel'], 3, [], 0),
        'Entertainment': (['movie', 'cinema', 'theatre', 'pvr', 'inox', 'ticket',
                           'show', 'concert'], 3, [], 0),
        'Healthcare': (['hospital', 'clinic', 'pharmacy', 'medical', 'doctor',
                        'apollo', 'health'], 3, [], 0),
        'Utilities': (['electricity', 'water', 'internet', 'broadband', 'mobile',
                       'recharge', 'jio', 'airtel', 'vodafone'], 3, [], 0),
        'Rent': (['rent', 'lease', 'landlord', 'maintenance', 'apartment', 'flat'], 3, [], 0),
        'Travel': (['resort', 'booking', 'flight', 'airline', 'airport',
                    'airbnb', 'oyo', 'makemytrip'], 3, [], 0),
        'Education': (['school', 'college', 'university', 'course', 'tuition',
                       'stationery', 'exam', 'fees'], 3, [], 0),
    }

    for category, (strong, sw, medium, mw) in keyword_map.items():
        for kw in strong:
            if kw in normalized_text:
                scores[category] += sw
        for kw in medium:
            if kw in normalized_text:
                scores[category] += mw

    if 'qty' in normalized_text or 'item' in normalized_text:
        scores['Food'] += 2

    max_score = max(scores.values())
    if max_score == 0:
        return 'Shopping', 0.3

    best_category = max(scores, key=scores.get)
    confidence = min(1.0, max(0.3, max_score / 10))
    logger.debug("[CATEGORY] Selected: %s (score %s, confidence %.2f)", best_category, max_score, confidence)
    return best_category, confidence


# ============================================================
# DESCRIPTION EXTRACTION
# ============================================================

def extract_description(lines: List[str]) -> Tuple[str, float]:
    """Extract merchant/store name from top of receipt."""
    candidates = []

    for i, line in enumerate(lines[:5]):
        line_lower = line.lower()
        if len(line) < 3:
            continue
        if re.match(r'^[\d\s\-\/\:\.\,]+$', line):
            continue
        if any(kw in line_lower for kw in ['address', 'pin', 'gst', 'gstin', 'phone', 'mob']):
            continue

        num_digits = sum(c.isdigit() for c in line)
        if num_digits > len(line) * 0.5:
            continue

        score = 0
        if i == 0:
            score += 3
        if any(c.isupper() for c in line):
            score += 2
        if 5 <= len(line) <= 50:
            score += 1

        candidates.append({'text': line.strip(), 'score': score, 'line_index': i})

    if candidates:
        candidates.sort(key=lambda x: (x['score'], -x['line_index']), reverse=True)
        best = candidates[0]
        description = best['text'][:100]
        confidence = min(1.0, max(0.4, (best['score'] + 5) / 10))
        logger.debug("[DESCRIPTION] Selected: '%s' (confidence %.2f)", description, confidence)
        return description, confidence

    return "Receipt scan", 0.3


def extract_line_item_description(lines: List[str]) -> Optional[str]:
    """Pick the most likely line item description from the receipt."""
    skip_keywords = [
        'total', 'subtotal', 'tax', 'gst', 'cgst', 'sgst', 'invoice', 'receipt',
        'bill no', 'date', 'amount', 'cash', 'card', 'upi', 'thank you'
    ]
    item_candidates = []

    for i, line in enumerate(lines[1:12], start=1):
        line_lower = line.lower()
        if any(kw in line_lower for kw in skip_keywords):
            continue
        if len(line.strip()) < 3:
            continue
        numbers = extract_numbers_from_line(line)
        letters = sum(ch.isalpha() for ch in line)
        if letters < 3:
            continue

        score = 0
        if numbers:
            score += 3
        if 4 <= len(line) <= 40:
            score += 2
        if i <= 6:
            score += 1

        cleaned = re.sub(r'\s+\d[\d,]*\.?\d*.*$', '', line).strip(' -:')
        item_candidates.append({'text': cleaned, 'score': score})

    if not item_candidates:
        return None

    item_candidates.sort(key=lambda x: x['score'], reverse=True)
    return item_candidates[0]['text'] or None


# ============================================================
# MAIN PARSER
# ============================================================

def parse_receipt(text: str) -> Dict:
    """Main receipt parsing function with confidence scoring."""
    lines, normalized_text = preprocess_text(text)
    logger.debug("[PARSE] %s lines extracted from OCR text", len(lines))

    amount, amount_conf = extract_amount_with_scoring(lines, normalized_text)
    date, date_conf = extract_date_with_scoring(lines)
    category, category_conf = classify_category(lines, normalized_text)
    description, desc_conf = extract_description(lines)
    item_description = extract_line_item_description(lines)

    final_description = item_description or description
    overall_confidence = (amount_conf + date_conf + category_conf + desc_conf) / 4

    logger.debug("[PARSE] Done — amount=%.2f, date=%s, category=%s, confidence=%.2f",
                 amount or 0, date, category, overall_confidence)

    return {
        'amount': amount,
        'date': date,
        'category': category,
        'description': final_description,
        'merchant': description,
        'raw_text_preview': '\n'.join(lines[:12]),
        'confidence': round(overall_confidence, 2)
    }


# ============================================================
# OCR INTEGRATION
# ============================================================

def preprocess_image(image_bytes: bytes) -> Image.Image:
    """Preprocess image for better OCR accuracy."""
    image = Image.open(io.BytesIO(image_bytes))

    if image.mode != 'RGB':
        image = image.convert('RGB')

    image = ImageOps.exif_transpose(image)
    width, height = image.size
    if width < 1400:
        scale = 1400 / max(width, 1)
        image = image.resize((int(width * scale), int(height * scale)), Image.LANCZOS)

    image = image.convert('L')
    image = ImageOps.autocontrast(image)
    image = ImageEnhance.Contrast(image).enhance(1.8)
    image = image.filter(ImageFilter.SHARPEN)
    image = image.point(lambda px: 255 if px > 165 else 0)
    return image


def extract_text(image: Image.Image) -> str:
    """Extract text from image using pytesseract."""
    try:
        return pytesseract.image_to_string(image, config='--oem 3 --psm 6')
    except Exception as exc:
        raise Exception(f"OCR failed: {exc}") from exc


def scan_receipt(image_bytes: bytes) -> Dict:
    """Main entry point: scan receipt image and extract expense data."""
    try:
        configure_tesseract()

        image = preprocess_image(image_bytes)
        text = extract_text(image)

        if not text or len(text.strip()) < 10:
            return {"success": False, "error": "Could not extract text from image"}

        parsed = parse_receipt(text)

        if not parsed['amount']:
            return {"success": False, "error": "Could not extract amount from receipt"}

        return {
            "success": True,
            "extracted": {
                "amount": parsed['amount'],
                "date": parsed['date'],
                "category": parsed['category'],
                "description": parsed['description'],
                "merchant": parsed.get('merchant'),
            },
            "confidence": parsed['confidence'],
            "raw_text_preview": parsed.get('raw_text_preview', ''),
        }

    except Exception as exc:
        logger.error("scan_receipt failed: %s", exc)
        return {"success": False, "error": str(exc)}
