# ADUN Lost & Found

A lost and found marketplace for ADUN students. Built with Express and EJS.

## Prerequisites

- **Node.js** (v18 or later) — [https://nodejs.org/](https://nodejs.org/)
- **Git** — [https://git-scm.com/](https://git-scm.com/)

## Setup

### 1. Install Git

**Windows:** Download the installer from [git-scm.com](https://git-scm.com/) and run it. Use the default settings.

**macOS:** Run `xcode-select --install` or download from [git-scm.com](https://git-scm.com/).

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git
```

### 2. Clone the repository

Open a terminal and run:

```bash
git clone https://github.com/tobibamidele/adun-sen-112.git
cd adun-sen-112
```

### 3. Install dependencies

```bash
npm install
```

This installs Express, EJS, SQLite3, Multer, method-override, cookie-parser, and all other required packages.

### 4. Start the server

```bash
node app.js
```

The server starts on `http://localhost:3000`. Open that URL in your browser.

### 5. (Optional) Development with auto-restart

Install nodemon globally for automatic server restarts when you edit files:

```bash
npm install -g nodemon
nodemon app.js
```

## Default Database

The project uses SQLite. A pre-seeded database (`adun-lost-and-found.db`) is included with sample data. If you delete it, a fresh empty database is created automatically on first run.

## Project Structure

```
adun-lost-and-found/
  app.js                 Entry point
  db.js                  Database setup
  views/                 EJS templates
    partials/            Shared layout (head, nav, footer)
    index.ejs            Browse products
    product.ejs          Product detail
    cart.ejs             Shopping cart
    checkout.ejs         Checkout
    orders.ejs           Order history
    seller.ejs           Seller dashboard
    login.ejs            Login form
    register.ejs         Registration form
  routes/
    pages.js             Page rendering routes
    auth.js              Registration, login, logout
    orders.js            Checkout and order creation
    seller.js            Seller product CRUD
    public.js            JSON endpoints for product data
  middleware/
    loadUser.js          Attaches user info to every request
    requireAuth.js       Redirects to login if unauthenticated
    requireSeller.js     Redirects if not a seller account
  public/
    css/style.css        Stylesheet
    js/app.js            Client-side cart helpers
  uploads/               Product images
```
