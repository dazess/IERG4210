import re
import secrets

from flask import Blueprint, jsonify, request, session
from sqlite3 import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from auth_utils import get_session_user, login_required
from database import get_db

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def _sanitize_email(value):
    return str(value or '').strip().lower()[:255]


def _sanitize_display_name(value):
    return ' '.join(str(value or '').split())[:255]


def _validate_password(password):
    pw = str(password or '')
    if len(pw) < 8:
        return False, 'Password must be at least 8 characters'
    if len(pw) > 128:
        return False, 'Password is too long'
    return True, ''


def _set_authenticated_session(user_row):
    # Rotate and rebuild session payload after authentication.
    session.clear()
    session.permanent = True
    session['user_id'] = int(user_row['userid'])
    session['email'] = str(user_row['email'])
    session['display_name'] = str(user_row['display_name'])
    session['is_admin'] = int(user_row['is_admin'])
    session['session_nonce'] = secrets.token_urlsafe(32)
    session['csrf_token'] = secrets.token_urlsafe(32)


@bp.route('/me', methods=['GET'])
def get_me():
    user = get_session_user()
    if not user:
        return jsonify({'authenticated': False, 'user': None})
    return jsonify({'authenticated': True, 'user': user})


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = _sanitize_email(data.get('email'))
    password = str(data.get('password') or '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    db = get_db()
    user = db.execute(
        'SELECT userid, email, password, is_admin, display_name FROM users WHERE email = ?',
        (email,),
    ).fetchone()

    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Either email or password is incorrect'}), 401

    _set_authenticated_session(user)
    return jsonify({'success': True, 'user': get_session_user()})


@bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    # Keep CSRF usable for guest forms after logout.
    session['csrf_token'] = secrets.token_urlsafe(32)
    return jsonify({'success': True})


@bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json(silent=True) or {}
    current_password = str(data.get('currentPassword') or '')
    new_password = str(data.get('newPassword') or '')
    new_password_confirm = str(data.get('newPasswordConfirm') or '')

    if not current_password or not new_password or not new_password_confirm:
        return jsonify({'error': 'Current and new passwords are required'}), 400

    ok, pw_error = _validate_password(new_password)
    if not ok:
        return jsonify({'error': pw_error}), 400
    if new_password != new_password_confirm:
        return jsonify({'error': 'New passwords do not match'}), 400
    if current_password == new_password:
        return jsonify({'error': 'New password must be different from current password'}), 400

    user_id = int(session.get('user_id'))
    db = get_db()
    user = db.execute(
        'SELECT userid, password FROM users WHERE userid = ?',
        (user_id,),
    ).fetchone()

    if not user:
        session.clear()
        session['csrf_token'] = secrets.token_urlsafe(32)
        return jsonify({'error': 'Authentication required'}), 401

    if not check_password_hash(user['password'], current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401

    new_hash = generate_password_hash(new_password, method='pbkdf2:sha256:600000')
    db.execute('UPDATE users SET password = ? WHERE userid = ?', (new_hash, user_id))
    db.commit()

    # Force re-authentication after sensitive credential change.
    session.clear()
    session['csrf_token'] = secrets.token_urlsafe(32)
    return jsonify({'success': True, 'message': 'Password changed. Please login again.'})


@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    email = _sanitize_email(data.get('email'))
    display_name = _sanitize_display_name(data.get('displayName'))
    password = str(data.get('password') or '')
    password_confirm = str(data.get('passwordConfirm') or '')

    if not email or not EMAIL_RE.fullmatch(email):
        return jsonify({'error': 'A valid email address is required'}), 400
    if not display_name:
        return jsonify({'error': 'Display name is required'}), 400

    ok, pw_error = _validate_password(password)
    if not ok:
        return jsonify({'error': pw_error}), 400
    if password != password_confirm:
        return jsonify({'error': 'Passwords do not match'}), 400

    password_hash = generate_password_hash(password, method='pbkdf2:sha256:600000')

    try:
        db = get_db()
        cur = db.execute(
            'INSERT INTO users (email, password, is_admin, display_name) VALUES (?, ?, ?, ?)',
            (email, password_hash, 0, display_name),
        )
        db.commit()
        user = db.execute(
            'SELECT userid, email, is_admin, display_name FROM users WHERE userid = ?',
            (cur.lastrowid,),
        ).fetchone()

        # Auto-login after successful registration with a fresh auth session.
        _set_authenticated_session(user)

        return jsonify({'success': True, 'user': get_session_user()}), 201
    except IntegrityError:
        return jsonify({'error': 'Email is already registered'}), 409
