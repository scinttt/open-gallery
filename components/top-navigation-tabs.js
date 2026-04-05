import Link from "next/link";

const TABS = [
  { href: "/", key: "all", label: "All Galleries" },
  { href: "/artists", key: "artists", label: "Artists" },
];

export default function TopNavigationTabs({ activeTab }) {
  return (
    <nav aria-label="Primary navigation" className="top-navigation-tabs">
      {TABS.map((tab) => (
        <Link
          className={`top-navigation-tab${tab.key === activeTab ? " top-navigation-tab-active" : ""}`}
          href={tab.href}
          key={tab.key}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
