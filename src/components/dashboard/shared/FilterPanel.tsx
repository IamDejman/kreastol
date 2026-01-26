"use client";

import { Select } from "@/components/ui/Select";

interface FilterPanelProps {
  statusFilter: string;
  onStatusChange: (v: string) => void;
}

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

export function FilterPanel({
  statusFilter,
  onStatusChange,
}: FilterPanelProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <Select
        options={statusOptions}
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="min-w-[160px]"
      />
    </div>
  );
}
