import { listOverdueWorkspaceReviewItems, markWorkspaceReviewReminderSent, sweepWorkspacePublicationLifecycle } from "./db";

export function isReviewReminderEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.WORKSPACE_REMINDER_FROM);
}

/** Runs deterministically from the scheduled endpoint. It remains safe to call while email delivery is unconfigured. */
export async function processWorkspaceReviewReminders() {
  const lifecycle = await sweepWorkspacePublicationLifecycle();
  const overdue = await listOverdueWorkspaceReviewItems();
  if (!isReviewReminderEmailConfigured()) return { ...lifecycle, overdue: overdue.length, emailed: 0, emailConfigured: false };
  let emailed = 0;
  for (const item of overdue) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.WORKSPACE_REMINDER_FROM,
        to: [item.ownerEmail],
        subject: `Review overdue: ${item.title}`,
        text: `The Workspace item “${item.title}” was due for review on ${item.reviewBy?.toLocaleString() ?? "the assigned date"}. Please review, update, unpublish, or archive it in the Arabtec Workspace console.`,
      }),
    });
    if (!response.ok) throw new Error(`Reminder email failed for content item ${item.id}: ${response.status}`);
    await markWorkspaceReviewReminderSent(item.id); emailed += 1;
  }
  return { ...lifecycle, overdue: overdue.length, emailed, emailConfigured: true };
}
