import { randomUUID } from "node:crypto";
import config from "@payload-config";
import { type NextRequest, NextResponse } from "next/server";
import { getFieldsToSign, getPayload, jwtSign } from "payload";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_TOKEN_URL,
  GOOGLE_USERINFO_URL,
  type GoogleLoginError,
  decodeStateCookie,
  getBaseUrl,
  getRedirectUri,
  loginErrorUrl,
} from "@/lib/googleAuth";

type GoogleProfile = { email?: string; email_verified?: boolean };

/** Redirects to the login page with an error and always clears the one-time state cookie. */
function fail(req: NextRequest, error: GoogleLoginError) {
  const response = NextResponse.redirect(loginErrorUrl(req.url, error));
  response.cookies.set(GOOGLE_STATE_COOKIE, "", { maxAge: 0, path: "/api/auth/google" });
  return response;
}

async function fetchGoogleProfile(req: NextRequest, code: string): Promise<GoogleProfile | null> {
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(req.url),
    }),
  });
  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokens.access_token) return null;

  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  return profileResponse.ok ? ((await profileResponse.json()) as GoogleProfile) : null;
}

/**
 * Step 2: Google sends the user back here. We only sign in people who ALREADY have an active
 * account for their verified Google email - this never creates users (there is no public signup).
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const saved = decodeStateCookie(req.cookies.get(GOOGLE_STATE_COOKIE)?.value);
  const code = params.get("code");

  if (params.get("error") || !code || !saved || saved.state !== params.get("state")) {
    return fail(req, "google_failed");
  }

  try {
    const profile = await fetchGoogleProfile(req, code);
    const email = profile?.email?.toLowerCase();
    if (!email || profile?.email_verified !== true) return fail(req, "google_failed");

    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "users",
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      showHiddenFields: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = result.docs[0] as any;
    if (!user || (user.status ?? "active") !== "active") return fail(req, "google_not_authorized");

    // Same steps as Payload's own login: record a session, then sign a token that carries its id.
    const collectionConfig = payload.collections.users.config;
    const now = new Date();
    const tokenExpiration = collectionConfig.auth.tokenExpiration;
    const sid = randomUUID();
    const liveSessions = (user.sessions ?? []).filter(
      (session: { expiresAt: string | Date }) => new Date(session.expiresAt) > now,
    );
    liveSessions.push({ id: sid, createdAt: now, expiresAt: new Date(now.getTime() + tokenExpiration * 1000) });
    await payload.db.updateOne({
      collection: "users",
      id: user.id,
      data: { sessions: liveSessions },
      returning: false,
    });

    const { token, exp } = await jwtSign({
      fieldsToSign: getFieldsToSign({ collectionConfig, email: user.email, sid, user }),
      secret: payload.secret,
      tokenExpiration,
    });

    await payload.update({
      collection: "users",
      id: user.id,
      data: { lastLoginAt: now.toISOString(), loginCount: (user.loginCount ?? 0) + 1 },
      overrideAccess: true,
    });

    const response = NextResponse.redirect(new URL(saved.redirectPath, getBaseUrl(req.url)));
    response.cookies.set("payload-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(exp * 1000),
    });
    response.cookies.set(GOOGLE_STATE_COOKIE, "", { maxAge: 0, path: "/api/auth/google" });
    return response;
  } catch (error) {
    console.error("Google sign-in failed:", error instanceof Error ? error.message : error);
    return fail(req, "google_failed");
  }
}
