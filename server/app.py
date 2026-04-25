import os
import hmac
import secrets
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(BASE_DIR, '.env'))
load_dotenv(os.path.join(BASE_DIR, '..', '.env'))

from flask import Flask, jsonify, send_from_directory, request, session
from flask_cors import CORS
from database import init_db, close_db
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.debug = False  # Never expose tracebacks to users; dev mode uses app.run() debug flag
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
app.secret_key = os.environ.get('SECRET_KEY')
app.config['SESSION_COOKIE_NAME'] = 'auth_token'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Strict'
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('COOKIE_SECURE', '1') == '1'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=2)
app.config['SESSION_REFRESH_EACH_REQUEST'] = False
CORS(app)

app.teardown_appcontext(close_db)

from routes.categories import bp as categories_bp
from routes.products import bp as products_bp
from routes.auth import bp as auth_bp
from routes.checkout import bp as checkout_bp
from routes.orders import bp as orders_bp
app.register_blueprint(categories_bp)
app.register_blueprint(products_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(checkout_bp)
app.register_blueprint(orders_bp)

DIST_DIR = os.path.join(os.path.dirname(__file__), '..', 'dist')

HTML_CSP = '; '.join([
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.stripe.com",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://r.stripe.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "form-action 'self' https://checkout.stripe.com",
])

NON_HTML_CSP = '; '.join([
    "default-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
])


def _generate_csrf_token():
    token = session.get('csrf_token')
    if not token:
        token = secrets.token_urlsafe(32)
        session['csrf_token'] = token
    return token


def _extract_csrf_token_from_request():
    header_token = request.headers.get('X-CSRF-Token')
    if header_token:
        return header_token

    if request.content_type and request.content_type.startswith('multipart/form-data'):
        return request.form.get('csrf_token')

    if request.content_type and request.content_type.startswith('application/json'):
        data = request.get_json(silent=True) or {}
        return data.get('csrf_token')

    return request.form.get('csrf_token')


@app.before_request
def enforce_csrf_protection():
    if request.method in ('GET', 'HEAD', 'OPTIONS', 'TRACE'):
        return None
    if not request.path.startswith('/api/'):
        return None
    if request.path == '/api/csrf-token':
        return None
    if request.path == '/api/checkout/webhook':
        return None

    session_token = session.get('csrf_token')
    request_token = _extract_csrf_token_from_request()

    if not session_token or not request_token:
        return jsonify({'error': 'CSRF token is missing'}), 403
    if not hmac.compare_digest(str(session_token), str(request_token)):
        return jsonify({'error': 'Invalid CSRF token'}), 403

    return None


@app.route('/api/csrf-token', methods=['GET'])
def get_csrf_token():
    token = _generate_csrf_token()
    return jsonify({'csrfToken': token})

@app.after_request
def set_security_headers(response):
    response.headers['Server'] = 'webserver'
    response.headers.pop('X-Powered-By', None)

    # Apply strict browser hardening headers globally.
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), camera=(), microphone=()'
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    response.headers['Cross-Origin-Resource-Policy'] = 'same-origin'

    # Context-dependent CSP: documents vs API/static responses.
    if response.mimetype == 'text/html':
        response.headers['Content-Security-Policy'] = HTML_CSP
    else:
        response.headers['Content-Security-Policy'] = NON_HTML_CSP

    return response

@app.errorhandler(400)
def bad_request(e):
    return jsonify({'error': 'Bad request'}), 400

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(DIST_DIR, 'index.html'), 200

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    safe_name = secure_filename(filename)
    if safe_name != filename:
        return jsonify({'error': 'File not found'}), 404
    return send_from_directory(app.config['UPLOAD_FOLDER'], safe_name)

# Catch-all: serve React SPA — must be last
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    full = os.path.join(DIST_DIR, path)
    if path and os.path.exists(full):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')

if __name__ == '__main__':
    with app.app_context():
        init_db()
    port = int(os.environ.get('FLASK_PORT', 3001))
    debug = os.environ.get('FLASK_DEBUG', '0') == '1'
    app.run(host='0.0.0.0', port=port, debug=debug)
