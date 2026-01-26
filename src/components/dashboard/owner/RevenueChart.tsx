"use client";

import { useMemo } from "react";
import type { Booking } from "@/types";
import { format, subMonths } from "date-fns";
import { formatCurrency } from "@/lib/utils/formatters";

interface RevenueChartProps {
  bookings: Booking[];
}

export function RevenueChart({ bookings }: RevenueChartProps) {
  const data = useMemo(() => {
    const months: { label: string; revenue: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "yyyy-MM");
      const rev = bookings
        .filter((b) => b.paymentDate && b.paymentDate.startsWith(key))
        .reduce((s, b) => s + b.totalAmount, 0);
      months.push({
        label: format(d, "MMM yyyy"),
        revenue: rev,
      });
    }

    const max = Math.max(...months.map((m) => m.revenue), 1);

    return months.map((m) => ({
      ...m,
      height: (m.revenue / max) * 100,
    }));
  }, [bookings]);

  const totalRevenue = data.reduce((sum, m) => sum + m.revenue, 0);

  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="mb-4">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Monthly Revenue Breakdown
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Last 6 months • Total: {formatCurrency(totalRevenue)}
        </p>
      </div>
      <div className="mt-6 flex items-end justify-between gap-2">
        {data.map((m) => (
          <div key={m.label} className="flex flex-1 flex-col items-center">
            <div
              className="w-full rounded-t bg-primary/20 transition-all"
              style={{ height: `${Math.max(m.height, 4)}px` }}
            />
            <span className="mt-2 text-xs text-gray-500">{m.label}</span>
            <span className="text-xs font-medium">
              {m.revenue > 0 ? formatCurrency(m.revenue) : "₦0"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
