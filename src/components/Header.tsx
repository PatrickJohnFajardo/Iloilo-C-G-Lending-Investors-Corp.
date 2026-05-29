"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import { LogOut, Bell, User, ChevronDown } from "lucide-react";

export default function Header({ title }: { title?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const now = new Date();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  const dateStr = now.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header
      style={{
        height: "3.75rem",
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        gap: "1rem",
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Left: Page Title */}
      <div>
        {title && (
          <h1
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h1>
        )}
        <p
          style={{
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            marginTop: title ? "0.1rem" : 0,
          }}
        >
          {dateStr}
        </p>
      </div>

      {/* Right: Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Notification Bell */}
        <button
          aria-label="Notifications"
          style={{
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: "50%",
            border: "1px solid var(--border-color)",
            background: "var(--bg-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-muted)",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-primary)";
            e.currentTarget.style.color = "var(--accent-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <Bell size={14} />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setDropOpen((d) => !d)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 0.75rem 0.375rem 0.5rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "9999px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
              fontWeight: 500,
              transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-color)";
            }}
          >
            <div
              style={{
                width: "1.5rem",
                height: "1.5rem",
                borderRadius: "50%",
                background: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <User size={10} style={{ color: "var(--bg-primary)" }} />
            </div>
            <span style={{ maxWidth: "8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail ?? "Admin"}
            </span>
            <ChevronDown size={12} style={{ opacity: 0.6 }} />
          </button>

          {/* Dropdown */}
          {dropOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 0.5rem)",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "0.75rem",
                boxShadow: "var(--shadow-elevated)",
                minWidth: "11rem",
                overflow: "hidden",
                animation: "fadeIn 0.15s ease-out",
                zIndex: 99,
              }}
            >
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.125rem" }}>
                  Signed in as
                </p>
                <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", wordBreak: "break-all" }}>
                  {userEmail ?? "—"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: loggingOut ? "var(--text-muted)" : "#EF4444",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  textAlign: "left",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <LogOut size={13} />
                {loggingOut ? "Signing out…" : "Sign Out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
