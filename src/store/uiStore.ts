import { create } from "zustand";

interface UIStore {
  isBookingModalOpen: boolean;
  isCheckStatusModalOpen: boolean;
  isMobileMenuOpen: boolean;
  activeDrawer: string | null;
  openBookingModal: () => void;
  closeBookingModal: () => void;
  openCheckStatusModal: () => void;
  closeCheckStatusModal: () => void;
  toggleMobileMenu: () => void;
  openDrawer: (drawer: string) => void;
  closeDrawer: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isBookingModalOpen: false,
  isCheckStatusModalOpen: false,
  isMobileMenuOpen: false,
  activeDrawer: null,

  openBookingModal: () => set({ isBookingModalOpen: true }),
  closeBookingModal: () => set({ isBookingModalOpen: false }),
  openCheckStatusModal: () => set({ isCheckStatusModalOpen: true }),
  closeCheckStatusModal: () => set({ isCheckStatusModalOpen: false }),
  toggleMobileMenu: () =>
    set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  openDrawer: (drawer) => set({ activeDrawer: drawer }),
  closeDrawer: () => set({ activeDrawer: null }),
}));
