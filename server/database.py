import sqlite3
from flask import g

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
    """)
    db.commit()
    db.close()

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()
