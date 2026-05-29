"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DataTable, { ColumnDef } from "@/components/DataTable";
import ExcelExport from "@/components/ExcelExport";
import type { Loan } from "@/lib/types";
import { ScrollText, RefreshCw } from "lucide-react";

function LoanStatusBadge({ status }: { status: string }) {
  const cls =
    status === "Active" ? "badge-active"
    : status === "Paid" ? "badge-paid"
    : status === "Defaulted" ? "badge-defaulted"
    : "badge-inactive";
  return <span className={`badge ${cls}`}>{status}</span>;
}

function Peso({ value }: { value: unknown }) {
  return (
    <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
      ₱{Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
    </span>
  );
}

type LoanWithCustomer = Loan & {
  customers: { name: string; collector_assigned: string | null } | null;
};

const COLUMNS: ColumnDef<LoanWithCustomer>[] = [
  {
    key: "customers",
    label: "Borrower",
    render: (_, row) => (
      <div>
        <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{row.customers?.name ?? "—"}</p>
        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{row.customers?.collector_assigned ?? ""}</p>
      </div>
    ),
    sortable: false,
  },
  { key: "principal_amount", label: "Principal", render: (v) => <Peso value={v} /> },
  { key: "term_length", label: "Term" },
  { key: "daily_installment_expected", label: "Daily Install.", render: (v) => <Peso value={v} /> },
  { key: "date_released", label: "Released" },
  {
    key: "due_date",
    label: "Due Date",
    render: (v) => {
      if (!v) return <span style={{ color: "var(--text-muted)" }}>—</span>;
      const overdue = new Date(String(v)) < new Date();
      return <span style={{ color: overdue ? "#EF4444" : "inherit", fontWeight: overdue ? 600 : 400 }}>{String(v)}</span>;
    },
  },
  {
    key: "penalty_rate",
    label: "Penalty/Day",
    render: (v) => <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>{(Number(v) * 100).toFixed(0)}%</span>,
  },
  {
    key: "loan_status",
    label: "Status",
    render: (v) => <LoanStatusBadge status={String(v)} />,
  },
  { key: "remarks", label: "Remarks", sortable: false },
];

export default function LoansPage() {
  const supabase = createClient();
  const [data, setData] = useState<LoanWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loanStatus, setLoanStatus] = useState("All");

  async function load() {
    setLoading(true);
    let q = supabase
      .from("loans")
      .select("*, customers(name, collector_assigned)")
      .order("date_released", { ascending: false });
    if (loanStatus !== "All") q = q.eq("loan_status", loanStatus);
    const { data: rows } = await q;
    setData((rows as LoanWithCustomer[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const exportData = data.map((r) => ({
    ...r,
    borrower_name: r.customers?.name,
    collector: r.customers?.collector_assigned,
    customers: undefined,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
            <ScrollText size={20} style={{ color: "var(--accent-primary)" }} />
            Loans (Promissory Notes)
          </h1>
          <div className="accent-divider" style={{ maxWidth: "4rem" }} />
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button className="btn-secondary" onClick={load}><RefreshCw size={13} /> Refresh</button>
          <ExcelExport data={exportData as unknown as Record<string, unknown>[]} filename="loans" sheetName="Loans" />
        </div>
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: "1rem 1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Filter Status:</span>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["All", "Active", "Paid", "Defaulted", "Restructured"].map((s) => (
            <button
              key={s}
              onClick={() => { setLoanStatus(s); }}
              style={{
                padding: "0.3rem 0.875rem",
                borderRadius: "9999px",
                border: `1px solid ${loanStatus === s ? "var(--accent-primary)" : "var(--border-color)"}`,
                background: loanStatus === s ? "var(--accent-primary)" : "transparent",
                color: loanStatus === s ? "var(--bg-primary)" : "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={load} style={{ marginLeft: "auto", fontSize: "0.8rem", padding: "0.4rem 0.875rem" }}>Apply</button>
      </div>

      <div className="card" style={{ padding: "1.25rem", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: "2.75rem", opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        ) : (
          <DataTable
            columns={COLUMNS}
            data={data}
            pageSize={12}
            filterKeys={["date_released", "due_date", "term_length", "loan_status"]}
            emptyMessage="No loan records found."
          />
        )}
      </div>
    </div>
  );
}
