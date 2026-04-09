import { auth } from "@clerk/nextjs/server";
import { CLERK_ENABLED } from "@/lib/auth-config";
import { warmCoverCache } from "@/lib/cache-warm";

export const dynamic = "force-dynamic";

export async function POST() {
  if (CLERK_ENABLED) {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;

    if (!userId || !adminId || userId !== adminId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const result = await warmCoverCache();
  return Response.json(result);
}
