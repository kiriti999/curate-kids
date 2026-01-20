"use client";

import React, { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import LoginForm from "./LoginForm";

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, requireLogin } = useAuth();

  // If login is not required, show content directly
  if (!requireLogin) {
    return <>{children}</>;
  }

  // If login is required and user is not authenticated, show login form
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // User is authenticated, show content
  return <>{children}</>;
}
