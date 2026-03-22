from functools import wraps
from flask import jsonify, session


def get_session_user():
    user_id = session.get('user_id')
    if not user_id:
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
        if not session.get('user_id'):
            return jsonify({'error': 'Authentication required'}), 401
        return fn(*args, **kwargs)

    return wrapper


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({'error': 'Authentication required'}), 401
        if not bool(session.get('is_admin', 0)):
            return jsonify({'error': 'Admin privilege required'}), 403
        return fn(*args, **kwargs)

    return wrapper
