import { TRPCError } from "@trpc/server";

export type NotificationPayload = { title: string; content: string };

export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const title = payload.title.trim();
  const content = payload.content.trim();
  if (!title || !content) throw new TRPCError({ code: "BAD_REQUEST", message: "Notification title and content are required." });
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WORKSPACE_REMINDER_FROM;
  const to = process.env.ADMIN_EMAIL;
  if (!apiKey || !from || !to) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: title.slice(0, 1200), text: content.slice(0, 20000) }),
  });
  return response.ok;
}
