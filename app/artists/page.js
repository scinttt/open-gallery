import AuthUserButton from "@/components/auth-user-button";
import ArtistCard from "@/components/artist-card";
import TopNavigationTabs from "@/components/top-navigation-tabs";
import { getArtistSummaries } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  const artists = await getArtistSummaries();
  const totalSets = artists.reduce((total, artist) => total + artist.galleryCount, 0);

  return (
    <main className="page-shell home-page">
      <div className="topbar">
        <span className="topbar-mark">Open Gallery</span>
        <AuthUserButton />
      </div>

      <TopNavigationTabs activeTab="artists" />

      <header className="section-heading">
        <div>
          <p className="eyebrow">Artists</p>
          <h2>Browse by creator folder</h2>
        </div>
        <p className="detail-description">
          {artists.length} artists and {totalSets} sets are available in the current
          library root.
        </p>
      </header>

      {artists.length ? (
        <section className="gallery-grid" aria-label="Artist grid">
          {artists.map((artist) => (
            <ArtistCard artist={artist} key={artist.slug} />
          ))}
        </section>
      ) : (
        <section className="missing-state compact-missing-state">
          <div>
            <p className="eyebrow">No Artists</p>
            <h1>No artist folders were found.</h1>
            <p className="detail-description">
              Put artist directories under `GALLERY_SOURCE_DIR`, then place each set
              inside its matching artist folder.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
