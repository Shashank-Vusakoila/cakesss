# 🍵 Tea Time — Restaurant Digital Ordering System

> **Every Bite, A Story** | Ghatkesar, Hyderabad

A complete, production-ready digital restaurant ordering system built with Next.js 14, Firebase, Cloudinary, and Framer Motion.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your environment variables to .env.local (already configured)

# 3. Run development server
npm run dev

# 4. Open http://localhost:3000
```

---

## 📁 Pages

| URL | Description |
|-----|-------------|
| `/` | Landing page with hero, bestsellers, categories |
| `/menu` | Full menu with search, filters, cart |
| `/checkout` | Order form + payment method |
| `/order/[id]` | Live order tracking |
| `/table/[number]` | QR scan landing (auto-detects table) |
| `/login` | Admin login |
| `/admin/dashboard` | Admin overview + live stats |
| `/admin/orders` | Live order management |
| `/admin/menu` | Menu CRUD management |
| `/admin/analytics` | Charts & revenue analytics |
| `/admin/qr` | QR code generator (tables 1–30) |
| `/kitchen` | Kitchen Display System (KDS) |

---

## 🔥 Features

- **Real-time orders** via Firebase Firestore live subscriptions
- **QR table ordering** — scan /table/5 to auto-detect table
- **Cart system** with Zustand persistence
- **Admin dashboard** with live analytics (Recharts)
- **Kitchen Display** with urgency indicators
- **Cloudinary** image storage and optimization
- **Mobile responsive** — works on phones and tablets
- **SEO optimized** pages

---

## ⚙️ Environment Variables (.env.local)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADMIN_UID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 🗃️ Firestore Collections

- `menuItems` — food items
- `categories` — menu categories
- `orders` — customer orders (real-time)
- `tables` — table metadata

---

## 📱 First-time Admin Setup

1. Go to `/login`
2. Login with your Firebase admin email
3. Go to `/admin/menu` → Add categories first
4. Add menu items with images
5. Go to `/admin/qr` → Click "Seed Tables to DB" → Download QR codes
6. Print and place QR codes on tables!

---

## 🚀 Deploy to Vercel

```bash
vercel deploy
```

Add all environment variables in Vercel Dashboard → Settings → Environment Variables.

---

**Built for Bakes & Delights, Ghatkesar 🧁**
