"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DataTable, { ColumnDef } from "@/components/DataTable";
import ExcelExport from "@/components/ExcelExport";
import type { Payroll } from "@/lib/types";
import { Wallet, RefreshCw } from "lucide-react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function Peso({ value }: { value: unknown }) {
  return (
    <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
      ₱{Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
    </span>
  );
}

const COLUMNS: ColumnDef<Payroll>[] = [
  { key: "employee_name", label: "Employee" },
  { key: "period", label: "Period", render: (v) => <span className="badge badge-active">{String(v)}</span> },
  { key: "period_month", label: "Month", render: (v) => MONTHS[Number(v) - 1] ?? v },
  { key: "period_year", label: "Year" },
  { key: "base_salary", label: "Base Salary", render: (v) => <Peso value={v} /> },
  { key: "sss_deduction", label: "SSS", render: (v) => <Peso value={v} /> },
  { key: "phic_deduction", label: "PhilHealth", render: (v) => <Peso value={v} /> },
  { key: "pag_ibig_deduction", label: "Pag-IBIG", render: (v) => <Peso value={v} /> },
  { key: "cash_bond_deduction", label: "Cash Bond", render: (v) => <Peso value={v} /> },
  { key: "sinking_fund_contribution", label: "Sinking Fund", render: (v) => <Peso value={v} /> },
  { key: "absences", label: "Absences", render: (v) => <Peso value={v} /> },
  { key: "collection_incentive", label: "Incentive", render: (v) => <Peso value={v} /> },
  {
    key: "net_pay",
    label: "Net Pay",
    render: (v) => (
      <span style={{ fontWeight: 700, color: "#10B981", fontFamily: "ui-monospace, monospace" }}>
        ₱{Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function PayrollPage() {
  const supabase = createClient();
  const [data, setData] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("All");
  const [month, setMonth] = useState("All");
  const [year, setYear] = useState(String(currentYear));

  async function load() {
    setLoading(true);
    let q = supabase.from("payroll").select("*").order("period_year", { ascending: false }).order("period_month", { ascending: false });
    if (period !== "All") q = q.eq("period", period);
    if (month !== "All") q = q.eq("period_month", MONTHS.indexOf(month) + 1);
    if (year) q = q.eq("period_year", Number(year));
    const { data: rows } = await q;
    setData((rows as Payroll[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
            <Wallet size={20} style={{ color: "var(--accent-primary)" }} />
            Payroll
          </h1>
          <div className="accent-divider" style={{ maxWidth: "3rem" }} />
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button className="btn-secondary" onClick={load}><RefreshCw size={13} /> Refresh</button>
          <ExcelExport data={data as unknown as Record<string, unknown>[]} filename="payroll" sheetName="Payroll" />
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "1rem 1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Filters:</span>
        {[
          { label: "Period", value: period, options: ["All", "1-15", "16-31"], set: setPeriod },
          { label: "Month", value: month, options: ["All", ...MONTHS], set: setMonth },
          { label: "Year", value: year, options: YEARS.map(String), set: setYear },
        ].map(({ label, value, options, set }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{label}</label>
            <select value={value} onChange={(e) => set(e.target.value)} className="form-input" style={{ width: "auto", padding: "0.375rem 0.75rem", fontSize: "0.8rem" }}>
              {options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
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
          <DataTable columns={COLUMNS} data={data} pageSize={12} filterKeys={["employee_name"]} emptyMessage="No payroll records found." />
        )}
      </div>
    </div>
  );
}
