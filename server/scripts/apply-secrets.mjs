#!/usr/bin/env node
// Reads KEY=VALUE lines from stdin and upserts them into ../.env by key,
// leaving every other existing line (DATABASE_URL, JWT_SECRET, etc.) untouched.
// Never logs secret values. Invoked remotely by secrets-deploy.sh — this file
// itself contains no secrets and is safe to commit.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");

const incoming = readFileSync(0, "utf8")
  .split("\n")
  .map((l) => l.trimEnd())
  .filter((l) => l.trim() && !l.trim().startsWith("#"));

let lines = existsSync(envPath) ? readFileSync(envPath, "utf8").split("\n") : [];

let updated = 0;
let added = 0;
for (const raw of incoming) {
  const idx = raw.indexOf("=");
  if (idx === -1) continue;
  const key = raw.slice(0, idx);
  let replaced = false;
  lines = lines.map((l) => {
    if (l.startsWith(`${key}=`)) {
      replaced = true;
      return raw;
    }
    return l;
  });
  if (replaced) updated++;
  else {
    lines.push(raw);
    added++;
  }
}

while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
lines.push("");

writeFileSync(envPath, lines.join("\n"), { mode: 0o600 });
console.log(`Applied secrets to ${envPath}: ${updated} updated, ${added} added.`);
