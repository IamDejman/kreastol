"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/lib/services/authService";

const CHECK_INTERVAL = 60 * 1000; // Check every minute
const SESSION_TIMEOUT = 60 * 60 * 1000; // 60 minutes
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 60 minutes

export function useSessionTimeout() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const checkTimeout = useCallback(() => {
    if (!user) return;

    const timeoutCheck = authService.checkSessionTimeout();
    if (timeoutCheck.expired) {
      const reason = timeoutCheck.reason === "session_timeout" 
        ? "session_timeout" 
        : timeoutCheck.reason === "inactivity_timeout"
        ? "inactivity_timeout"
        : "session_expired";
      
      logout(reason);
      router.push(`/login?reason=${reason}`);
    }
  }, [user, logout, router]);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      authService.updateLastActivity();
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check timeout periodically
    const interval = setInterval(checkTimeout, CHECK_INTERVAL);
    
    // Initial check
    checkTimeout();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [user, checkTimeout]);
}
