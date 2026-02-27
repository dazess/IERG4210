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

        db.executemany(
            'INSERT INTO products (catid, name, price, description, image) VALUES (?,?,?,?,?)',
            [
                (cats['Sports'],     'PFISTER 811',                 1135220, 'High-performance supercar from Pfister.',      '811A-GTAO-front.webp'),
                (cats['Sports'],     'Ocelot Pariah',               2100220, 'The fastest sports car at Legendary.',         'pariah.jpg.jpg'),
                (cats['Sports'],     'Grotti Itali GTO Stinger TT', 2380220, 'Italian luxury sports car — runs very fast.',  'StingerTT-GTAOe-front.png.jpg'),
                (cats['Muscle Car'], 'KARIN 190Z',                  1900220, 'Classic Japanese-inspired muscle car.',        '190z-GTAO-front.webp'),
                (cats['Muscle Car'], 'Deviant',                      512000, 'Raw American muscle, aggressive styling.',     'Deviant-GTAO-front.webp'),
                (cats['Motorcycle'], 'Shitzu Hakuchou Drag',        1900220, 'High-performance motorcycle, sleek design.',   'hakuchou-drag-GTAO-front.webp'),
            ]
        )

    print('Database seeded successfully')
finally:
    db.close()
