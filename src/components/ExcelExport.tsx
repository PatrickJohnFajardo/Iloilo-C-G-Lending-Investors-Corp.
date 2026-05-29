"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { tableDataToWorkbook, downloadWorkbook } from "@/lib/excel-parser";

interface ExcelExportProps<T extends Record<string, unknown>> {
  data: T[];
  filename?: string;
  sheetName?: string;
  label?: string;
}

export default function ExcelExport<T extends Record<string, unknown>>({
  data,
  filename = "export",
  sheetName = "Sheet1",
  label = "Export Excel",
}: ExcelExportProps<T>) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (!data.length) return;
    setLoading(true);
    try {
      // Small delay to show loading state for UX feedback
      await new Promise((r) => setTimeout(r, 150));
      const wb = tableDataToWorkbook(data, sheetName);
      const timestamp = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      downloadWorkbook(wb, `${filename}_${timestamp}.xlsx`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="btn-secondary"
      onClick={handleExport}
      disabled={loading || !data.length}
      style={{
        opacity: data.length === 0 ? 0.5 : 1,
        cursor: data.length === 0 ? "not-allowed" : "pointer",
      }}
      title={data.length === 0 ? "No data to export" : `Export ${data.length} rows to Excel`}
    >
      {loading ? (
        <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <Download size={14} />
      )}
      {loading ? "Exporting…" : label}
    </button>
  );
}
