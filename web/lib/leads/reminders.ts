/** Which golfer requests need a nudge to the founder. Pure. */

export const MAX_REMINDERS = 3
const HOUR = 3_600_000

export type ReminderLead = {
  id: string
  status: string
  created_at: string
  shop_sent_at: string | null
  owner_forwarded_at: string | null
  outcome: string | null
  reminded_at: string | null
  reminder_count: number
}

export type ReminderKind = "unsent" | "quiet"

/**
 * unsent — still "new" and not with the shop 24 h after the golfer asked;
 *          nudged on each daily run.
 * quiet  — sent to the shop 3+ days ago with no outcome recorded; nudged every
 *          3 days.
 * Marking a request "contacted" by hand (the founder phoned the shop) stops the
 * unsent nudge. Requests already with a verified owner are never nudged.
 */
export function reminderKind(lead: ReminderLead, now: Date): ReminderKind | null {
  if (lead.outcome || lead.owner_forwarded_at) return null
  if (lead.status === "booked" || lead.status === "closed") return null
  if (lead.reminder_count >= MAX_REMINDERS) return null

  const age = (iso: string) => now.getTime() - new Date(iso).getTime()
  const sinceReminder = lead.reminded_at ? age(lead.reminded_at) : Infinity

  if (lead.shop_sent_at) {
    return age(lead.shop_sent_at) >= 72 * HOUR && sinceReminder >= 71 * HOUR ? "quiet" : null
  }
  return lead.status === "new" && age(lead.created_at) >= 24 * HOUR && sinceReminder >= 20 * HOUR
    ? "unsent"
    : null
}
