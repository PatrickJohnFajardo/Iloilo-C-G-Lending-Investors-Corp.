"use client";

import { useCallback, useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  parseWorkbookFile,
  sheetToRows,
  mapRowsToTable,
  detectTable,
} from "@/lib/excel-parser";
import type { ImportTableTarget, ImportError } from "@/lib/types";

type UploadStatus = "idle" | "parsing" | "uploading" | "done" | "error";

const TABLE_LABELS: Record<ImportTableTarget, string> = {
  customers: "Customers",
  daily_cash_reports: "Daily Cash Reports",
  payroll: "Payroll",
  loans: "Loans",
};

const TABLE_UPSERT_KEYS: Record<ImportTableTarget, string[]> = {
  customers: ["name"],
  daily_cash_reports: ["date", "collector_name"],
  payroll: ["employee_name", "period", "period_month", "period_year"],
  loans: ["customer_id", "date_released"],
};

export default function ExcelImport({
  onImportComplete,
}: {
  onImportComplete?: () => void;
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [detectedTable, setDetectedTable] =
    useState<ImportTableTarget | null>(null);
  const [selectedTable, setSelectedTable] =
    useState<ImportTableTarget | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [upsertCount, setUpsertCount] = useState(0);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [message, setMessage] = useState("");

  // ---- Drag Handlers ----------------------------------------

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  // ---- Parse File -------------------------------------------

  function handleFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
      setStatus("error");
      setMessage("Only .csv, .xlsx, and .xls files are supported.");
      return;
    }
    setFile(f);
    setStatus("parsing");
    setProgress(10);
    setErrors([]);
    setMessage("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const buffer = ev.target!.result as ArrayBuffer;
        const wb = parseWorkbookFile(buffer);
        const { headers, rows } = sheetToRows(wb);
        setRowCount(rows.length);
        setProgress(30);

        const autoTable = detectTable(headers);
        setDetectedTable(autoTable);
        setSelectedTable(autoTable);
        setStatus("idle");
        setProgress(0);
      } catch (err) {
        setStatus("error");
        setMessage("Failed to parse file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(f);
  }

  // ---- Upload -----------------------------------------------

  async function handleUpload() {
    if (!file || !selectedTable) return;
    setStatus("uploading");
    setProgress(10);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const buffer = ev.target!.result as ArrayBuffer;
        const wb = parseWorkbookFile(buffer);
        const { rows } = sheetToRows(wb);
        setProgress(35);

        const { mapped, errors: parseErrors } = mapRowsToTable(
          selectedTable,
          rows
        );
        setErrors(parseErrors);
        setProgress(55);

        if (mapped.length === 0) {
          setStatus("error");
          setMessage(
            `No valid rows to import. ${parseErrors.length} validation errors found.`
          );
          return;
        }

        // Batch upsert in chunks of 200
        const CHUNK = 200;
        let upserted = 0;
        for (let i = 0; i < mapped.length; i += CHUNK) {
          const chunk = mapped.slice(i, i + CHUNK);
          const { error } = await supabase
            .from(selectedTable)
            .upsert(chunk as never[], {
              onConflict: TABLE_UPSERT_KEYS[selectedTable].join(","),
              ignoreDuplicates: false,
            });
          if (error) throw error;
          upserted += chunk.length;
          setProgress(55 + Math.floor(((i + CHUNK) / mapped.length) * 40));
        }

        setProgress(100);
        setUpsertCount(upserted);
        setStatus("done");
        setMessage(
          `Successfully imported ${upserted} records into ${TABLE_LABELS[selectedTable]}.`
        );
        onImportComplete?.();
      } catch (err: unknown) {
        setStatus("error");
        const msg = err instanceof Error ? err.message : "Unknown error";
        setMessage(`Upload failed: ${msg}`);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ---- Reset ------------------------------------------------

  function reset() {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setDetectedTable(null);
    setSelectedTable(null);
    setRowCount(0);
    setUpsertCount(0);
    setErrors([]);
    setMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ---- Render -----------------------------------------------

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/* Drop Zone */}
      {!file && (
        <div
          className={`drop-zone ${dragging ? "active" : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
          <div
            style={{
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "1rem",
              background: "var(--row-hover)",
              border: "1px solid var(--border-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              color: "var(--accent-primary)",
              transition: "transform 0.2s",
            }}
          >
            <Upload size={22} />
          </div>
          <p
            style={{
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "0.375rem",
            }}
          >
            Drop your Excel or CSV file here
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Supports <strong>.xlsx</strong>, <strong>.xls</strong>,{" "}
            <strong>.csv</strong> &mdash; click to browse
          </p>
        </div>
      )}

      {/* File Preview */}
      {file && (
        <div
          className="card"
          style={{
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
          }}
        >
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.625rem",
              background: "rgba(16,185,129,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileSpreadsheet size={18} style={{ color: "#10B981" }} />
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <p
              style={{
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.name}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {rowCount} rows &bull;{" "}
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          {status === "idle" && (
            <button
              onClick={reset}
              aria-label="Remove file"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "0.25rem",
                borderRadius: "0.25rem",
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Table Selector */}
      {file && status !== "uploading" && status !== "done" && (
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: "0.5rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Import Into Table
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={selectedTable ?? ""}
              onChange={(e) =>
                setSelectedTable(e.target.value as ImportTableTarget)
              }
              className="form-input"
              style={{ paddingRight: "2.5rem", appearance: "none" }}
            >
              <option value="" disabled>
                Select target table…
              </option>
              {(Object.keys(TABLE_LABELS) as ImportTableTarget[]).map((t) => (
                <option key={t} value={t}>
                  {TABLE_LABELS[t]}
                  {t === detectedTable ? " (auto-detected)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
          </div>
          {detectedTable && (
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--accent-secondary)",
                marginTop: "0.375rem",
              }}
            >
              ✦ Auto-detected as &ldquo;{TABLE_LABELS[detectedTable]}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {status === "uploading" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.375rem",
            }}
          >
            <span
              style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
            >
              Importing…
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--accent-primary)",
              }}
            >
              {progress}%
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Messages */}
      {status === "done" && (
        <div className="toast toast-success">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
            <CheckCircle size={16} style={{ color: "#10B981", flexShrink: 0, marginTop: "0.1rem" }} />
            <div>
              <p style={{ fontWeight: 600, marginBottom: "0.125rem" }}>Import Successful</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{message}</p>
            </div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="toast toast-error">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
            <AlertCircle size={16} style={{ color: "#EF4444", flexShrink: 0, marginTop: "0.1rem" }} />
            <div>
              <p style={{ fontWeight: 600, marginBottom: "0.125rem" }}>Import Failed</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div
          style={{
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "0.75rem",
            padding: "0.875rem",
            maxHeight: "10rem",
            overflowY: "auto",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#EF4444",
              marginBottom: "0.5rem",
            }}
          >
            {errors.length} validation error{errors.length > 1 ? "s" : ""}:
          </p>
          {errors.slice(0, 10).map((e, i) => (
            <p
              key={i}
              style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}
            >
              Row {e.row}
              {e.column ? ` [${e.column}]` : ""}: {e.message}
            </p>
          ))}
          {errors.length > 10 && (
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              …and {errors.length - 10} more
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {file && (
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {status !== "done" && (
            <button
              className="btn-primary"
              onClick={handleUpload}
              disabled={!selectedTable || status === "uploading"}
              style={{
                flex: 1,
                opacity: !selectedTable || status === "uploading" ? 0.5 : 1,
                cursor: !selectedTable || status === "uploading" ? "not-allowed" : "pointer",
              }}
            >
              {status === "uploading" ? (
                <>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  Importing…
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Import Now
                </>
              )}
            </button>
          )}
          {(status === "done" || status === "error") && (
            <button className="btn-secondary" onClick={reset} style={{ flex: 1 }}>
              Import Another File
            </button>
          )}
        </div>
      )}
    </div>
  );
}
