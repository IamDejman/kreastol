"use client";

import { HOTEL_INFO } from "@/lib/constants/config";

export function PoliciesSection() {
  const { policies } = HOTEL_INFO;
  return (
    <section id="policies" className="border-t bg-gray-50 px-4 py-12 md:py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-heading text-2xl font-semibold text-primary md:text-3xl">
          Policies
        </h2>
        <div className="mt-6 space-y-6 rounded-xl bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-gray-500">
              Check-in / Check-out
            </h3>
            <p className="mt-1 text-foreground">
              Check-in: {policies.checkInTime} · Check-out:{" "}
              {policies.checkOutTime}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">ID Required</h3>
            <p className="mt-1 text-foreground">{policies.idRequired}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">
              Cancellation
            </h3>
            <p className="mt-1 text-foreground">
              {policies.cancellationPolicy}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
