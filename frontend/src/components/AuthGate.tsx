"use client";

import React, { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import LoginForm from "./LoginForm";
import LandingPage from "./LandingPage";

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, requireLogin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && requireLogin && pathname !== '/') {
      router.push('/');
    }
  }, [isAuthenticated, requireLogin, pathname, router]);

  // If login is not required, show content directly
  if (!requireLogin) {
    return <>{children}</>;
  }

  // If login is required and user is not authenticated, show landing page
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // User is authenticated, show content
  return <>{children}</>;
}
