"use client";

import React, { useState } from "react";
import { useAuth } from "./AuthProvider";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type AuthMode = "login" | "forgot-password";

export default function LoginForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        const result = await login({ email, password });
        if (!result.success) {
          setError(result.message || "Login failed");
        }
      } else if (mode === "forgot-password") {
        const { forgotPassword } = await import("@/lib/auth");
        const result = await forgotPassword(email);
        setSuccess(result.message || "Check your email for reset instructions");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">🎬 CurateKids</h1>
            <p className="text-muted-foreground">
              {mode === "login" && "Sign in to access the videos"}
              {mode === "forgot-password" && "Reset your password"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
                disabled={isLoading}
              />
            </div>

            {mode !== "forgot-password" && (
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {success && (
              <p className="text-sm text-green-600 text-center">{success}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Loading...
                </span>
              ) : (
                <>
                  {mode === "login" && "Sign In"}
                  {mode === "forgot-password" && "Send Reset Link"}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            {mode === "login" && (
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => { setMode("forgot-password"); setError(""); setSuccess(""); }}
              >
                Forgot password?
              </button>
            )}
            {mode === "forgot-password" && (
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              >
                Back to sign in
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
