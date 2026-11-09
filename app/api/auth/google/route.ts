import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_AUTH_URL,
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_MAX_AGE_SECONDS,
  encodeStateCookie,
  getRedirectUri,
  loginErrorUrl,
  safeRedirectPath,
} from "@/lib/googleAuth";

/** Step 1: send the browser to Google. A random `state` (kept in a short-lived cookie) guards against CSRF. */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(loginErrorUrl(req.url, "google_unavailable"));
  }

  const state = randomBytes(24).toString("hex");
  const redirectPath = safeRedirectPath(req.nextUrl.searchParams.get("redirect"));

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(req.url),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(GOOGLE_STATE_COOKIE, encodeStateCookie(state, redirectPath), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: GOOGLE_STATE_MAX_AGE_SECONDS,
    path: "/api/auth/google",
  });
  return response;
}
