import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import AuthUserButton from "@/components/auth-user-button";
import { GalleryGroupCard } from "@/components/gallery-group-card";
import TopNavigationTabs from "@/components/top-navigation-tabs";
import { CLERK_ENABLED } from "@/lib/auth-config";
import { getGalleryGroups } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const groups = await getGalleryGroups();
  const totalSets = groups.reduce((total, group) => total + group.galleryCount, 0);

  let isAdmin = false;
  if (CLERK_ENABLED) {
    const { userId } = await auth();
    isAdmin = Boolean(
      userId && process.env.ADMIN_USER_ID && userId === process.env.ADMIN_USER_ID,
    );
  }

  return (
    <main className="page-shell home-page">
      <div className="topbar">
        <span className="topbar-mark">Open Gallery</span>
        {isAdmin ? (
          <Link className="admin-invite-link" href="/admin/invite">
            Invites
          </Link>
        ) : null}
        <AuthUserButton />
      </div>

      <TopNavigationTabs activeTab="all" />

      <header className="section-heading">
        <div>
          <p className="eyebrow">All Galleries</p>
          <h2>Every 10 sets in one block</h2>
        </div>
        <p className="detail-description">
          {totalSets} sets from every artist are grouped into {groups.length} blocks,
          so older galleries stay reachable without endless scrolling.
        </p>
      </header>

      <section className="gallery-grid" aria-label="Gallery group grid">
        {groups.map((group) => (
          <GalleryGroupCard group={group} key={group.slug} />
        ))}
      </section>
    </main>
  );
}
