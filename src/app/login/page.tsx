"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const [timeoutMessage, setTimeoutMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for logout reason from sessionStorage
    if (typeof window !== "undefined") {
      const storedReason = sessionStorage.getItem("logout_reason");
      if (storedReason) {
        sessionStorage.removeItem("logout_reason");
        setTimeoutMessage(storedReason);
      } else if (reason) {
        setTimeoutMessage(reason);
      }
    }
  }, [reason]);

  const getTimeoutMessage = () => {
    if (timeoutMessage === "session_timeout") {
      return {
        title: "Session Expired",
        message: "Your session has expired after 60 minutes. Please log in again.",
      };
    }
    if (timeoutMessage === "inactivity_timeout") {
      return {
        title: "Session Timeout",
        message: "You have been logged out due to 60 minutes of inactivity. Please log in again.",
      };
    }
    if (timeoutMessage === "session_expired") {
      return {
        title: "Session Expired",
        message: "Your session has expired. Please log in again.",
      };
    }
    return null;
  };

  const message = getTimeoutMessage();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg md:p-8">
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Staff Login
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to access the dashboard.
        </p>
        {message && (
          <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 p-4">
            <p className="text-sm font-semibold text-orange-800">{message.title}</p>
            <p className="mt-1 text-sm text-orange-700">{message.message}</p>
          </div>
        )}
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg md:p-8">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
