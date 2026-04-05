import Link from "next/link";
import AuthUserButton from "@/components/auth-user-button";
import ImageStrip from "@/components/image-strip";
import { getGalleryBySlug } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function GalleryDetailPage({ params }) {
  const { slug } = await params;
  const gallery = await getGalleryBySlug(slug);

  if (!gallery) {
    return (
      <main className="page-shell detail-page">
        <div className="missing-state">
          <p className="eyebrow">Missing Gallery</p>
          <h1>This set could not be found.</h1>
          <Link className="back-link" href="/">
            Return home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell detail-page">
      <div className="topbar">
        <span className="topbar-mark">Private Library</span>
        <AuthUserButton />
      </div>
      <div className="detail-body">
        <header className="detail-hero">
          <div>
            <Link className="back-link" href="/">
              Back to covers
            </Link>
            <h1>{gallery.title}</h1>
          </div>
        </header>

        <div className="detail-reader">
          <ImageStrip gallery={gallery} />
        </div>
      </div>
    </main>
  );
}
