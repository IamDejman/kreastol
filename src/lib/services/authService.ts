import type { User, LoginCredentials } from "@/types";
import { storageService } from "./storageService";

const AUTH_COOKIE = "kreastol_current_user";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function setAuthCookie(user: User): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(user));
  document.cookie = `${AUTH_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}

export function login(credentials: LoginCredentials): User {
  const user = storageService.getUserByEmail(credentials.email);
  if (!user || user.password !== credentials.password) {
    throw new Error("Invalid email or password.");
  }
  storageService.setCurrentUser(user);
  setAuthCookie(user);
  return user;
}

export function logout(): void {
  storageService.clearCurrentUser();
  clearAuthCookie();
}

export function getCurrentUser(): User | null {
  return storageService.getCurrentUser();
}

export const authService = { login, logout, getCurrentUser };
