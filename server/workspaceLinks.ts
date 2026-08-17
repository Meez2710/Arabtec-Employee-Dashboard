import { lookup } from "node:dns/promises";
import net from "node:net";

function isPrivateIp(address: string) {
  if (net.isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
  }
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80");
}

export function isSafeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && host !== "localhost" && !host.endsWith(".local") && !net.isIP(host);
  } catch {
    return false;
  }
}

export function extractOpenGraphImage(html: string, baseUrl: string) {
  const match = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i);
  if (!match?.[1]) return null;
  try {
    const image = new URL(match[1], baseUrl);
    return image.protocol === "https:" ? image.toString() : null;
  } catch {
    return null;
  }
}

export async function resolveLinkPreview(urlValue: string) {
  if (!isSafeExternalUrl(urlValue)) return { imageUrl: null, title: null };
  const url = new URL(urlValue);
  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.some(record => isPrivateIp(record.address))) return { imageUrl: null, title: null };

  const response = await fetch(url, { headers: { "User-Agent": "Arabtec-Workspace-LinkPreview/1.0" }, redirect: "error", signal: AbortSignal.timeout(5000) });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/html")) return { imageUrl: null, title: null };
  const html = (await response.text()).slice(0, 350_000);
  const title = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
    ?? null;
  return { imageUrl: extractOpenGraphImage(html, response.url), title: title?.trim() ?? null };
}
