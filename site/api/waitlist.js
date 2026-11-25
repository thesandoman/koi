// Waitlist endpoint. Stores one small private record per sign-up in a Vercel Blob store
// (BLOB_READ_WRITE_TOKEN), or forwards it to WAITLIST_WEBHOOK_URL. With neither set,
// GET reports { open: false } and the site hides the form. Nothing is ever logged.
import { createHash } from "node:crypto";
import { put } from "@vercel/blob";

const AREAS = new Set(["ari", "siam", "sukhumvit", "thonglor", "silom", "old", "yaowarat", "chatuchak", "other"]);
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  const hook = process.env.WAITLIST_WEBHOOK_URL;
  const blob = process.env.BLOB_READ_WRITE_TOKEN;
  const configured = Boolean(blob || hook);

  if (req.method === "GET") return res.status(200).json({ open: configured });
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!configured) return res.status(503).json({ error: "closed" });

  // Same-origin only.
  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({ error: "origin" });

  const b = typeof req.body === "string" ? safeJson(req.body) : req.body;
  if (!b || typeof b !== "object") return res.status(400).json({ error: "body" });
  if (b.website) return res.status(200).json({ ok: true }); // honeypot: pretend success

  const email = String(b.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return res.status(400).json({ error: "email" });
  if (!AREAS.has(b.area)) return res.status(400).json({ error: "area" });
  if (b.consent !== true) return res.status(400).json({ error: "consent" });

  const record = { email, area: b.area, locale: b.locale === "th" ? "th" : "en", consentAt: new Date().toISOString(), source: "koi-site" };

  try {
    if (blob) {
      // One file per email (hashed name), so a repeat sign-up just updates the same record.
      const name = createHash("sha256").update(email).digest("hex").slice(0, 24);
      await put(`waitlist/${name}.json`, JSON.stringify(record), { access: "private", contentType: "application/json", allowOverwrite: true, addRandomSuffix: false });
    } else {
      const r = await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(record) });
      if (!r.ok) return res.status(502).json({ error: "upstream" });
    }
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: "upstream" });
  }
}

function safeJson(s) { try { return JSON.parse(s); } catch { return null; } }
