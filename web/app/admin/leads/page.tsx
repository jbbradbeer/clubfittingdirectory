import { redirect } from "next/navigation"

/* Fitting requests live on the unified /admin dashboard (Fitting Requests tab).
   Keep this route so old bookmarks still work. */
export default function LeadsRedirect() {
  redirect("/admin?tab=leads")
}
