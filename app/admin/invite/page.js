"use client";

import { useEffect, useState } from "react";

function formatDate(ms) {
  return new Date(ms).toLocaleString();
}

export default function AdminInvitePage() {
  const [codes, setCodes] = useState([]);
  const [newCode, setNewCode] = useState(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadCodes() {
    const res = await fetch("/api/admin/invite/list");
    const data = await res.json().catch(() => ({}));
    setCodes(data.codes ?? []);
  }

  useEffect(() => {
    loadCodes();
  }, []);

  async function handleGenerate() {
    if (pending) return;
    setPending(true);
    setNewCode(null);
    setCopied(false);

    try {
      const res = await fetch("/api/admin/invite/create", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNewCode(data.code);
        await loadCodes();
      }
    } finally {
      setPending(false);
    }
  }

  async function handleCopy(code) {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(false), 2000);
  }

  const active = codes.filter((c) => c.usedAt === null);
  const used = codes.filter((c) => c.usedAt !== null);

  return (
    <main className="page-shell detail-page">
      <div className="topbar">
        <span className="topbar-mark">Admin</span>
      </div>

      <div className="detail-body">
        <header className="detail-hero">
          <div>
            <p className="eyebrow">Invite Management</p>
            <h1>Invite Codes</h1>
          </div>
        </header>

        <div className="admin-invite-actions">
          <button
            className="toolbar-button"
            disabled={pending}
            onClick={handleGenerate}
            type="button"
          >
            {pending ? "Generating…" : "Generate new code"}
          </button>

          {newCode ? (
            <div className="invite-new-code">
              <span className="invite-code-value">{newCode}</span>
              <button
                className="toolbar-button"
                onClick={() => handleCopy(newCode)}
                type="button"
              >
                {copied === newCode ? "Copied!" : "Copy"}
              </button>
            </div>
          ) : null}
        </div>

        {active.length > 0 ? (
          <section className="admin-invite-section">
            <p className="eyebrow">Active ({active.length})</p>
            <ul className="invite-code-list">
              {active.map((entry) => (
                <li className="invite-code-row" key={entry.code}>
                  <span className="invite-code-value">{entry.code}</span>
                  <span className="invite-code-meta">
                    Created {formatDate(entry.createdAt)}
                  </span>
                  <button
                    className="toolbar-button"
                    onClick={() => handleCopy(entry.code)}
                    type="button"
                  >
                    {copied === entry.code ? "Copied!" : "Copy"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {used.length > 0 ? (
          <section className="admin-invite-section">
            <p className="eyebrow">Used ({used.length})</p>
            <ul className="invite-code-list">
              {used.map((entry) => (
                <li className="invite-code-row invite-code-row-used" key={entry.code}>
                  <span className="invite-code-value">{entry.code}</span>
                  <span className="invite-code-meta">
                    Used {formatDate(entry.usedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
