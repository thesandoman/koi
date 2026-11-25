// Production server for Railway (and any Node host): serves the built site from dist/ and the waitlist API.
// Same security headers as vercel.json. Binds to $PORT.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { gzipSync } from "node:zlib";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import waitlist from "./api/waitlist.js";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "dist");
const port = Number(process.env.PORT) || 3000;

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png", ".ico": "image/x-icon", ".webp": "image/webp", ".txt": "text/plain; charset=utf-8" };
const COMPRESSIBLE = new Set([".html", ".js", ".css", ".svg", ".json", ".txt"]);
const HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
};
const gzCache = new Map();

async function readBody(req, limit = 16_384) {
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > limit) throw new Error("too large"); chunks.push(c); }
  return Buffer.concat(chunks).toString("utf8");
}

async function api(req, res) {
  // Small shim so the Vercel-style handler runs unchanged.
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(obj)); };
  if (req.method === "POST") {
    try { const raw = await readBody(req); req.body = (req.headers["content-type"] || "").includes("json") ? JSON.parse(raw || "{}") : raw; }
    catch { res.statusCode = 400; return res.end(JSON.stringify({ error: "body" })); }
  }
  return waitlist(req, res);
}

async function serveFile(req, res, path) {
  const ext = extname(path);
  const type = TYPES[ext] || "application/octet-stream";
  const immutable = path.includes(`${sep}assets${sep}`) || ext === ".woff2";
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", immutable ? "public, max-age=31536000, immutable" : ext === ".html" ? "no-cache" : "public, max-age=86400");
  if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] || "")) {
    let gz = gzCache.get(path);
    if (!gz) { gz = gzipSync(await readFile(path)); gzCache.set(path, gz); }
    res.setHeader("Content-Encoding", "gzip"); res.setHeader("Vary", "Accept-Encoding");
    return res.end(gz);
  }
  createReadStream(path).pipe(res);
}

const server = createServer(async (req, res) => {
  for (const [k, v] of Object.entries(HEADERS)) res.setHeader(k, v);
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname === "/healthz") { res.setHeader("content-type", "text/plain"); return res.end("ok"); }
    if (url.pathname === "/api/waitlist") return await api(req, res);
    if (req.method !== "GET" && req.method !== "HEAD") { res.statusCode = 405; return res.end(); }
    const safe = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    let file = join(root, safe);
    if (!file.startsWith(root)) { res.statusCode = 403; return res.end(); }
    const s = await stat(file).catch(() => null);
    if (s?.isDirectory()) file = join(file, "index.html");
    else if (!s) {
      if (extname(url.pathname)) { res.statusCode = 404; return res.end("not found"); } // a missing file is a 404, never the page
      file = join(root, "index.html"); // single-page site: unknown routes show the page
    }
    return await serveFile(req, res, file);
  } catch {
    res.statusCode = 500; res.end("error");
  }
});
server.listen(port, "0.0.0.0", () => console.log(`koi site listening on ${port}`));
