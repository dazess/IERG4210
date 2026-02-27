import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, send_from_directory
from flask_cors import CORS
from database import init_db, close_db

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
app.secret_key = os.environ.get('SECRET_KEY')
CORS(app)

app.teardown_appcontext(close_db)

from routes.categories import bp as categories_bp
from routes.products import bp as products_bp
app.register_blueprint(categories_bp)
app.register_blueprint(products_bp)

DIST_DIR = os.path.join(os.path.dirname(__file__), '..', 'dist')

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

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
    app.run(host='0.0.0.0', port=80, debug=False)
