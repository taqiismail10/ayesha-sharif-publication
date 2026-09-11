"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { PasswordToggleButton } from "@/components/ui/password-toggle-button";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setIsPending(true);
        const form = new FormData(event.currentTarget);
        try {
          const response = await apiFetch("/admin/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: form.get("email"),
              password: form.get("password"),
            }),
          });
          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { message?: string } | null;
            throw new Error(payload?.message || "Invalid admin email or password.");
          }
          window.location.assign("/admin");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Unable to sign in.");
          setIsPending(false);
        }
      }}
      className="grid gap-4"
    >
      {error ? (
        <div className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
          {error}
        </div>
      ) : null}
      <label>
        <span className="form-label">Admin email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="form-input mt-1"
        />
      </label>
      <label>
        <span className="form-label">Password</span>
        <div className="relative mt-1">
          <input
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            required
            className="form-input pr-12"
          />
          <PasswordToggleButton
            isVisible={isPasswordVisible}
            label="Password"
            onToggle={() => setIsPasswordVisible((current) => !current)}
          />
        </div>
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-navy px-5 py-3 text-sm font-extrabold text-white disabled:bg-muted/40"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
