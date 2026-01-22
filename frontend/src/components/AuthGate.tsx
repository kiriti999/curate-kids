"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, requireLogin } = useAuth();
  const router = useRouter();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (requireLogin && !isAuthenticated) {
      router.push("/login");
    }
  }, [requireLogin, isAuthenticated, router]);

  // If login is not required, show content directly
  if (!requireLogin) {
    return <>{children}</>;
  }

  // If login is required and user is not authenticated, show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, show content
  return <>{children}</>;
}
