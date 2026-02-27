import os
from flask import Blueprint, jsonify, request, current_app
from database import get_db
from sqlite3 import IntegrityError
from utils import save_images, validate_products_fields, allowed_file

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
def create_product():
    catid       = request.form.get('catid')
    name        = (request.form.get('name') or '').strip()
    price       = request.form.get('price')
    description = (request.form.get('description') or '').strip()[:1000]

    ok, msg = validate_products_fields(catid, name, price)
    if not ok:
        return jsonify({'error': msg}), 400

    db = get_db()
    if not db.execute('SELECT 1 FROM categories WHERE catid = ?', (catid,)).fetchone():
        return jsonify({'error': 'Selected category does not exist'}), 400

    file = request.files.get('image')
    if not file or not allowed_file(file.filename):
        return jsonify({'error': 'A valid image file is required (jpg, jpeg, png, gif)'}), 400

    cur = db.execute(
        'INSERT INTO products (catid, name, price, description, image) VALUES (?, ?, ?, ?, NULL)',
        (int(catid), name, float(price), description)
    )
    db.commit()
    pid = cur.lastrowid

    folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(folder, exist_ok=True)
    save_images(pid, file.read(), folder)

    db.execute('UPDATE products SET image = ? WHERE pid = ?', (str(pid), pid))
    db.commit()

    return jsonify({'pid': pid, 'catid': int(catid), 'name': name,
                    'price': float(price), 'description': description,
                    'image': str(pid)}), 201


@bp.route('/<int:pid>', methods=['PUT'])
def update_product(pid):
    db = get_db()
    existing = db.execute('SELECT * FROM products WHERE pid = ?', (pid,)).fetchone()
    if not existing:
        return jsonify({'error': 'Product not found'}), 404

    catid       = request.form.get('catid')
    name        = (request.form.get('name') or '').strip()
    price       = request.form.get('price')
    description = (request.form.get('description') or '').strip()[:1000]

    ok, msg = validate_products_fields(catid, name, price)
    if not ok:
        return jsonify({'error': msg}), 400

    if not db.execute('SELECT 1 FROM categories WHERE catid = ?', (catid,)).fetchone():
        return jsonify({'error': 'Selected category does not exist'}), 400

    file = request.files.get('image')
    if file and allowed_file(file.filename):
        _delete_images(pid)
        folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(folder, exist_ok=True)
        save_images(pid, file.read(), folder)
        db.execute(
            'UPDATE products SET catid=?, name=?, price=?, description=?, image=? WHERE pid=?',
            (int(catid), name, float(price), description, str(pid), pid)
        )
    else:
        db.execute(
            'UPDATE products SET catid=?, name=?, price=?, description=? WHERE pid=?',
            (int(catid), name, float(price), description, pid)
        )
    db.commit()

    return jsonify({'pid': pid, 'catid': int(catid), 'name': name,
                    'price': float(price), 'description': description})


@bp.route('/<int:pid>', methods=['DELETE'])
def delete_product(pid):
    db = get_db()
    if not db.execute('SELECT 1 FROM products WHERE pid = ?', (pid,)).fetchone():
        return jsonify({'error': 'Product not found'}), 404
    db.execute('DELETE FROM products WHERE pid = ?', (pid,))
    db.commit()
    _delete_images(pid)
    return jsonify({'success': True})
