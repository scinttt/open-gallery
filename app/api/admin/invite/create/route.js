import { auth } from "@clerk/nextjs/server";
import { createInviteCode } from "@/lib/invite-store";

export const dynamic = "force-dynamic";

function isAdmin(userId) {
  const adminId = process.env.ADMIN_USER_ID;
  return Boolean(adminId && userId === adminId);
}

export async function POST() {
  const { userId } = await auth();

  if (!userId || !isAdmin(userId)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const code = await createInviteCode();
  return Response.json({ ok: true, code });
}
