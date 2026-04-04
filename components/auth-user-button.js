import { UserButton } from "@clerk/nextjs";
import { CLERK_ENABLED } from "@/lib/auth-config";

export default function AuthUserButton() {
  if (!CLERK_ENABLED) {
    return null;
  }

  return <UserButton />;
}
