## Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS + custom CSS
- **Backend:** Python / Flask
- **Database:** SQLite

---

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Python 3](https://www.python.org/)

---

## First-Time Setup

### 1. Frontend dependencies

```bash
npm install
```

### 2. Python virtual environment

```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

---

## Launch

Run `start.bat` 

```bat
start.bat
```

This opens two windows:


Backend | http://localhost:3001 |
Frontend | http://localhost:5173 |

## Project Structure

```
├── server/
│   ├── app.py              Flask entry point
│   ├── database.py         SQLite connection + schema
│   ├── dbSeed.py           Seed categories and products
│   ├── utils.py            Image resizing (Pillow)
│   ├── requirements.txt    Python dependencies
│   └── routes/
│       ├── categories.py   /api/categories CRUD
│       └── products.py     /api/products CRUD
│
├── src/
│   ├── App.jsx             Root — router + cart context
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── HomePage.jsx    Product listing + category filter
│   │   ├── ProductPage.jsx Product detail
│   │   ├── ShoppingCart.jsx
│   │   └── admin/
│   │       ├── ProductManager.jsx
│   │       └── CategoryManager.jsx
│   └── index.css
│
├── styles/
│   └── main.css
│
└── start.bat               Launches both services
```
