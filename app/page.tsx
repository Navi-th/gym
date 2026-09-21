import { redirect } from "next/navigation";

/**
 * There is no public site. This project IS the admin panel, so the root simply
 * forwards to it — a 404 at the root of the only app you have is just noise.
 */
export default function Page() {
  redirect("/admin");
}
