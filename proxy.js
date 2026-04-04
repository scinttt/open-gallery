import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { CLERK_ENABLED } from "@/lib/auth-config";

const isProtectedRoute = createRouteMatcher([
  "/",
  "/gallery(.*)",
  "/api/media(.*)",
]);

const handleClerk = clerkMiddleware(async (auth, req) => {
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
