import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { CLERK_ENABLED } from "@/lib/auth-config";

const INVITE_COOKIE = "og_invite";
const SIGNIN_BYPASS_COOKIE = "og_signin_bypass";

const isProtectedRoute = createRouteMatcher([
  "/",
  "/gallery(.*)",
  "/groups(.*)",
  "/artists(.*)",
  "/api/media(.*)",
  "/api/galleries(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isSignUpRoute = createRouteMatcher(["/sign-up(.*)"]);
const isInviteRoute = createRouteMatcher(["/invite(.*)", "/api/invite(.*)", "/sign-in(.*)"]);


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

async function hasValidInviteCookie(req) {
  const cookieValue = req.cookies.get(INVITE_COOKIE)?.value;
  if (!cookieValue) return false;
  const expected = await computeInviteToken();
  return cookieValue === expected;
}

function isInviteEnabled() {
  return Boolean(process.env.ADMIN_USER_ID);
}

function isAdmin(userId) {
  const adminId = process.env.ADMIN_USER_ID;
  return Boolean(adminId && userId === adminId);
}

const handleClerk = clerkMiddleware(async (auth, req) => {
  if (isInviteRoute(req)) {
    return NextResponse.next();
  }

  if (isAdminRoute(req)) {
    const { userId } = await auth();
    if (!userId || !isAdmin(userId)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (isSignUpRoute(req)) {
    if (isInviteEnabled()) {
      const { userId } = await auth();
      if (!userId && !(await hasValidInviteCookie(req))) {
        return NextResponse.redirect(new URL("/invite", req.url));
      }
    }
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default function proxy(req, event) {
  if (!CLERK_ENABLED) {
    return NextResponse.next();
  }

  return handleClerk(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
