"use client";

import { useUIStore } from "@/store/uiStore";
import { CheckBookingModal } from "@/components/booking/CheckBookingModal";

export function GlobalModals() {
  const isCheckOpen = useUIStore((s) => s.isCheckStatusModalOpen);
  const closeCheck = useUIStore((s) => s.closeCheckStatusModal);

  return <CheckBookingModal isOpen={isCheckOpen} onClose={closeCheck} />;
}
