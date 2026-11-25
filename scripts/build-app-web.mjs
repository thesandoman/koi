// Builds the Expo web export and places it at site/public/app.
// Metro writes font assets under assets/node_modules/, which git and Vercel both skip,
// so the folder is renamed to assets/vendor and every reference is rewritten.
import { execSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";

const app = new URL("../app/", import.meta.url).pathname;
const out = new URL("../site/public/app/", import.meta.url).pathname;
const run = (c) => execSync(c, { cwd: app, stdio: "inherit" });

if (!existsSync(join(app, "node_modules"))) run("npm ci");
rmSync(join(app, "dist"), { recursive: true, force: true });
run("npx expo export --platform web");

const dist = join(app, "dist");
const nm = join(dist, "assets", "node_modules");
if (existsSync(nm)) renameSync(nm, join(dist, "assets", "vendor"));

let rewritten = 0;
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (![".js", ".html", ".json", ".css"].includes(extname(p))) continue;
    const t = readFileSync(p, "utf8");
    if (t.includes("assets/node_modules/")) { writeFileSync(p, t.replaceAll("assets/node_modules/", "assets/vendor/")); rewritten++; }
  }
})(dist);

rmSync(out, { recursive: true, force: true });
cpSync(dist, out, { recursive: true });
console.log(`app web build copied to site/public/app (${rewritten} files rewritten)`);
