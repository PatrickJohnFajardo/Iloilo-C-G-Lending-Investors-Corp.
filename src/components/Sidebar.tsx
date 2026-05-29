"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileBarChart2,
  Wallet,
  ScrollText,
  Upload,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/dcr", label: "Cash Reports", icon: FileBarChart2 },
  { href: "/dashboard/payroll", label: "Payroll", icon: Wallet },
  { href: "/dashboard/loans", label: "Loans", icon: ScrollText },
  { href: "/dashboard/import", label: "Import Center", icon: Upload },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? "4.5rem" : "15rem",
        minHeight: "100vh",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "1.5rem 0" : "1.5rem 1.25rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          overflow: "hidden",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <div
          style={{
            width: "2rem",
            height: "2rem",
            borderRadius: "0.5rem",
            background: "var(--accent-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Building2
            size={16}
            style={{ color: "var(--bg-primary)", flexShrink: 0 }}
          />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent-primary)",
                whiteSpace: "nowrap",
              }}
            >
              LendPortal
            </div>
            <div
              style={{
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                letterSpacing: "0.02em",
              }}
            >
              Management System
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav
        style={{
          flex: 1,
          padding: "0.75rem 0.625rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.125rem",
        }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link key={href} href={href}>
              <div
                className="sidebar-link"
                data-active={isActive}
                style={{
                  justifyContent: collapsed ? "center" : "flex-start",
                  color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
                  background: isActive ? "var(--row-hover)" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                  position: "relative",
                  overflow: "hidden",
                  padding: collapsed ? "0.65rem" : "0.65rem 1rem",
                }}
                title={collapsed ? label : undefined}
              >
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "0.3rem",
                      bottom: "0.3rem",
                      width: "3px",
                      background: "var(--accent-primary)",
                      borderRadius: "0 9999px 9999px 0",
                    }}
                  />
                )}
                <Icon
                  size={16}
                  style={{ flexShrink: 0, color: "inherit" }}
                />
                {!collapsed && (
                  <span style={{ whiteSpace: "nowrap", fontSize: "0.875rem" }}>
                    {label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div
        style={{
          padding: "0.75rem 0.625rem",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: "0.625rem",
            padding: "0.5rem",
            background: "transparent",
            border: "1px solid var(--border-color)",
            borderRadius: "0.5rem",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.8rem",
            transition: "border-color 0.2s, color 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-primary)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
