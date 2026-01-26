"use client";

import { cn } from "@/lib/utils/cn";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeId, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1 rounded-lg bg-gray-100 p-1", className)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeId === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "min-h-touch min-w-touch rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeId === tab.id
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
