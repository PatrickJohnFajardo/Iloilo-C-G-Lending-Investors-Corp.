"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DataTable, { ColumnDef } from "@/components/DataTable";
import ExcelExport from "@/components/ExcelExport";
import type { Customer } from "@/lib/types";
import { Users, RefreshCw } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Active"
      ? "badge-active"
      : status === "Inactive"
      ? "badge-inactive"
      : "badge-stop";
  return <span className={`badge ${cls}`}>{status}</span>;
}

const COLLECTORS = ["All", "Baltazar", "Diaz", "Eusoya"];

const COLUMNS: ColumnDef<Customer>[] = [
  { key: "name", label: "Client Name" },
  { key: "address", label: "Area" },
  {
    key: "collector_assigned",
    label: "Collector",
    render: (v) => (
      <span
        style={{
          fontWeight: 500,
          color: "var(--accent-primary)",
          fontSize: "0.8rem",
        }}
      >
        {v ? String(v) : "—"}
      </span>
    ),
  },
  { key: "phone_number", label: "Phone" },
  {
    key: "status",
    label: "Status",
    render: (v) => <StatusBadge status={String(v)} />,
  },
  {
    key: "off_savings_balance",
    label: "OFF Savings",
    render: (v) => (
      <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
        ₱{Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: "rem_savings_balance",
    label: "REM Savings",
    render: (v) => (
      <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
        ₱{Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: "date_stop",
    label: "Date Stop",
    render: (v) =>
      v ? (
        <span style={{ fontSize: "0.8rem", color: "#EF4444" }}>{String(v)}</span>
      ) : (
        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>
      ),
  },
];

export default function CustomersPage() {
  const supabase = createClient();
  const [data, setData] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [collector, setCollector] = useState("All");
  const [status, setStatus] = useState("All");

  async function load() {
    setLoading(true);
    const { data: rows } = await supabase
      .from("customers")
      .select("*")
      .order("name");
    setData((rows as Customer[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let rows = data;
    if (collector !== "All")
      rows = rows.filter((r) => r.collector_assigned === collector);
    if (status !== "All") rows = rows.filter((r) => r.status === status);
    setFiltered(rows);
  }, [data, collector, status]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: "0.25rem",
            }}
          >
            <Users size={20} style={{ color: "var(--accent-primary)" }} />
            Customers
          </h1>
          <div className="accent-divider" style={{ maxWidth: "4rem" }} />
        </div>
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
          <button className="btn-secondary" onClick={load} style={{ gap: "0.375rem" }}>
            <RefreshCw size={13} />
            Refresh
          </button>
          <ExcelExport
            data={filtered as unknown as Record<string, unknown>[]}
            filename="customers"
            sheetName="Customers"
          />
        </div>
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{ padding: "1rem 1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}
      >
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Filters:
        </span>
        {/* Collector Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Collector</label>
          <select
            value={collector}
            onChange={(e) => setCollector(e.target.value)}
            className="form-input"
            style={{ width: "auto", padding: "0.375rem 0.75rem", fontSize: "0.8rem" }}
          >
            {COLLECTORS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {/* Status Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-input"
            style={{ width: "auto", padding: "0.375rem 0.75rem", fontSize: "0.8rem" }}
          >
            {["All", "Active", "Inactive", "Stop"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: "1.25rem", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: "2.5rem", opacity: 1 - i * 0.08 }} />
            ))}
          </div>
        ) : (
          <DataTable
            columns={COLUMNS}
            data={filtered}
            pageSize={15}
            filterKeys={["name", "address", "collector_assigned", "phone_number"]}
            emptyMessage="No customers found for the selected filters."
          />
        )}
      </div>
    </div>
  );
}
