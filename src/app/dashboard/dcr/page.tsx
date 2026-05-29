"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DataTable, { ColumnDef } from "@/components/DataTable";
import ExcelExport from "@/components/ExcelExport";
import type { DailyCashReport } from "@/lib/types";
import { FileBarChart2, RefreshCw } from "lucide-react";

const COLUMNS: ColumnDef<DailyCashReport>[] = [
  { key: "date", label: "Date", render: (v) => <span style={{ fontWeight: 600 }}>{String(v)}</span> },
  { key: "collector_name", label: "Collector", render: (v) => <span style={{ color: "var(--accent-primary)", fontWeight: 500 }}>{String(v)}</span> },
  {
    key: "cash_on_hand_forwarded",
    label: "COH Forwarded",
    render: (v) => <Peso value={v} />,
  },
  { key: "service_fee_collected", label: "Service Fee", render: (v) => <Peso value={v} /> },
  { key: "advance_collection", label: "Advance Coll.", render: (v) => <Peso value={v} /> },
  { key: "penalty_collected", label: "Penalty", render: (v) => <Peso value={v} />, },
  { key: "loan_releases_total", label: "Releases", render: (v) => <Peso value={v} negative /> },
  { key: "meals_expense", label: "Meals", render: (v) => <Peso value={v} negative /> },
  { key: "transpo_expense", label: "Transpo", render: (v) => <Peso value={v} negative /> },
  { key: "office_supplies_expense", label: "Office Suppl.", render: (v) => <Peso value={v} negative /> },
  {
    key: "net_cash_on_hand",
    label: "Net COH",
    render: (v) => (
      <span style={{ fontWeight: 700, color: Number(v) >= 0 ? "#10B981" : "#EF4444", fontFamily: "ui-monospace, monospace" }}>
        ₱{Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
];

function Peso({ value, negative }: { value: unknown; negative?: boolean }) {
  const n = Number(value);
  return (
    <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem", color: negative && n > 0 ? "#F87171" : "inherit" }}>
      ₱{n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
    </span>
  );
}

export default function DCRPage() {
  const supabase = createClient();
  const [data, setData] = useState<DailyCashReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [collector, setCollector] = useState("All");
  const [collectors, setCollectors] = useState<string[]>(["All"]);

  async function load() {
    setLoading(true);
    let q = supabase.from("daily_cash_reports").select("*").order("date", { ascending: false });
    if (dateFrom) q = q.gte("date", dateFrom);
    if (dateTo) q = q.lte("date", dateTo);
    if (collector !== "All") q = q.eq("collector_name", collector);
    const { data: rows } = await q;
    const cast = (rows as DailyCashReport[]) ?? [];
    setData(cast);
    // Build unique collector list
    const unique = ["All", ...Array.from(new Set(cast.map((r) => r.collector_name))).sort()];
    setCollectors(unique);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
            <FileBarChart2 size={20} style={{ color: "var(--accent-primary)" }} />
            Daily Cash Reports
          </h1>
          <div className="accent-divider" style={{ maxWidth: "4rem" }} />
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button className="btn-secondary" onClick={load}><RefreshCw size={13} /> Refresh</button>
          <ExcelExport data={data as unknown as Record<string, unknown>[]} filename="daily_cash_reports" sheetName="DCR" />
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "1rem 1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Filters:</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input" style={{ width: "auto", padding: "0.375rem 0.75rem", fontSize: "0.8rem" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input" style={{ width: "auto", padding: "0.375rem 0.75rem", fontSize: "0.8rem" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Collector</label>
          <select value={collector} onChange={(e) => setCollector(e.target.value)} className="form-input" style={{ width: "auto", padding: "0.375rem 0.75rem", fontSize: "0.8rem" }}>
            {collectors.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={load} style={{ fontSize: "0.8rem", padding: "0.4rem 0.875rem" }}>Apply</button>
      </div>

      <div className="card" style={{ padding: "1.25rem", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: "2.5rem", opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        ) : (
          <DataTable columns={COLUMNS} data={data} pageSize={12} filterKeys={["date", "collector_name"]} emptyMessage="No DCR records found." />
        )}
      </div>
    </div>
  );
}
