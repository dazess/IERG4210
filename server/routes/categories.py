from flask import Blueprint, jsonify, request
from database import get_db
from sqlite3 import IntegrityError

bp = Blueprint('categories', __name__, url_prefix='/api/categories')


@bp.route('', methods=['GET'])
def list_categories():
    db = get_db()
    rows = db.execute('SELECT catid, name FROM categories ORDER BY name').fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route('', methods=['POST'])
def create_category():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()[:255]
    if not name:
        return jsonify({'error': 'Category name is required'}), 400
    try:
        db = get_db()
        cur = db.execute('INSERT INTO categories (name) VALUES (?)', (name,))
        db.commit()
        return jsonify({'catid': cur.lastrowid, 'name': name}), 201
    except IntegrityError:
        return jsonify({'error': 'Category name already exists'}), 409


@bp.route('/<int:catid>', methods=['PUT'])
def update_category(catid):
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()[:255]
    if not name:
        return jsonify({'error': 'Category name is required'}), 400
    db = get_db()
    cur = db.execute('UPDATE categories SET name = ? WHERE catid = ?', (name, catid))
    db.commit()
    if cur.rowcount == 0:
        return jsonify({'error': 'Category not found'}), 404
    return jsonify({'catid': catid, 'name': name})


@bp.route('/<int:catid>', methods=['DELETE'])
def delete_category(catid):
    try:
        db = get_db()
        cur = db.execute('DELETE FROM categories WHERE catid = ?', (catid,))
        db.commit()
        if cur.rowcount == 0:
            return jsonify({'error': 'Category not found'}), 404
        return jsonify({'success': True})
    except IntegrityError:
        return jsonify({'error': 'Cannot delete: category has associated products'}), 409
