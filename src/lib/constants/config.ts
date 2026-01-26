import type { User } from "@/types";

export const HOTEL_INFO = {
  name: "Kreastol Luxury Suite",
  tagline: "Guests will enjoy a serene environment during their stay.",
  contact: {
    phone: "+234 XXX XXX XXXX",
    email: "info@kreastol.com",
    whatsapp: "+234 XXX XXX XXXX",
    address: "Lagos, Nigeria",
  },
  amenities: [
    { icon: "Wifi", name: "Free WiFi" },
    { icon: "UtensilsCrossed", name: "Restaurant" },
    { icon: "Wine", name: "Bar/Lounge" },
    { icon: "Shirt", name: "Laundry Service" },
    { icon: "ConciergeBell", name: "Room Service" },
    { icon: "AirVent", name: "Air Conditioning" },
  ],
  policies: {
    checkInTime: "2:00 PM",
    checkOutTime: "12:00 PM",
    idRequired: "Valid ID Card required",
    childrenAllowed: true,
    petsAllowed: false,
    cancellationDays: 2,
    cancellationPolicy:
      "Free cancellation up to 2 days before arrival, 100% charge within 2 days",
  },
} as const;

export const ROOM_CONFIG = {
  rooms: [
    { number: 1, rate: 30000, name: "Room 1", description: "Deluxe Suite" },
    { number: 2, rate: 25000, name: "Room 2", description: "Standard Suite" },
    { number: 3, rate: 25000, name: "Room 3", description: "Standard Suite" },
    { number: 4, rate: 25000, name: "Room 4", description: "Standard Suite" },
  ],
  totalRooms: 4,
} as const;

export const POLLING_INTERVALS = {
  paymentStatus: 5000,
  calendarSync: 2000,
  dashboardBookings: 3000,
  dashboardStats: 5000,
} as const;

export const PAYMENT_CONFIG = {
  autoConfirmDelay: 20000,
  mockBankDetails: {
    bankName: "Rubies MFB",
    accountName: "Kreastol Luxury Suite Limited",
    accountNumber: "1234567890",
  },
} as const;

export const STORAGE_KEYS = {
  bookings: "kreastol_bookings",
  users: "kreastol_users",
  currentUser: "kreastol_current_user",
} as const;

export const DEFAULT_USERS: User[] = [
  {
    id: 1,
    name: "Admin Owner",
    email: "owner@kreastol.com",
    password: "owner123",
    role: "owner",
  },
  {
    id: 2,
    name: "Front Desk",
    email: "desk@kreastol.com",
    password: "desk123",
    role: "receptionist",
  },
];

export const MOBILE_CONFIG = {
  minTapTarget: 44,
  bottomNavHeight: 64,
  headerHeight: {
    mobile: 56,
    desktop: 72,
  },
  drawerMaxHeight: "85vh",
  modalMaxHeight: "90vh",
} as const;

export const COLORS = {
  primary: "#1E3A8A",
  secondary: "#D97706",
  success: "#059669",
  warning: "#F59E0B",
  danger: "#DC2626",
  neutral: "#6B7280",
  background: "#F9FAFB",
  white: "#FFFFFF",
} as const;
