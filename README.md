## Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS + custom CSS
- **Backend:** Python / Flask / gunicorn
- **Database:** SQLite

---

## For assignment submission

- DB file and gunicorn config in /server

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Python 3](https://www.python.org/)

---

## First-Time Setup

### 1. Frontend dependencies

```bash
npm install
```

### 2. Python virtual environment (Windows)

```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```
Copy .env.example to .env and edit as needed

### 3. Seeding the database 

```bash
cd server
python dbSeed.py
```

---

## Launch

Run `start.bat` 

```bat
start.bat
```

This opens two windows:

Backend | http://localhost:3001 
Frontend | http://localhost:5173 

## Authentication

Admin/Auth access

- `GET /api/auth/me`: returns current authentication state
- `POST /api/auth/login`: login with email/password
- `POST /api/auth/register`: register a normal user
- `POST /api/auth/logout`: logout current user
- `POST /api/auth/change-password`: verify current password, update hash, and force logout

`/admin` is restricted to users with admin privilege.

### Default seeded accounts

If these users do not already exist, they are created automatically during DB seed:

- Admin: `admin@example.com` / `AdminPass!123`
- Normal user: `user@example.com` / `UserPass!123`

You can override these defaults using environment variables:

- `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_NAME`
- `DEFAULT_USER_EMAIL`, `DEFAULT_USER_PASSWORD`, `DEFAULT_USER_NAME`
- Auth cookie name is `auth_token` with `HttpOnly`, `Secure`, and `SameSite=Strict`
- Auth cookie is persistent for 2 days (expires in < 3 days)
- `COOKIE_SECURE=0` can be used only for non-HTTPS local development

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
