import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set("og_signin_bypass", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    // session-scoped: expires when browser closes
  });

  return Response.json({ ok: true });
}
