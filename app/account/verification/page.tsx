import { redirect } from "next/navigation";

export default function ArtistVerificationRedirect() {
  redirect("/account/settings/artist");
}
