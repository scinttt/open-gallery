import Link from "next/link";
import AuthUserButton from "@/components/auth-user-button";
import GalleryGroupManager from "@/components/gallery-group-manager";
import TopNavigationTabs from "@/components/top-navigation-tabs";
import { getArtistBySlug, getArtistGroupBySlug } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function ArtistGroupPage({ params }) {
  const { artistSlug, groupSlug } = await params;
  const [artist, group] = await Promise.all([
    getArtistBySlug(artistSlug),
    getArtistGroupBySlug(artistSlug, groupSlug),
  ]);

  if (!artist || !group) {
    return (
      <main className="page-shell detail-page">
        <div className="missing-state">
          <p className="eyebrow">Missing Group</p>
          <h1>This group could not be found.</h1>
          <Link className="back-link" href="/artists">
            Return to artists
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell detail-page group-page">
      <div className="topbar">
        <span className="topbar-mark">Private Library</span>
        <AuthUserButton />
      </div>

      <TopNavigationTabs activeTab="artists" />

      <div className="detail-body">
        <header className="detail-hero">
          <div>
            <Link className="back-link" href={`/artists/${artistSlug}`}>
              Back to {artist.title}
            </Link>
            <h1>{group.title}</h1>
          </div>
        </header>

        <GalleryGroupManager
          emptyRedirectHref={`/artists/${artistSlug}`}
          group={group}
          note="Use Edit mode when you want to remove a set from this artist."
        />
      </div>
    </main>
  );
}
