"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginValues } from "@/lib/utils/validation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

export function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginValues) => {
    clearError();
    try {
      await login(data);
      const user = useAuthStore.getState().user;
      const path = user?.role === "owner" ? "/owner" : "/receptionist";
      router.push(path);
    } catch {
      // Error stored in auth store
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div
          className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      )}
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <div className="w-full">
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className={cn(
              "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-base text-foreground placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:cursor-not-allowed min-h-touch",
              errors.password && "border-danger focus:border-danger focus:ring-danger/20"
            )}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex min-h-touch min-w-touch items-center justify-center rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-sm text-danger" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>
      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
