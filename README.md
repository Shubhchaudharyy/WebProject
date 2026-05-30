# ShopVerse

A full-stack e-commerce website built with **HTML**, **CSS**, **JavaScript**, and **Node.js**.

Browse categories, search products, add to cart, checkout with Flipkart-style price details, user/admin login, and order management.

## Live Demo

Run the Node server locally, or deploy the frontend to GitHub Pages and the backend to a Node hosting service.

## Features

- Homepage with trending collections & carousel
- Category pages: Shoes, Fashion, Electronics, Books, Toys, Furniture
- Cart, billing, login (user & admin), orders & cancel order
- Temporary backend memory storage for users and orders
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

## Temporary Backend

The current Render-friendly backend does not connect to MySQL. It uses temporary in-memory users and orders so the site can run on free hosting without `localhost:3306`.

Install backend dependencies:

```bash
npm install
```

Start the site:

```bash
npm start
```

Then open `http://localhost:3000`.

Temporary storage resets whenever the Render service restarts or redeploys.

## GitHub Pages Setup

GitHub Pages cannot run Node.js. Keep GitHub Pages for the HTML/CSS/JS frontend, and deploy `server.js` to Render.

## Render Backend Setup

Add these Environment Variables in your Render Web Service:

```env
SESSION_SECRET=use-a-long-random-secret
CORS_ORIGIN=https://your-github-username.github.io,https://your-render-service.onrender.com
NODE_ENV=production
```

Render commands:

```bash
Build Command: npm install
Start Command: npm start
```

Check backend status at:

```text
https://your-render-service.onrender.com/api/health
```

If Render still shows "Application exited early", open the Render logs and look for:

```text
Startup config
ShopVerse running on port ...
MySQL disabled temporarily. Using in-memory users/orders.
```

If you do not see `ShopVerse running on port ...`, check that the Start Command is exactly `npm start` and that the service root points to this project folder.

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
database.sql        Old MySQL schema, not used by the temporary backend
products.js         Product catalog
billing.js          Price breakdown
ui.js               Shared UI
```

© 2026 ShopVerse
