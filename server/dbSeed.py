import sqlite3
from database import DB_PATH, init_db

init_db()

db = sqlite3.connect(DB_PATH)
db.execute('PRAGMA foreign_keys=ON')

try:
    with db:
        db.execute('DELETE FROM products')
        db.execute('DELETE FROM categories')
        db.execute("DELETE FROM sqlite_sequence WHERE name IN ('products', 'categories')")

        cats = {}
        for name in ('Sports', 'Muscle Car', 'Motorcycle'):
            cur = db.execute('INSERT INTO categories (name) VALUES (?)', (name,))
            cats[name] = cur.lastrowid

        products = [
            (cats['Sports'],     'PFISTER 811',                 1135220, 'High-performance supercar from Pfister.'),
            (cats['Sports'],     'Ocelot Pariah',               2100220, 'The fastest sports car at Legendary.'),
            (cats['Sports'],     'Grotti Itali GTO Stinger TT', 2380220, 'Italian luxury sports car — runs very fast.'),
            (cats['Muscle Car'], 'KARIN 190Z',                  1900220, 'Classic Japanese-inspired muscle car.'),
            (cats['Muscle Car'], 'Deviant',                      512000, 'Raw American muscle, aggressive styling.'),
            (cats['Motorcycle'], 'Shitzu Hakuchou Drag',        1900220, 'High-performance motorcycle, sleek design.'),
        ]

        for catid, name, price, description in products:
            cur = db.execute(
                'INSERT INTO products (catid, name, price, description, image) VALUES (?, ?, ?, ?, NULL)',
                (catid, name, price, description)
            )
            pid = cur.lastrowid
            db.execute('UPDATE products SET image = ? WHERE pid = ?', (str(pid), pid))

    print('Database seeded successfully')
finally:
    db.close()
