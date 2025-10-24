// This simple page redirects to the hubs dashboard. Some login flows use
// `/dashboard` as the callback URL after authentication. By redirecting
// immediately to `/dashboard/hub`, we avoid serving a 404 page.

import { redirect } from "next/navigation";

export default function DashboardIndex() {
  redirect("/dashboard/hub");
  return null;
}