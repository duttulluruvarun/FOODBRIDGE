# 🍲 FoodBridge

FoodBridge is a platform designed to connect **Food Donors** (restaurants, individuals, event organizers) with **NGOs** and **Volunteers** to efficiently distribute surplus food and reduce food waste.

With a focus on speed, safety, and gamification, FoodBridge ensures that excess food reaches those in need before it expires, while rewarding contributors for their positive environmental impact.

---

## ✨ Features

- **Multi-Role System:** Secure sign-in for Donors, NGOs, Volunteers, and Admins.
- **Smart Matching & Allocations:** AI-assisted logic to match donations with NGO requests based on distance, quantity needed, and priority.
- **Volunteer Tracking:** Live dashboards for volunteers to pick up and deliver food.
- **Gamification & Reputation:** Points, badges, and rating systems to encourage consistent donations and volunteer activity.
- **Impact Tracking:** Real-time calculation of CO2 saved, total distance traveled, and completed deliveries.
- **Location Services:** Coordinate tracking and distance calculation for logistics optimization.

## 🛠 Tech Stack

**Frontend:**
- [Next.js 16](https://nextjs.org/) (React 19)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/) (State Management)
- [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) (Validation)
- [Leaflet](https://leafletjs.com/) (Maps & Location)
- [Framer Motion](https://www.framer.com/motion/) (Animations)

**Backend / Database:**
- [Prisma ORM](https://www.prisma.io/)
- SQLite (Development) / PostgreSQL (Production)
- Node.js

---

## 🚀 Getting Started (Local Development)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) and `npm` installed.

### 1. Clone the repository
```bash
git clone https://github.com/duttulluruvarun/FOODBRIDGE.git
cd FOODBRIDGE
```

### 2. Install Dependencies
Navigate into the frontend folder and install all required packages:
```bash
cd frontend
npm install
```

### 3. Database Setup
Navigate to the backend directory, install dependencies, and initialize the Prisma database:
```bash
cd ../backend
npm install
npx prisma generate
npx prisma migrate dev
```
*(Optional) You can also run the seed script to populate the database with test data if available.*

### 4. Environment Variables
Create a `.env` file in the `frontend` folder and set your variables (e.g., Database URL, NextAuth secret).

### 5. Run the Application
From the `frontend` folder, start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment

### Frontend (Next.js) -> Vercel
The easiest way to deploy the frontend is using [Vercel](https://vercel.com/):
1. Create a new project on Vercel and connect your GitHub repository.
2. Under **Root Directory**, click **Edit** and select the `frontend` folder.
3. Add your Environment Variables (like `DATABASE_URL` for production).
4. Click **Deploy**.

### Database -> Production
For production, you should migrate away from SQLite. We recommend setting up a free PostgreSQL database using [Supabase](https://supabase.com/) or [Neon](https://neon.tech/) and updating your `DATABASE_URL` in the environment variables.

---

## 📁 Project Structure

```text
FOODBRIDGE/
├── backend/
│   ├── prisma/             # Database schema, migrations, and seed files
│   ├── dev.db              # Local SQLite database
│   └── package.json        # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router (Pages & Layouts)
│   │   ├── components/     # Reusable UI components (shadcn/ui, maps, AI)
│   │   ├── lib/            # Utilities, algorithms, and services
│   │   └── store/          # Zustand state management
│   ├── public/             # Static assets (images, icons)
│   └── package.json        # Frontend dependencies
└── README.md
```

---
*Created to bridge the gap between food waste and food insecurity.*
