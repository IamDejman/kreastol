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
    <div className="rounded-xl border bg-white p-4 sm:p-6">
      <div className="mb-3 sm:mb-4">
        <h3 className="font-heading text-base font-semibold text-foreground sm:text-lg">
          Monthly Revenue Breakdown
        </h3>
        <p className="mt-1 text-xs text-gray-600 sm:text-sm">
          Last 6 months • Total: {formatCurrency(totalRevenue)}
        </p>
      </div>
      <div className="mt-4 flex items-end justify-between gap-1 sm:mt-6 sm:gap-2">
        {data.map((m) => (
          <div key={m.label} className="flex flex-1 flex-col items-center">
            <div
              className="w-full rounded-t bg-primary/20 transition-all"
              style={{ height: `${Math.max(m.height, 4)}px` }}
            />
            <span className="mt-1.5 text-[10px] text-gray-500 sm:mt-2 sm:text-xs">{m.label}</span>
            <span className="text-[10px] font-medium sm:text-xs">
              {m.revenue > 0 ? formatCurrency(m.revenue) : "₦0"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
