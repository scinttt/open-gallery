import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORE_PATH = path.join(process.cwd(), ".gallery-invites.json");

async function readStore() {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return { codes: [] };
  }
}

async function writeStore(store) {
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function generateCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function createInviteCode() {
  const store = await readStore();
  const code = generateCode();

  store.codes.push({
    code,
    createdAt: Date.now(),
    usedAt: null,
  });

  await writeStore(store);
  return code;
}

export async function listInviteCodes() {
  const store = await readStore();
  return store.codes;
}

export async function consumeInviteCode(code) {
  const store = await readStore();
  const entry = store.codes.find(
    (item) => item.code === code && item.usedAt === null,
  );

  if (!entry) {
    return false;
  }

  entry.usedAt = Date.now();
  await writeStore(store);
  return true;
}
