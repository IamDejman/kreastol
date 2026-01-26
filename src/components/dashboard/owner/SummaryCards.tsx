"use client";

import { useMemo } from "react";
import type { Booking } from "@/types";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { formatCurrency } from "@/lib/utils/formatters";

interface SummaryCardsProps {
  bookings: Booking[];
}

export function SummaryCards({ bookings }: SummaryCardsProps) {
  const stats = useMemo(() => {
    const revenue = bookings.reduce((s, b) => s + b.totalAmount, 0);
    const totalNights = bookings.reduce((s, b) => s + b.nights, 0);

    return {
      totalBookings: bookings.length,
      revenue,
      totalNights,
    };
  }, [bookings]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard title="Total bookings" value={stats.totalBookings} />
      <StatCard 
        title="Total Revenue" 
        value={formatCurrency(stats.revenue)}
        subtitle={`From ${stats.totalBookings} booking${stats.totalBookings !== 1 ? 's' : ''}`}
      />
      <StatCard title="Total nights" value={stats.totalNights} />
    </div>
  );
}
