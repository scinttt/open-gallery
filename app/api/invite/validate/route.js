import { cookies } from "next/headers";
import { consumeInviteCode } from "@/lib/invite-store";

export const dynamic = "force-dynamic";

const INVITE_COOKIE = "og_invite";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function computeInviteToken() {
  const secret = process.env.INVITE_COOKIE_SECRET || "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("verified"),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { code } = body;

  if (typeof code !== "string" || !code.trim()) {
    return Response.json({ error: "Invite code is required." }, { status: 400 });
  }

  const valid = await consumeInviteCode(code.trim().toUpperCase());

  if (!valid) {
    return Response.json({ error: "Invalid or already used invite code." }, { status: 401 });
  }

  const token = await computeInviteToken();
  const cookieStore = await cookies();

  cookieStore.set(INVITE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  return Response.json({ ok: true });
}
