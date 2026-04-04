import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { CLERK_ENABLED } from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if (!CLERK_ENABLED) {
    redirect("/");
  }

  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const isLocalHost =
    host &&
    /^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(
      host,
    );
  const protocol = forwardedProto || (isLocalHost ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : "/";

  return (
    <main className="page-shell login-page">
      <section className="login-panel clerk-panel">
        <div className="login-copy">
          <p className="eyebrow">Private Access</p>
          <h1>Open Gallery stays exposed, but only for signed-in users.</h1>
          <p className="hero-text">
            Sign in with Clerk to unlock the cover wall, gallery detail pages,
            and protected media endpoints from your phone or any remote browser.
          </p>
        </div>

        <div className="clerk-card-shell">
          <SignIn
            appearance={{
              elements: {
                card: "clerk-card",
                headerTitle: "clerk-header-title",
                headerSubtitle: "clerk-header-subtitle",
                socialButtonsBlockButton: "clerk-social-button",
                formButtonPrimary: "clerk-primary-button",
                formFieldInput: "clerk-input",
                footerActionLink: "clerk-footer-link",
              },
            }}
            fallbackRedirectUrl={origin}
            forceRedirectUrl={origin}
            routing="path"
            path="/sign-in"
            signUpForceRedirectUrl={origin}
            signUpFallbackRedirectUrl={origin}
          />
        </div>
      </section>
    </main>
  );
}
