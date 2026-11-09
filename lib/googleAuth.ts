/**
 * Helpers for "Sign in with Google" (server side only).
 *
 * Curated Reels has no public signup, so Google sign-in only ever logs in people who
 * already have an active account (matched by their verified Google email).
 */

export const GOOGLE_STATE_COOKIE = "cr_google_oauth";
export const GOOGLE_STATE_MAX_AGE_SECONDS = 600;
export const DEFAULT_AFTER_LOGIN_PATH = "/content";

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export type GoogleLoginError =
  | "google_unavailable"
  | "google_failed"
  | "google_not_authorized";

/** Only allow same-site relative paths, so the redirect parameter can't be used to bounce users elsewhere. */
export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return DEFAULT_AFTER_LOGIN_PATH;
  }
  return value;
}

/** Must match an "Authorized redirect URI" registered for the Google OAuth client. */
export function getBaseUrl(requestUrl: string): string {
  const configured = process.env.NEXT_PUBLIC_FRONTEND_URL;
  return (configured || new URL(requestUrl).origin).replace(/\/$/, "");
}

export function getRedirectUri(requestUrl: string): string {
  return `${getBaseUrl(requestUrl)}/api/auth/google/callback`;
}

export function loginErrorUrl(requestUrl: string, error: GoogleLoginError): URL {
  return new URL(`/login?error=${error}`, getBaseUrl(requestUrl));
}

/** The state cookie stores `<random state>|<where to go after login>`. */
export function encodeStateCookie(state: string, redirectPath: string): string {
  return `${state}|${encodeURIComponent(redirectPath)}`;
}

export function decodeStateCookie(cookie: string | undefined): { state: string; redirectPath: string } | null {
  if (!cookie) return null;
  const separator = cookie.indexOf("|");
  if (separator < 1) return null;
  return {
    state: cookie.slice(0, separator),
    redirectPath: safeRedirectPath(decodeURIComponent(cookie.slice(separator + 1))),
  };
}
