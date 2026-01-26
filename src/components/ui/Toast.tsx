"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useToastStore } from "@/store/toastStore";

export function useToast() {
  const add = useToastStore((s) => s.add);
  return {
    success: (message: string) => add(message, "success"),
    error: (message: string) => add(message, "error"),
    info: (message: string) => add(message, "info"),
  };
}

function ToastList() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <div
      id="toaster"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "flex items-center justify-between rounded-lg px-4 py-3 shadow-lg",
              t.type === "success" && "bg-success text-white",
              t.type === "error" && "bg-danger text-white",
              t.type === "info" && "bg-primary text-white"
            )}
          >
            <span className="text-sm font-medium">{t.message}</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="ml-2 flex min-h-touch min-w-touch items-center justify-center rounded p-1 hover:bg-white/20"
              aria-label="Dismiss"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Toaster() {
  return <ToastList />;
}
