import Link from "next/link";
import AuthUserButton from "@/components/auth-user-button";
import { GalleryGroupCard } from "@/components/gallery-group-card";
import GalleryGroupManager from "@/components/gallery-group-manager";
import TopNavigationTabs from "@/components/top-navigation-tabs";
import { getArtistBySlug } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function ArtistDetailPage({ params }) {
  const { artistSlug } = await params;
  const artist = await getArtistBySlug(artistSlug);

  if (!artist) {
    return (
      <main className="page-shell detail-page">
        <div className="missing-state">
          <p className="eyebrow">Missing Artist</p>
          <h1>This artist could not be found.</h1>
          <Link className="back-link" href="/artists">
            Return to artists
          </Link>
        </div>
      </main>
    );
  }

  const useGroups = artist.groups !== null;

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
            <Link className="back-link" href="/artists">
              Back to artists
            </Link>
            <h1>{artist.title}</h1>
          </div>
        </header>

        {useGroups ? (
          <>
            <header className="section-heading">
              <div>
                <p className="eyebrow">{artist.galleryCount} sets</p>
                <h2>Every 10 sets in one block</h2>
              </div>
            </header>
            <section className="gallery-grid" aria-label={`${artist.title} groups`}>
              {artist.groups.map((group) => (
                <GalleryGroupCard
                  group={group}
                  hrefPrefix={`/artists/${artistSlug}`}
                  key={group.slug}
                />
              ))}
            </section>
          </>
        ) : (
          <GalleryGroupManager
            emptyRedirectHref="/artists"
            group={{
              title: artist.title,
              galleries: artist.galleries,
            }}
            note="Use Edit mode when you want to remove a set from this artist."
          />
        )}
      </div>
    </main>
  );
}
