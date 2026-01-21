"use client";

import React, { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";



interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, requireLogin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // If login is not required, show content directly
  if (!requireLogin) {
    return <>{children}</>;
  }

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (requireLogin && !isAuthenticated) {
      router.push("/login");
    }
  }, [requireLogin, isAuthenticated, router]);

  // If login is required and user is not authenticated, show nothing while redirecting
  if (!isAuthenticated && requireLogin) {
    return null;
  }

  // User is authenticated, show content
  return <>{children}</>;
}
