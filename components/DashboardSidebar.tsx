"use client";

export type DashboardSection = "account" | "watches" | "notifications";

type Props = {
  activeSection: DashboardSection;
  onSelectSection: (section: "account" | "watches") => void;
  mobileOpen: boolean;
  onClose: () => void;
};

const NAV_ITEMS: { id: DashboardSection; label: string; icon: string; disabled?: boolean; title?: string }[] = [
  { id: "account", label: "My Account", icon: "👤" },
  { id: "watches", label: "My Watches", icon: "🥊" },
  { id: "notifications", label: "Notifications", icon: "🔔", disabled: true, title: "Coming Soon" },
];

export default function DashboardSidebar({ activeSection, onSelectSection, mobileOpen, onClose }: Props) {
  return (
    <>
      <aside className="dashboard-sidebar">
        <nav className="dashboard-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const isDisabled = item.disabled === true;
            return (
              <button
                key={item.id}
                type="button"
                className={`dashboard-sidebar-item ${isActive ? "dashboard-sidebar-item--active" : ""} ${isDisabled ? "dashboard-sidebar-item--disabled" : ""}`}
                onClick={() => {
                  if (isDisabled) return;
                  onSelectSection(item.id as "account" | "watches");
                  onClose();
                }}
                title={item.title}
                disabled={isDisabled}
              >
                <span className="dashboard-sidebar-icon" aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      {mobileOpen && (
        <div
          className="dashboard-sidebar-overlay"
          role="presentation"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
        />
      )}
    </>
  );
}
