# No13teen – Mobile-First Booking System

A modern, mobile-first hotel booking management system built with Next.js, TypeScript, and Tailwind CSS for **No13teen**, a 4-room luxury hotel in Nigeria.

## Features

- **Mobile-First Design** – Optimized for smartphones, tablets, and desktops
- **Touch-Optimized** – Large tap targets (min 44px) and swipe-friendly layouts
- **Real-Time Updates** – Auto-sync for calendar and dashboards; polling pauses when tab is hidden
- **Automated Payments** – Mock payment confirms automatically after 20 seconds
- **Role-Based Access** – Separate dashboards for staff (receptionist) and owners
- **Revenue Analytics** – Overview, bookings table, and revenue chart with CSV export

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Package manager:** npm

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Room Rates

- **Room 1:** ₦30,000/night (Deluxe Suite)
- **Rooms 2–4:** ₦25,000/night (Standard Suite)

## Mobile Features

- Bottom navigation (Home, My Bookings, Policies, Contact)
- Swipeable room tabs on calendar
- Bottom drawer for booking flow on small screens
- Pull-to-refresh–style updates via visibility-aware polling
- iOS safe-area support

## Project Structure

```
src/
├── app/              # Next.js pages and routes
├── components/       # React components (UI, layout, booking, dashboard)
├── store/            # Zustand state (auth, booking, UI, toast)
├── hooks/            # Custom React hooks
├── lib/              # Services, utils, constants
└── types/            # TypeScript types
```

## License

Proprietary – No13teen
