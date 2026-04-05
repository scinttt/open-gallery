import { auth } from "@clerk/nextjs/server";
import { CLERK_ENABLED } from "@/lib/auth-config";
import { moveGalleryToTrashBySlug } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export async function POST(_request, { params }) {
  if (CLERK_ENABLED) {
    await auth.protect();
  }

  const { slug } = await params;

  try {
    const result = await moveGalleryToTrashBySlug(slug);

    if (!result) {
      return Response.json(
        { error: "Gallery not found." },
        { status: 404 },
      );
    }

    return Response.json({
      ok: true,
      slug: result.slug,
      title: result.title,
    });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    const message =
      status >= 500
        ? "Unable to move this set to trash right now."
        : error.message;

    return Response.json({ error: message }, { status });
  }
}
