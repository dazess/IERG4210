import os
from flask import Blueprint, jsonify, request, current_app
from auth_utils import admin_required
from database import get_db
from utils import save_images, validate_product_fields, validate_image_upload

bp = Blueprint('products', __name__, url_prefix='/api/products')


def _delete_images(pid):
    folder = current_app.config['UPLOAD_FOLDER']
    for suffix in ('_full.jpg', '_thumb.jpg'):
        path = os.path.join(folder, f'{pid}{suffix}')
        if os.path.exists(path):
            os.remove(path)


@bp.route('', methods=['GET'])
def list_products():
    db = get_db()
    catid = request.args.get('catid', type=int)
    if catid:
        rows = db.execute(
            'SELECT * FROM products WHERE catid = ? ORDER BY name', (catid,)
        ).fetchall()
    else:
        rows = db.execute('SELECT * FROM products ORDER BY name').fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route('/<int:pid>', methods=['GET'])
def get_product(pid):
    db = get_db()
    row = db.execute(
        'SELECT p.*, c.name AS catname '
        'FROM products p JOIN categories c ON p.catid = c.catid '
        'WHERE p.pid = ?', (pid,)
    ).fetchone()
    if not row:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(dict(row))


@bp.route('', methods=['POST'])
@admin_required
def create_product():
    payload, err = validate_product_fields(
        request.form.get('catid'),
        request.form.get('name'),
        request.form.get('price'),
        request.form.get('description'),
    )
    if err:
        return jsonify({'error': err}), 400

    db = get_db()
    if not db.execute('SELECT 1 FROM categories WHERE catid = ?', (payload['catid'],)).fetchone():
        return jsonify({'error': 'Selected category does not exist'}), 400

    file_bytes, image_err = validate_image_upload(request.files.get('image'), required=True)
    if image_err:
        return jsonify({'error': image_err}), 400

    cur = db.execute(
        'INSERT INTO products (catid, name, price, description, image) VALUES (?, ?, ?, ?, NULL)',
        (payload['catid'], payload['name'], payload['price'], payload['description'])
    )
    db.commit()
    pid = cur.lastrowid

    folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(folder, exist_ok=True)
    save_images(pid, file_bytes, folder)

    db.execute('UPDATE products SET image = ? WHERE pid = ?', (str(pid), pid))
    db.commit()

    return jsonify({'pid': pid, 'catid': payload['catid'], 'name': payload['name'],
                    'price': payload['price'], 'description': payload['description'],
                    'image': str(pid)}), 201


@bp.route('/<int:pid>', methods=['PUT'])
@admin_required
def update_product(pid):
    db = get_db()
    existing = db.execute('SELECT * FROM products WHERE pid = ?', (pid,)).fetchone()
    if not existing:
        return jsonify({'error': 'Product not found'}), 404

    payload, err = validate_product_fields(
        request.form.get('catid'),
        request.form.get('name'),
        request.form.get('price'),
        request.form.get('description'),
    )
    if err:
        return jsonify({'error': err}), 400

    if not db.execute('SELECT 1 FROM categories WHERE catid = ?', (payload['catid'],)).fetchone():
        return jsonify({'error': 'Selected category does not exist'}), 400

    file = request.files.get('image')
    file_bytes = None
    if file and file.filename:
        file_bytes, image_err = validate_image_upload(file, required=False)
        if image_err:
            return jsonify({'error': image_err}), 400

    if file_bytes:
        _delete_images(pid)
        folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(folder, exist_ok=True)
        save_images(pid, file_bytes, folder)
        db.execute(
            'UPDATE products SET catid=?, name=?, price=?, description=?, image=? WHERE pid=?',
            (payload['catid'], payload['name'], payload['price'], payload['description'], str(pid), pid)
        )
    else:
        db.execute(
            'UPDATE products SET catid=?, name=?, price=?, description=? WHERE pid=?',
            (payload['catid'], payload['name'], payload['price'], payload['description'], pid)
        )
    db.commit()

    return jsonify({'pid': pid, 'catid': payload['catid'], 'name': payload['name'],
                    'price': payload['price'], 'description': payload['description']})


@bp.route('/<int:pid>', methods=['DELETE'])
@admin_required
def delete_product(pid):
    db = get_db()
    if not db.execute('SELECT 1 FROM products WHERE pid = ?', (pid,)).fetchone():
        return jsonify({'error': 'Product not found'}), 404
    db.execute('DELETE FROM products WHERE pid = ?', (pid,))
    db.commit()
    _delete_images(pid)
    return jsonify({'success': True})
