import sqlite3
import os
from flask import g
from werkzeug.security import generate_password_hash

DB_PATH = 'database.db'

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute('PRAGMA foreign_keys = ON')
    return g.db

def init_db():
    db = sqlite3.connect(DB_PATH)
    db.executescript("""
        CREATE TABLE IF NOT EXISTS categories (
            catid INTEGER PRIMARY KEY AUTOINCREMENT,
            name  TEXT    NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS products (
            pid         INTEGER PRIMARY KEY AUTOINCREMENT,
            catid       INTEGER NOT NULL,
            name        TEXT    NOT NULL,
            price       REAL    NOT NULL CHECK(price >= 0),
            description TEXT    NOT NULL DEFAULT '',
            image       TEXT    DEFAULT NULL,
            FOREIGN KEY (catid) REFERENCES categories(catid) ON DELETE RESTRICT
        );

        CREATE TABLE IF NOT EXISTS users (
            userid       INTEGER PRIMARY KEY AUTOINCREMENT,
            email        TEXT    NOT NULL UNIQUE,
            password     TEXT    NOT NULL,
            is_admin     INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
            display_name TEXT    NOT NULL DEFAULT ''
        );
    """)

    admin_email = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@example.com')
    admin_password = os.environ.get('DEFAULT_ADMIN_PASSWORD', 'AdminPass!123')
    admin_name = os.environ.get('DEFAULT_ADMIN_NAME', 'Admin')

    user_email = os.environ.get('DEFAULT_USER_EMAIL', 'user@example.com')
    user_password = os.environ.get('DEFAULT_USER_PASSWORD', 'UserPass!123')
    user_name = os.environ.get('DEFAULT_USER_NAME', 'User')

    for email, raw_password, is_admin, display_name in (
        (admin_email, admin_password, 1, admin_name),
        (user_email, user_password, 0, user_name),
    ):
        existing = db.execute('SELECT userid FROM users WHERE email = ?', (email,)).fetchone()
        if existing:
            continue
        password_hash = generate_password_hash(raw_password, method='pbkdf2:sha256:600000')
        db.execute(
            'INSERT INTO users (email, password, is_admin, display_name) VALUES (?, ?, ?, ?)',
            (email, password_hash, is_admin, display_name)
        )

    db.commit()
    db.close()

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()
