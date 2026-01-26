"use client";

import {
  Wifi,
  UtensilsCrossed,
  Wine,
  Shirt,
  ConciergeBell,
  AirVent,
} from "lucide-react";
import { HOTEL_INFO } from "@/lib/constants/config";

const iconMap = {
  Wifi,
  UtensilsCrossed,
  Wine,
  Shirt,
  ConciergeBell,
  AirVent,
} as const;

export function AmenitiesSection() {
  return (
    <section id="amenities" className="bg-white px-4 py-12 md:py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-heading text-2xl font-semibold text-primary md:text-3xl">
          Amenities
        </h2>
        <p className="mt-2 text-gray-600">
          Everything you need for a comfortable stay.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOTEL_INFO.amenities.map((a) => {
            const Icon = iconMap[a.icon as keyof typeof iconMap] ?? Wifi;
            return (
              <div
                key={a.name}
                className="flex items-center gap-4 rounded-xl border bg-gray-50/50 p-4"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="font-medium text-foreground">{a.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
