"use client"

import { ChevronDown } from "lucide-react"
import { DAYS, TIME_OPTIONS, formatTime, type Day } from "@/lib/submission-details"
import { fieldClass } from "@/lib/form-styles"

export type HoursForm = Record<Day, { status: "" | "open" | "closed"; open: string; close: string }>

export const emptyHours = (): HoursForm =>
  Object.fromEntries(DAYS.map((d) => [d, { status: "", open: "09:00", close: "17:00" }])) as HoursForm

const WEEKDAYS: Day[] = ["Tuesday", "Wednesday", "Thursday", "Friday"]
const compact = `${fieldClass} !px-3 !py-2 text-sm`

/** Optional opening hours. A day left on "Not sure" is stored as unknown. */
export function HoursFields({ value, onChange }: { value: HoursForm; onChange: (next: HoursForm) => void }) {
  const set = (day: Day, patch: Partial<HoursForm[Day]>) =>
    onChange({ ...value, [day]: { ...value[day], ...patch } })
  const copyMonday = () =>
    onChange({ ...value, ...Object.fromEntries(WEEKDAYS.map((d) => [d, { ...value.Monday }])) })

  return (
    <details className="group border border-[var(--color-border)] rounded-lg">
      <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none text-sm text-[var(--color-charcoal)] [&::-webkit-details-marker]:hidden">
        <span>Opening hours <span className="text-[var(--color-charcoal-light)]">(optional)</span></span>
        <ChevronDown size={16} className="text-[var(--color-charcoal-light)] transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 space-y-3">
        {DAYS.map((day) => {
          const d = value[day]
          const badRange = d.status === "open" && d.open >= d.close
          return (
            <div key={day}>
              <div className="grid grid-cols-2 sm:grid-cols-[6.5rem_1fr_1fr_1fr] gap-2 items-center">
                <span className="text-sm text-[var(--color-charcoal)]">{day}</span>
                <select
                  aria-label={`${day}: open or closed`}
                  value={d.status}
                  onChange={(e) => set(day, { status: e.target.value as HoursForm[Day]["status"] })}
                  className={compact}
                >
                  <option value="">Not sure</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
                {d.status === "open" && (
                  <>
                    <TimeSelect label={`${day} opens`} value={d.open} onChange={(open) => set(day, { open })} />
                    <TimeSelect label={`${day} closes`} value={d.close} onChange={(close) => set(day, { close })} />
                  </>
                )}
              </div>
              {badRange && <p className="mt-1 text-xs text-red-600">Closing time must be after opening time.</p>}
              {day === "Monday" && d.status !== "" && (
                <button
                  type="button"
                  onClick={copyMonday}
                  className="mt-2 text-xs font-semibold text-[var(--color-forest)] underline cursor-pointer"
                >
                  Copy Monday to Tuesday–Friday
                </button>
              )}
            </div>
          )
        })}
      </div>
    </details>
  )
}

function TimeSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={compact}>
      {TIME_OPTIONS.map((t) => (
        <option key={t} value={t}>{formatTime(t)}</option>
      ))}
    </select>
  )
}
