import type { User, LoginCredentials } from "@/types";
import { storageService } from "./storageService";

const AUTH_COOKIE = "kreastol_current_user";
const SESSION_START_KEY = "kreastol_session_start";
const LAST_ACTIVITY_KEY = "kreastol_last_activity";
// We only want to log users out after 60 minutes of *idle* time,
// not after a fixed time window since login.
const SESSION_TIMEOUT = 60 * 60 * 1000; // kept for cookie max-age, not for enforcing logout
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 60 minutes of inactivity

interface SessionData {
  user: User;
  sessionStart: number;
  lastActivity: number;
}

function setAuthCookie(user: User): void {
  if (typeof document === "undefined") return;
  const now = Date.now();
  const sessionData: SessionData = {
    user,
    sessionStart: now,
    lastActivity: now,
  };
  const value = encodeURIComponent(JSON.stringify(sessionData));
  document.cookie = `${AUTH_COOKIE}=${value}; path=/; max-age=${
    SESSION_TIMEOUT / 1000
  }; SameSite=Lax`;
  // Also store in localStorage for quick access
  localStorage.setItem(SESSION_START_KEY, now.toString());
  localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
}

function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
  localStorage.removeItem(SESSION_START_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function updateLastActivity(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
  
  // Also update cookie
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${AUTH_COOKIE}=`));
  if (raw) {
    try {
      const value = decodeURIComponent(raw.split("=")[1]);
      const sessionData: SessionData = JSON.parse(value);
      sessionData.lastActivity = now;
      const updatedValue = encodeURIComponent(JSON.stringify(sessionData));
      document.cookie = `${AUTH_COOKIE}=${updatedValue}; path=/; max-age=${
        SESSION_TIMEOUT / 1000
      }; SameSite=Lax`;
    } catch {
      // Ignore parse errors
    }
  }
}

export function getSessionStart(): number | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(SESSION_START_KEY);
  return stored ? parseInt(stored, 10) : null;
}

export function getLastActivity(): number | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
  return stored ? parseInt(stored, 10) : null;
}

export function checkSessionTimeout(): { expired: boolean; reason: string | null } {
  const lastActivity = getLastActivity();
  const now = Date.now();

  if (!lastActivity) {
    return { expired: true, reason: "Session not found" };
  }

  // Check inactivity timeout (60 minutes of no activity)
  if (now - lastActivity > INACTIVITY_TIMEOUT) {
    return { expired: true, reason: "inactivity_timeout" };
  }

  return { expired: false, reason: null };
}

export async function login(credentials: LoginCredentials): Promise<User> {
  if (typeof window === "undefined") {
    throw new Error("Login can only be performed in the browser.");
  }

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  const user = data.user as User;

  if (user.status !== "active") {
    throw new Error("Account is inactive. Please contact the owner.");
  }

  storageService.setCurrentUser(user);
  setAuthCookie(user);
  return user;
}

export function logout(reason?: string): void {
  storageService.clearCurrentUser();
  clearAuthCookie();
  // Store logout reason in sessionStorage for login page to display
  if (reason && typeof window !== "undefined") {
    sessionStorage.setItem("logout_reason", reason);
  }
}

export function getCurrentUser(): User | null {
  // Check if session has expired
  const timeoutCheck = checkSessionTimeout();
  if (timeoutCheck.expired) {
    logout(timeoutCheck.reason || undefined);
    return null;
  }
  
  // Update last activity when getting user
  updateLastActivity();
  
  return storageService.getCurrentUser();
}

export const authService = {
  login,
  logout,
  getCurrentUser,
  updateLastActivity,
  checkSessionTimeout,
  getSessionStart,
  getLastActivity,
};
