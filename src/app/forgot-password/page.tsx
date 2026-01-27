"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import { authService } from "@/lib/services/authService";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok && data.error) {
        setError(data.error);
      } else {
        setMessage(
          data.message || "If that email exists, an OTP has been sent."
        );
        setStep("verify");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();

      if (!res.ok && data.error) {
        setError(data.error);
      } else {
        setMessage(data.message || "Password reset successfully.");
        // Automatically log the user in with the new password
        try {
          await authService.login({
            email,
            password: newPassword,
            rememberMe: true,
          });
          router.push("/");
        } catch (loginError) {
          console.error("Auto-login after reset failed:", loginError);
          // Fallback: send user to login page
          router.push("/login");
        }
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg md:p-8">
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {step === "request"
            ? "Enter your staff email to receive a one-time code."
            : "Enter the OTP sent to your email and choose a new password."}
        </p>

        {error && (
          <div
            className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {error}
          </div>
        )}

        {message && !error && (
          <div
            className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            role="status"
          >
            {message}
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequest} className="mt-6 space-y-4">
            <Input
              label="Staff email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? "Sending OTP…" : "Send OTP"}
            </Button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-2 w-full text-center text-sm font-medium text-primary hover:underline"
            >
              Back to login
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <Input
              label="OTP code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <div className="w-full">
              <label
                htmlFor="new-password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPasswords ? "text" : "password"}
                  autoComplete="new-password"
                  className={cn(
                    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-base text-foreground placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:cursor-not-allowed min-h-touch"
                  )}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex min-h-touch min-w-touch items-center justify-center rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                  aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                  tabIndex={-1}
                >
                  {showPasswords ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="w-full">
              <label
                htmlFor="confirm-password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showPasswords ? "text" : "password"}
                  autoComplete="new-password"
                  className={cn(
                    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-base text-foreground placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:cursor-not-allowed min-h-touch"
                  )}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex min-h-touch min-w-touch items-center justify-center rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                  aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                  tabIndex={-1}
                >
                  {showPasswords ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? "Resetting…" : "Reset password"}
            </Button>
            <button
              type="button"
              onClick={() => setStep("request")}
              className="mt-2 w-full text-center text-sm font-medium text-primary hover:underline"
            >
              Need a new code?
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

