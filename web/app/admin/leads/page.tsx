import { redirect } from "next/navigation"

/* Fitting requests now live on the unified /admin dashboard.
   Keep this route so old bookmarks still work. */
export default function LeadsRedirect() {
  redirect("/admin")
}
