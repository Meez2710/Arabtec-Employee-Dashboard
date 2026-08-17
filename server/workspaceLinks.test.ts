import { describe, expect, it } from "vitest";
import { extractOpenGraphImage, isSafeExternalUrl } from "./workspaceLinks";

describe("workspace external-link safeguards", () => {
  it("only accepts secure public URL shapes for preview requests", () => {
    expect(isSafeExternalUrl("https://www.example.com/news")).toBe(true);
    expect(isSafeExternalUrl("http://www.example.com/news")).toBe(false);
    expect(isSafeExternalUrl("https://localhost/private")).toBe(false);
    expect(isSafeExternalUrl("https://127.0.0.1/private")).toBe(false);
  });

  it("extracts an HTTPS Open Graph image and ignores non-secure media", () => {
    expect(extractOpenGraphImage('<meta property="og:image" content="https://cdn.example.com/card.jpg">', "https://example.com/page")).toBe("https://cdn.example.com/card.jpg");
    expect(extractOpenGraphImage('<meta property="og:image" content="http://cdn.example.com/card.jpg">', "https://example.com/page")).toBeNull();
  });
});
