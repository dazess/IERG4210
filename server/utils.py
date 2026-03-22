import re
from decimal import Decimal, InvalidOperation
from io import BytesIO

import bleach
from PIL import Image, ImageOps, UnidentifiedImageError
from werkzeug.utils import secure_filename

MAX_CATEGORY_NAME_LEN = 255
MAX_PRODUCT_NAME_LEN = 255
MAX_DESCRIPTION_LEN = 1000
MAX_PRICE = Decimal('99999999.99')
MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_FORMATS = {'JPEG', 'PNG', 'GIF'}
allowed_extensions = {'jpg', 'jpeg', 'png', 'gif'}


def _strip_controls(value):
    return ''.join(ch for ch in value if ch.isprintable() or ch in ('\n', '\t', '\r'))


def sanitize_text(value, max_len, multiline=False):
    cleaned = bleach.clean(str(value or ''), tags=[], attributes={}, protocols=[], strip=True)
    cleaned = _strip_controls(cleaned)
    if multiline:
        cleaned = '\n'.join(' '.join(line.split()) for line in cleaned.splitlines())
    else:
        cleaned = ' '.join(cleaned.split())
    return cleaned[:max_len].strip()


def parse_catid(catid):
    if catid is None or str(catid).strip() == '':
        return None, 'Category is required'
    try:
        parsed = int(str(catid).strip())
    except ValueError:
        return None, 'Category must be a valid integer'
    if parsed <= 0:
        return None, 'Category must be a positive integer'
    return parsed, ''


def parse_price(price):
    if price is None or str(price).strip() == '':
        return None, 'Price is required'

    raw = str(price).strip()
    if not re.fullmatch(r'\d+(\.\d{1,2})?', raw):
        return None, 'Price must be a valid amount with up to 2 decimal places'

    try:
        amount = Decimal(raw)
    except InvalidOperation:
        return None, 'Price must be a valid number'

    if amount < 0:
        return None, 'Price must be non-negative'
    if amount > MAX_PRICE:
        return None, 'Price is too large'

    return float(amount), ''


def validate_category_name(name):
    cleaned = sanitize_text(name, MAX_CATEGORY_NAME_LEN)
    if not cleaned:
        return None, 'Category name is required'
    return cleaned, ''


def validate_product_fields(catid, name, price, description):
    parsed_catid, catid_err = parse_catid(catid)
    if catid_err:
        return None, catid_err

    cleaned_name = sanitize_text(name, MAX_PRODUCT_NAME_LEN)
    if not cleaned_name:
        return None, 'Product name is required'

    parsed_price, price_err = parse_price(price)
    if price_err:
        return None, price_err

    cleaned_description = sanitize_text(description, MAX_DESCRIPTION_LEN, multiline=True)

    return {
        'catid': parsed_catid,
        'name': cleaned_name,
        'price': parsed_price,
        'description': cleaned_description,
    }, ''


def allowed_file(filename):
    if not filename:
        return False
    safe_name = secure_filename(filename)
    return '.' in safe_name and safe_name.rsplit('.', 1)[1].lower() in allowed_extensions


def validate_image_upload(file_storage, required):
    if not file_storage or file_storage.filename == '':
        if required:
            return None, 'A valid image file is required (jpg, jpeg, png, gif)'
        return None, ''

    if not allowed_file(file_storage.filename):
        return None, 'Invalid image extension. Allowed: jpg, jpeg, png, gif'

    file_bytes = file_storage.read()
    file_storage.stream.seek(0)

    if not file_bytes:
        return None, 'Image file is empty'
    if len(file_bytes) > MAX_IMAGE_BYTES:
        return None, 'Image exceeds the 10MB limit'

    try:
        image = Image.open(BytesIO(file_bytes))
        image.verify()
        image = Image.open(BytesIO(file_bytes))
        if image.format not in ALLOWED_IMAGE_FORMATS:
            return None, 'Invalid image format. Allowed: jpg, jpeg, png, gif'
    except (UnidentifiedImageError, OSError):
        return None, 'Invalid image file'

    return file_bytes, ''

def save_images(pid, file_bytes, upload_folder):
    img = Image.open(BytesIO(file_bytes)).convert('RGB')
    full = img.copy()
    full.thumbnail((800, 600), Image.BILINEAR)
    full.save(f'{upload_folder}/{pid}_full.jpg', format='JPEG', quality=70)

    thumb = ImageOps.fit(img, (300, 200), Image.BILINEAR)
    thumb.save(f'{upload_folder}/{pid}_thumb.jpg', format='JPEG', quality=70)

    return f'{pid}_full.jpg', f'{pid}_thumb.jpg'