import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SignUp } from "@clerk/nextjs";
import { CLERK_ENABLED } from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  if (!CLERK_ENABLED) {
    redirect("/");
  }

  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const isLocalHost =
    host &&
    /^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);
  const protocol = forwardedProto || (isLocalHost ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : "/";

  return (
    <main className="page-shell login-page">
      <section className="login-panel clerk-panel">
        <div className="login-copy">
          <p className="eyebrow">Create Account</p>
          <h1>Sign up to access the gallery.</h1>
          <p className="hero-text">
            You&rsquo;re one step away. Create your account to start browsing.
          </p>
        </div>

        <div className="clerk-card-shell">
          <SignUp
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
            path="/sign-up"
            signInUrl="/sign-in"
          />
        </div>
      </section>
    </main>
  );
}
