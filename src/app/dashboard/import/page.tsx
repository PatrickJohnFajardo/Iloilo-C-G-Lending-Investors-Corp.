"use client";

import ExcelImport from "@/components/ExcelImport";
import { Upload, Info } from "lucide-react";
import { useState } from "react";

const HEADER_EXAMPLES = [
  { legacy: "OFF SAVINGS", mapped: "off_savings_balance", table: "customers" },
  { legacy: "REM. SAVINGS", mapped: "rem_savings_balance", table: "customers" },
  { legacy: "CASH ON HAND FORWARDED", mapped: "cash_on_hand_forwarded", table: "daily_cash_reports" },
  { legacy: "SINKING FUND CONTRI.", mapped: "sinking_fund_contribution", table: "payroll" },
  { legacy: "PAG-IBIG", mapped: "pag_ibig_deduction", table: "payroll" },
  { legacy: "PHIC", mapped: "phic_deduction", table: "payroll" },
  { legacy: "COLLECTOR", mapped: "collector_assigned", table: "customers" },
  { legacy: "NET COH", mapped: "net_cash_on_hand", table: "daily_cash_reports" },
];

export default function ImportCenterPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "56rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
          <Upload size={20} style={{ color: "var(--accent-primary)" }} />
          Import Center
        </h1>
        <div className="accent-divider" style={{ maxWidth: "4rem" }} />
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Upload your daily Excel or CSV reports. The system auto-detects the target table and maps legacy column headers automatically.
        </p>
      </div>

      {/* Import Widget */}
      <div className="card" style={{ padding: "1.75rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.25rem" }}>
          Upload File
        </h2>
        <ExcelImport onImportComplete={() => setRefreshKey((k) => k + 1)} />
      </div>

      {/* Header Mapping Reference */}
      <div className="card" style={{ padding: "1.5rem", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
          <Info size={16} style={{ color: "var(--accent-primary)" }} />
          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Legacy Header Mapping Reference
          </h2>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          These legacy Excel column names are automatically recognized and mapped to the correct database columns.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr>
                {["Legacy Excel Header", "Database Column", "Table"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 0.875rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HEADER_EXAMPLES.map((ex, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--row-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "0.625rem 0.875rem", fontFamily: "ui-monospace, monospace", color: "#F59E0B", fontSize: "0.75rem" }}>
                    &quot;{ex.legacy}&quot;
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem", fontFamily: "ui-monospace, monospace", color: "#10B981", fontSize: "0.75rem" }}>
                    {ex.mapped}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <span className="badge badge-inactive" style={{ textTransform: "none", fontSize: "0.7rem" }}>{ex.table}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="card" style={{ padding: "1.25rem", background: "var(--row-hover)" }}>
        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.625rem" }}>💡 Import Tips</p>
        <ul style={{ fontSize: "0.8rem", color: "var(--text-muted)", paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <li>Headers are matched <strong>case-insensitively</strong> — <code>OFF SAVINGS</code>, <code>Off Savings</code>, and <code>off savings</code> all work.</li>
          <li>Existing records are <strong>upserted</strong> (updated if matching key found, inserted if new).</li>
          <li>Peso amounts with <code>₱</code> signs and commas are automatically cleaned (e.g., <code>₱1,500.00</code> → <code>1500.00</code>).</li>
          <li>Generated columns like <strong>Net COH</strong> and <strong>Net Pay</strong> are automatically computed by the database — skip them in your import file.</li>
          <li>Rows with missing required fields are skipped and reported as validation errors.</li>
        </ul>
      </div>
    </div>
  );
}
