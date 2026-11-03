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

  // Debug logging
  console.log('[AuthGate] requireLogin:', requireLogin);
  console.log('[AuthGate] isAuthenticated:', isAuthenticated);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    console.log('[AuthGate useEffect] Checking redirect...', { requireLogin, isAuthenticated });
    if (requireLogin && !isAuthenticated) {
      console.log('[AuthGate] 🚀 REDIRECTING TO /login');
      router.replace("/login");
    }
  }, [requireLogin, isAuthenticated, router]);

  // If login is not required, show content directly
  if (!requireLogin) {
    console.log('[AuthGate] Login not required, showing content');
    return <>{children}</>;
  }

  // If login is required and user is not authenticated, show nothing while redirecting
  if (!isAuthenticated) {
    console.log('[AuthGate] Not authenticated, showing loading/null');
    return null;
  }

  // User is authenticated, show content
  console.log('[AuthGate] Authenticated, showing content');
  return <>{children}</>;
}
