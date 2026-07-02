import { redirect } from "next/navigation"

/* Outreach now lives on the unified /admin dashboard (Outreach tab).
   Keep this route so old bookmarks still work. */
export default function OutreachRedirect() {
  redirect("/admin?tab=outreach")
}
