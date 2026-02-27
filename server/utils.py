from PIL import Image, ImageOps
from io import BytesIO

def save_images(pid, file_bytes, upload_folder):
    img = Image.open(BytesIO(file_bytes)).convert('RGB')
    full = img.copy()
    full.thumbnail((800, 600), Image.BILINEAR)
    full.save(f'{upload_folder}/{pid}_full.jpg', format='JPEG', quality=70)

    thumb = ImageOps.fit(img, (300, 200), Image.BILINEAR)
    thumb.save(f'{upload_folder}/{pid}_thumb.jpg', format='JPEG', quality=70)

    return f'{pid}_full.jpg', f'{pid}_thumb.jpg'

def validate_products_fields(catid, name, price):
    if not catid or not name or price is None:
        return False, "Missing required fields"
    try:
        price = float(price)
        if price < 0:
            return False, "Price must be non-negative"
    except ValueError:
        return False, "Price must be a number"
    return True, ""

allowed_extensions = {'jpg', 'jpeg', 'png', 'gif'}
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions