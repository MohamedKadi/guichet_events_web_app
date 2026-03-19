# EvenTick — Event Ticketing Platform

A full-stack event ticketing web application for Morocco. Users can browse events, buy tickets via Stripe, receive QR code tickets by email, and check in at the door via QR scan. Admins manage events and validate tickets through a dedicated dashboard.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Running with Docker (recommended)](#running-with-docker-recommended)
- [Running Locally (without Docker)](#running-locally-without-docker)
- [Database](#database)
- [Seeding](#seeding)
- [Admin Access](#admin-access)
- [Stripe Payments](#stripe-payments)
- [Email (SMTP)](#email-smtp)
- [API Reference](#api-reference)
- [Pages & Routes](#pages--routes)
- [Ticket Flow](#ticket-flow)
- [Production Deployment (Hostinger VPS)](#production-deployment-hostinger-vps)

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 18, Vite, React Router v6         |
| Backend  | Node.js, Express.js                     |
| Database | PostgreSQL 15                           |
| Auth     | JWT (jsonwebtoken), bcryptjs            |
| Payments | Stripe Checkout                         |
| Email    | Nodemailer (SMTP)                       |
| QR Code  | qrcode (generation), jsQR (scanning)   |
| Infra    | Docker, Docker Compose, Nginx           |

---

## Project Structure

```
guichet_events_web_app/
├── docker-compose.yml
├── .env                        # Environment variables (create this)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # App entry, DB init, server start
│       ├── db.js               # PostgreSQL pool singleton
│       ├── seed.js             # Database seeder
│       ├── middleware/
│       │   ├── authMiddleware.js     # JWT auth (required + optional)
│       │   └── adminMiddleware.js    # Admin-only JWT guard
│       ├── routes/
│       │   ├── auth.js         # /api/auth
│       │   ├── events.js       # /api/events
│       │   ├── categories.js   # /api/categories
│       │   ├── vibes.js        # /api/vibes
│       │   ├── users.js        # /api/users
│       │   ├── payments.js     # /api/payments (Stripe)
│       │   ├── newsletter.js   # /api/newsletter
│       │   └── admin.js        # /api/admin
│       └── utils/
│           └── email.js        # Nodemailer ticket email sender
└── frontend/
    ├── Dockerfile
    ├── index.html
    ├── vite.config.js
    ├── public/
    │   └── logo.png            # EvenTick logo (static asset)
    └── src/
        ├── main.jsx
        ├── App.jsx             # Route definitions
        ├── index.css           # Global CSS variables & base styles
        ├── context/
        │   ├── AuthContext.jsx       # User auth state
        │   └── AdminAuthContext.jsx  # Admin auth state
        ├── services/
        │   └── api.js          # Axios instance (auto-injects Bearer token)
        ├── components/
        │   ├── Header.jsx / Header.css
        │   └── EventCard.jsx / EventCard.css
        └── pages/
            ├── Home.jsx              # Landing page with carousels
            ├── BrowsePage.jsx        # /events — full filter page
            ├── CategoryPage.jsx      # /category/:slug
            ├── VibePage.jsx          # /vibe/:slug
            ├── EventDetail.jsx       # /events/:id
            ├── Favorites.jsx         # /favorites
            ├── Login.jsx             # /login
            ├── Register.jsx          # /register
            ├── PaymentSuccess.jsx    # /payment/success
            ├── PaymentCancel.jsx     # /payment/cancel
            └── admin/
                ├── AdminLogin.jsx    # /admin/login
                └── AdminDashboard.jsx # /admin/dashboard
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- OR: Node.js 18+, PostgreSQL 15+

---

## Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL
POSTGRES_USER=guichet
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=guichet_events

# JWT
JWT_SECRET=your_long_random_secret_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=mad

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_email_password
SMTP_FROM=EvenTick <your@email.com>

# App URL (used in email links)
FRONTEND_URL=http://localhost:3000

# Seeding (true = seed demo data on startup, false = empty DB)
SEED_DB=true
```

> For Gmail SMTP, use an [App Password](https://myaccount.google.com/apppasswords) — not your regular password.

---

## Running with Docker (recommended)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/eventick.git
cd eventick

# Create your .env file (see above)
cp .env.example .env   # then edit .env

# Build and start all services
docker compose up --build

# Or run in background
docker compose up -d --build
```

Services will be available at:

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:5000/api    |
| Database | localhost:5432               |

### Common Docker commands

```bash
# Stop all services
docker compose down

# View backend logs
docker compose logs -f backend

# View frontend logs
docker compose logs -f frontend

# Restart only the backend
docker compose restart backend

# Run a command inside the backend container
docker compose exec backend npm run seed

# Wipe the database volume (full reset)
docker compose down -v
```

---

## Running Locally (without Docker)

You need a running PostgreSQL instance. Set `DATABASE_URL` in `backend/.env`.

```bash
# Backend
cd backend
cp .env.example .env    # edit with your DB credentials
npm install
npm run dev             # starts on port 5000 with nodemon

# Frontend (separate terminal)
cd frontend
npm install
npm run dev             # starts on port 3000
```

---

## Database

Tables are created automatically on startup via `CREATE TABLE IF NOT EXISTS` in `backend/src/index.js`. You never need to run migrations manually.

### Schema

| Table                  | Description                                      |
|------------------------|--------------------------------------------------|
| `users`                | Registered users with hashed passwords          |
| `admins`               | Admin accounts with hashed passwords            |
| `categories`           | Event categories (concerts, sport, etc.)        |
| `vibes`                | Event vibes/moods (party, chill, romance, etc.) |
| `events`               | All events with category/vibe FK                |
| `bookings`             | Ticket purchases with QR token and status       |
| `user_favorites`       | User → Event favorites (localStorage-backed)   |
| `user_clicks`          | Click tracking for trending/recommended logic  |
| `newsletter_subscribers` | Email newsletter signups                     |

---

## Seeding

Seeding is controlled by the `SEED_DB` environment variable:

| Value         | Behavior                                            |
|---------------|-----------------------------------------------------|
| `true`        | Seeds categories, vibes, 12 demo events on startup  |
| `false`       | Skips all demo data — DB starts empty               |

The **admin account** is always created regardless of `SEED_DB` (if it doesn't exist yet).

To manually trigger seeding at any time:

```bash
docker compose exec backend npm run seed
```

To fully reset the DB and reseed:

```bash
docker compose down -v       # removes the postgres volume
docker compose up -d --build # rebuilds and reseeds
```

---

## Admin Access

Default admin credentials (created automatically on first startup):

| Field    | Value             |
|----------|-------------------|
| Email    | admin@guichet.ma  |
| Password | Admin@2026!       |

> Change these in `seed.js` before deploying to production.

Admin dashboard is accessible at `/admin/login` — the link appears in the header when no user is logged in.

### Admin features

- **Add Event** — Create events with all required fields (title, description, category, vibe, city, venue, date, price, image URL, organizer, ticket count)
- **Scan QR Ticket** — Upload a QR code image to verify and check in attendees

---

## Stripe Payments

The app uses Stripe Checkout (hosted payment page).

### Setup

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Add them to `.env`

### Local webhook testing

Stripe webhooks don't reach localhost by default. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe login
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Copy the webhook signing secret it prints and set it as `STRIPE_WEBHOOK_SECRET` in `.env`.

> The app also has a `/api/payments/verify/:sessionId` fallback endpoint that sends the ticket email when the webhook doesn't fire (useful during local development).

### Production webhook

In the Stripe Dashboard, add a webhook endpoint pointing to:
```
https://yourdomain.com/api/payments/webhook
```

Events to listen for: `checkout.session.completed`

---

## Email (SMTP)

Ticket confirmation emails are sent after successful payment. They include:
- Event name, date, venue, city
- Ticket quantity and amount paid
- QR code image (embedded)
- Booking reference

Configure your SMTP credentials in `.env`. Works with any SMTP provider (Gmail, Hostinger mail, SendGrid, Mailgun, etc.).

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint    | Auth     | Description         |
|--------|-------------|----------|---------------------|
| POST   | `/register` | None     | Create user account |
| POST   | `/login`    | None     | Login, returns JWT  |

### Events — `/api/events`

| Method | Endpoint          | Auth     | Description                         |
|--------|-------------------|----------|-------------------------------------|
| GET    | `/`               | Optional | List events (supports filters)      |
| GET    | `/featured`       | None     | Featured events                     |
| GET    | `/trending`       | None     | Trending events (by click count)    |
| GET    | `/recommended`    | None     | Recommended events                  |
| GET    | `/:id`            | None     | Single event (increments click count)|

**Query params for `GET /api/events`:**
`?category=slug&city=&vibe=slug&time=today|week|weekend|month&search=&min_price=&max_price=`

### Users — `/api/users`

| Method | Endpoint     | Auth     | Description              |
|--------|--------------|----------|--------------------------|
| GET    | `/me`        | Required | Get current user profile |
| PUT    | `/me`        | Required | Update profile           |
| GET    | `/favorites` | Required | Get favorited events     |
| POST   | `/favorites` | Required | Add favorite             |
| DELETE | `/favorites/:id` | Required | Remove favorite      |

### Payments — `/api/payments`

| Method | Endpoint                   | Auth | Description                          |
|--------|----------------------------|------|--------------------------------------|
| POST   | `/create-checkout`         | None | Create Stripe Checkout session       |
| GET    | `/verify/:sessionId`       | None | Verify payment + send ticket email   |
| POST   | `/webhook`                 | None | Stripe webhook (raw body)            |

### Admin — `/api/admin`

| Method | Endpoint                    | Auth  | Description                        |
|--------|-----------------------------|-------|------------------------------------|
| POST   | `/login`                    | None  | Admin login, returns JWT           |
| GET    | `/me`                       | Admin | Get admin profile                  |
| POST   | `/events`                   | Admin | Create new event                   |
| GET    | `/categories`               | Admin | List all categories                |
| GET    | `/vibes`                    | Admin | List all vibes                     |
| GET    | `/verify-ticket/:token`     | Admin | Scan & validate QR ticket          |

---

## Pages & Routes

| Path                  | Component         | Description                              |
|-----------------------|-------------------|------------------------------------------|
| `/`                   | Home              | Hero, featured carousel, trending, recommended |
| `/events`             | BrowsePage        | All events with search, filters, price range |
| `/category/:slug`     | CategoryPage      | Events filtered by category             |
| `/vibe/:slug`         | VibePage          | Events filtered by vibe/mood            |
| `/events/:id`         | EventDetail       | Event detail + ticket purchase form     |
| `/favorites`          | Favorites         | Saved events (localStorage + API)       |
| `/login`              | Login             | User sign in                            |
| `/register`           | Register          | User sign up                            |
| `/payment/success`    | PaymentSuccess    | Post-payment confirmation               |
| `/payment/cancel`     | PaymentCancel     | Cancelled payment                       |
| `/admin/login`        | AdminLogin        | Admin sign in                           |
| `/admin/dashboard`    | AdminDashboard    | Add events + QR ticket scanner          |

---

## Ticket Flow

```
User buys ticket
      │
      ▼
Stripe Checkout session created → status: pending
      │
      ▼
Payment completed (Stripe webhook OR verify endpoint)
      │
      ▼
status: paid  ←── QR code email sent to buyer
      │
      ▼
Admin scans QR at event entrance
      │
      ▼
status: confirmed  ←── Ticket is valid, entry granted
      │
      ▼
Admin scans same QR again
      │
      ▼
status: invalid  ←── Ticket already used, entry denied
```

---

## Production Deployment (Hostinger VPS)

### 1. Buy a VPS

Get a **KVM 2** plan (2GB RAM minimum) on Hostinger. Choose Ubuntu 22.04.

### 2. SSH into your server

```bash
ssh root@YOUR_VPS_IP
```

### 3. Install Docker

```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin git nginx
```

### 4. Upload your project

```bash
# From your local machine
scp -r /path/to/guichet_events_web_app root@YOUR_VPS_IP:/app/eventick

# Or clone from GitHub
git clone https://github.com/YOUR_USERNAME/eventick.git /app/eventick
```

### 5. Create production `.env`

```bash
cd /app/eventick
nano .env
```

Use your real domain, strong secrets, live Stripe keys, and set `SEED_DB=false`.

### 6. Configure Nginx reverse proxy

```bash
nano /etc/nginx/sites-available/eventick
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/eventick /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 7. Add SSL (free)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 8. Start the app

```bash
cd /app/eventick
docker compose up -d --build
```

### 9. Create admin account on production

Since `SEED_DB=false`, run the seeder once to create only the admin:

```bash
docker compose exec backend npm run seed
```

### 10. Point DNS to your VPS

In your domain registrar (or Hostinger DNS Zone):

| Type | Name  | Value        |
|------|-------|--------------|
| A    | `@`   | YOUR_VPS_IP  |
| A    | `www` | YOUR_VPS_IP  |

### Useful production commands

```bash
# View live logs
docker compose logs -f

# Restart backend after code changes
docker compose restart backend

# Pull latest code and rebuild
git pull && docker compose up -d --build

# Check container status
docker compose ps
```
