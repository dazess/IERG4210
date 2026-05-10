from functools import wraps
from flask import jsonify, session


from database import get_db

def get_session_user():
    user_id = session.get('user_id')
    session_token = session.get('session_nonce')
    if not user_id or not session_token:
        return None
    db = get_db()
    if not db.execute('SELECT 1 FROM active_sessions WHERE session_id = ?', (session_token,)).fetchone():
        session.clear()
        return None
    return {
        'userid': user_id,
        'email': session.get('email', ''),
        'displayName': session.get('display_name', ''),
        'isAdmin': bool(session.get('is_admin', 0)),
    }


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not get_session_user():
            return jsonify({'error': 'Authentication required'}), 401
        return fn(*args, **kwargs)

    return wrapper


# Alias for consistency
auth_required = login_required


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = get_session_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        if not user['isAdmin']:
            return jsonify({'error': 'Admin privilege required'}), 403
        return fn(*args, **kwargs)

    return wrapper
