import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg md:p-8">
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Staff Login
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to access the dashboard.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="text-primary hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
