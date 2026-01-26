"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  children,
  title,
  className,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            ref={drawerRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl",
              className
            )}
            style={{
              maxHeight: "85vh",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-12 rounded-full bg-gray-300" />
            </div>
            {title && (
              <div className="flex items-center justify-between border-b px-4 pb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex min-h-touch min-w-touch items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(85vh - 80px)" }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
