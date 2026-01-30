"use client";

import { Suspense } from "react";
import { BookPageContent } from "@/components/booking/BookPageContent";

export default function StaffBookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <BookPageContent basePath="/staff" />
    </Suspense>
  );
}
