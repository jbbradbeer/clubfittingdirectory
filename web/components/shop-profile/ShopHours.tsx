"use client"

import { useSyncExternalStore } from "react"

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

/* A store with no subscriptions: the client snapshot is the real current day;
   the server snapshot is null (so SSR/build markup highlights nothing and there's
   no hydration mismatch). useSyncExternalStore is the idiomatic way to read a
   client-only value without a setState-in-effect. */
const emptySubscribe = () => () => {}
const getClientDay = () => DAY_NAMES[new Date().getDay()]
const getServerDay = () => null

/**
 * Renders the weekly hours and highlights "today". The current day is read on
 * the client, NOT at build time — listing pages revalidate only once a day, so
 * a server-computed "today" could be up to 24h stale (e.g. Tuesday highlighted
 * on Wednesday).
 */
export function ShopHours({ workingHours }: { workingHours: Record<string, string | string[]> | null }) {
  const todayName = useSyncExternalStore(emptySubscribe, getClientDay, getServerDay)

  return (
    <dl className="space-y-2">
      {DAY_ORDER.map((day) => {
        const rawHours = workingHours?.[day]
        // A day is only "known" if it's actually present in the data. Most shops
        // (~89%) have hours for just some days; the source uses an explicit
        // "Closed" when a shop is genuinely closed. So an ABSENT day means
        // "unknown" (show "—"), NOT "Closed" — don't invent that claim.
        const hasData = rawHours != null
        const hours = Array.isArray(rawHours) ? rawHours.join(", ") : rawHours
        const isToday = day === todayName
        return (
          <div
            key={day}
            className={`flex items-center justify-between text-sm ${
              isToday ? "font-semibold text-[var(--color-charcoal)]" : "text-[var(--color-charcoal-light)]"
            }`}
          >
            <dt className="flex items-center gap-2">
              {isToday && <span className="w-2 h-2 rounded-full bg-[var(--color-gold)]" />}
              {day}
            </dt>
            <dd className={hasData ? "data text-[0.8rem]" : "data text-[0.8rem] text-[var(--color-charcoal-light)]/50"}>
              {hasData ? hours : "—"}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
