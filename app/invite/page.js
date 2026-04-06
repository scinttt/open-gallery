import { redirect } from "next/navigation";
import InviteForm from "./invite-form";

export const dynamic = "force-dynamic";

export default function InvitePage() {
  if (!process.env.ADMIN_USER_ID) {
    redirect("/sign-in");
  }

  return <InviteForm />;
}
