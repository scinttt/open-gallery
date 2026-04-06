"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();

    if (!code.trim() || pending) {
      return;
    }

    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/invite/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Invalid invite code.");
        return;
      }

      router.push("/sign-up");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function handleSignIn() {
    router.push("/sign-in");
  }

  return (
    <main className="page-shell login-page">
      <section className="login-panel clerk-panel">
        <div className="login-copy">
          <p className="eyebrow">Private Access</p>
          <h1>Enter your invite code to create an account.</h1>
          <p className="hero-text">
            This gallery is invite-only. Enter the code you received to sign up,
            or sign in if you already have an account.
          </p>
        </div>

        <div className="clerk-card-shell">
          <form className="invite-form" onSubmit={handleSubmit}>
            <input
              autoComplete="off"
              autoFocus
              className="clerk-input"
              disabled={pending}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Invite code"
              spellCheck={false}
              type="text"
              value={code}
            />

            {error ? (
              <p className="invite-error" role="alert">
                {error}
              </p>
            ) : null}

            <button
              className="clerk-primary-button"
              disabled={pending || !code.trim()}
              type="submit"
            >
              {pending ? "Checking…" : "Sign up with invite code"}
            </button>
          </form>

          <div className="invite-divider">
            <span>or</span>
          </div>

          <button
            className="invite-signin-button"
            disabled={pending}
            onClick={handleSignIn}
            type="button"
          >
            Sign in to existing account
          </button>
        </div>
      </section>
    </main>
  );
}
