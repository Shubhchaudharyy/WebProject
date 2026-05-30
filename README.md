# ShopVerse

A full-stack e-commerce website built with **HTML**, **CSS**, **JavaScript**, **Node.js**, and **MySQL**.

Browse categories, search products, add to cart, checkout with Flipkart-style price details, user/admin login, and order management.

## Live Demo

Run the Node server locally, or deploy the frontend to GitHub Pages and the backend to a Node hosting service.

## Features

- Homepage with trending collections & carousel
- Category pages: Shoes, Fashion, Electronics, Books, Toys, Furniture
- Cart, billing, login (user & admin), orders & cancel order
- MySQL database for users and orders
- Responsive layout for desktop

## Designed By

**Shubh Madhyan**

## Team Credits

| Area | Contributor |
|------|-------------|
| Homepage UI & categories | Shubh Madhyan |
| Search (JavaScript) | Shubh Madhyan |
| CSS styling | Vishal Maithani |

## Demo Login

- **Customer:** `user@shopverse.com` / `user123`
- **Admin:** `admin@shopverse.com` / `admin123`

## MySQL Setup

1. Install MySQL and create the tables:

```sql
SOURCE database.sql;
```

Or open `database.sql` in MySQL Workbench and run it.

2. Create `.env` from `.env.example` and update your MySQL username/password.

3. Install backend dependencies:

```bash
npm install
```

4. Start the site:

```bash
npm start
```

Then open `http://localhost:3000`.

## GitHub Pages Setup

GitHub Pages cannot run Node.js or MySQL. Keep GitHub Pages for the HTML/CSS/JS frontend, and deploy `server.js` to a Node host such as Render, Railway, or VPS hosting with MySQL.

## Render Backend Setup

Render does not provide a local MySQL server at `localhost`. Create an online MySQL database first, then add these Environment Variables in your Render Web Service:

```env
MYSQL_HOST=your-online-mysql-host
MYSQL_PORT=3306
MYSQL_USER=your-online-mysql-user
MYSQL_PASSWORD=your-online-mysql-password
MYSQL_DATABASE=shopverse
SESSION_SECRET=use-a-long-random-secret
CORS_ORIGIN=https://your-github-username.github.io,https://your-render-service.onrender.com
NODE_ENV=production
MYSQL_SSL=false
MYSQL_SSL_REJECT_UNAUTHORIZED=false
MYSQL_CONNECT_TIMEOUT_MS=10000
```

If your MySQL provider requires SSL, set:

```env
MYSQL_SSL=true
MYSQL_SSL_REJECT_UNAUTHORIZED=false
```

Render commands:

```bash
Build Command: npm install
Start Command: npm start
```

The backend now starts even if MySQL is temporarily unavailable. Check database status at:

```text
https://your-render-service.onrender.com/api/health
```

If Render still shows "Application exited early", open the Render logs and look for:

```text
Startup config
ShopVerse running on port ...
Checking MySQL connection...
MySQL is not ready yet
```

If you do not see `ShopVerse running on port ...`, the crash is before database login. Check that the Start Command is exactly `npm start` and that the service root points to this project folder.

After deploying the backend, update `api-config.js`:

```js
window.SHOPVERSE_API_URL = "https://your-real-backend-url.com";
```

## Project Structure

```
index.html          Homepage
login.html          Login / Register
checkout.html       Checkout & billing
orders.html         Your orders
admin.html          Admin panel
shoes.html, ...     Category pages
style.css           Styles
script.js           Cart
auth.js             Authentication
api.js              API requests
server.js           Node/Express backend
database.sql        MySQL schema
products.js         Product catalog
billing.js          Price breakdown
ui.js               Shared UI
```

© 2026 ShopVerse
