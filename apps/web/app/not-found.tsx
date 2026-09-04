import { redirect } from "next/navigation";

// Nothing 404s (Masayume's routing law): an unknown path lands on the table with a one-line
// note, because a dead end teaches a visitor nothing and the table always has something true to show.
export default function NotFound() {
  redirect("/play?note=moved");
}
