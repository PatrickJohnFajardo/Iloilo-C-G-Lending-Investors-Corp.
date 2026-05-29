import { createClient } from "@/lib/supabase/server";
import {
  Users,
  ScrollText,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  UserPlus,
} from "lucide-react";

async function getKPIs() {
  const supabase = await createClient();

  const [
    { count: totalCustomers },
    { count: activeLoans },
    { count: defaultedLoans },
    { data: loanTotals },
    { count: newCustomers },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("status", "Active"),
    supabase
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("loan_status", "Active"),
    supabase
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("loan_status", "Defaulted"),
    supabase.from("loans").select("principal_amount").eq("loan_status", "Active"),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(new Date().setDate(1)).toISOString()
      ),
  ]);

  const totalPrincipal = (loanTotals ?? []).reduce(
    (sum, l) => sum + (l.principal_amount ?? 0),
    0
  );

  return {
    totalCustomers: totalCustomers ?? 0,
    activeLoans: activeLoans ?? 0,
    defaultedLoans: defaultedLoans ?? 0,
    totalPrincipal,
    newCustomers: newCustomers ?? 0,
  };
}

function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: "2.75rem",
          height: "2.75rem",
          borderRadius: "0.75rem",
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "0.25rem",
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        {sub && (
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const kpis = await getKPIs();

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: "0.375rem" }}>
          Dashboard Overview
        </h1>
        <div className="accent-divider" style={{ maxWidth: "6rem" }} />
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Real-time snapshot of portfolio health and operations
        </p>
      </div>

      {/* KPI Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))",
          gap: "1rem",
        }}
      >
        <KPICard
          label="Active Customers"
          value={kpis.totalCustomers.toLocaleString()}
          sub="Across all collectors"
          icon={Users}
          accent="#10B981"
        />
        <KPICard
          label="Active Loans"
          value={kpis.activeLoans.toLocaleString()}
          sub="Outstanding promissory notes"
          icon={ScrollText}
          accent="#D4AF37"
        />
        <KPICard
          label="Total Exposure"
          value={fmt(kpis.totalPrincipal)}
          sub="Active loan principal"
          icon={DollarSign}
          accent="#3B82F6"
        />
        <KPICard
          label="Defaulted Loans"
          value={kpis.defaultedLoans.toLocaleString()}
          sub="Requires immediate attention"
          icon={AlertTriangle}
          accent="#EF4444"
        />
        <KPICard
          label="New Customers"
          value={kpis.newCustomers.toLocaleString()}
          sub="This month"
          icon={UserPlus}
          accent="#8B5CF6"
        />
        <KPICard
          label="Portfolio Growth"
          value={kpis.activeLoans > 0 ? `${((kpis.activeLoans / Math.max(1, kpis.totalCustomers)) * 100).toFixed(0)}%` : "0%"}
          sub="Loan-to-customer ratio"
          icon={TrendingUp}
          accent="#F59E0B"
        />
      </div>

      {/* Quick Tip */}
      <div
        style={{
          background: "var(--row-hover)",
          border: "1px solid var(--border-accent)",
          borderRadius: "0.875rem",
          padding: "1rem 1.25rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: "1.75rem",
            height: "1.75rem",
            borderRadius: "50%",
            background: "var(--accent-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "var(--bg-primary)",
          }}
        >
          ✦
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            Import Center Ready
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Navigate to <strong>Import Center</strong> in the sidebar to drag-and-drop your daily Excel/CSV reports. 
            Legacy headers like <em>&ldquo;OFF SAVINGS&rdquo;</em>, <em>&ldquo;CASH ON HAND FORWARDED&rdquo;</em>, and{" "}
            <em>&ldquo;SINKING FUND CONTRI.&rdquo;</em> are automatically mapped to the correct database columns.
          </p>
        </div>
      </div>
    </div>
  );
}
