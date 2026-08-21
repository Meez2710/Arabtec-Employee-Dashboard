import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ENV } from "./_core/env";

const root = path.resolve(ENV.uploadDir);
function normalizeKey(value: string) {
  const cleaned = value.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!cleaned || cleaned.split("/").some(part => part === ".." || part === ".")) throw new Error("Invalid storage path");
  return cleaned;
}
function publicUrl(key: string) {
  return `/uploads/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function storagePut(relKey: string, data: Buffer | Uint8Array | string, _contentType = "application/octet-stream") {
  const parsed = path.posix.parse(normalizeKey(relKey));
  const key = path.posix.join(parsed.dir, `${parsed.name}_${randomUUID().replace(/-/g, "").slice(0, 8)}${parsed.ext}`);
  const destination = path.resolve(root, key);
  if (!destination.startsWith(`${root}${path.sep}`)) throw new Error("Invalid storage destination");
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, data);
  return { key, url: publicUrl(key) };
}

export async function storageGet(relKey: string) {
  const key = normalizeKey(relKey);
  return { key, url: publicUrl(key) };
}

export async function storageGetSignedUrl(relKey: string) {
  return publicUrl(normalizeKey(relKey));
}
