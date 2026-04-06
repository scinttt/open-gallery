import { auth } from "@clerk/nextjs/server";
import { listInviteCodes } from "@/lib/invite-store";

export const dynamic = "force-dynamic";

function isAdmin(userId) {
  const adminId = process.env.ADMIN_USER_ID;
  return Boolean(adminId && userId === adminId);
}

export async function GET() {
  const { userId } = await auth();

  if (!userId || !isAdmin(userId)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const codes = await listInviteCodes();
  return Response.json({ codes });
}
