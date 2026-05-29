"use client";

import {
  useState,
  useMemo,
  ReactNode,
} from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ColumnDef<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  width?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DataTableProps<T extends Record<string, any>> {
  columns: ColumnDef<T>[];
  data: T[];
  pageSize?: number;
  filterKeys?: (keyof T)[];
  emptyMessage?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  pageSize = 15,
  filterKeys = [],
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // ---- Filter -----------------------------------------------
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) => {
      const keys = filterKeys.length
        ? filterKeys
        : (Object.keys(row) as (keyof T)[]);
      return keys.some((k) =>
        String(row[k] ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, search, filterKeys]);

  // ---- Sort -------------------------------------------------
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // ---- Paginate ---------------------------------------------
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function SortIcon({ colKey }: { colKey: string }) {
    if (sortKey !== colKey)
      return <ChevronsUpDown size={12} style={{ opacity: 0.35 }} />;
    return sortDir === "asc" ? (
      <ChevronUp size={12} style={{ color: "var(--accent-primary)" }} />
    ) : (
      <ChevronDown size={12} style={{ color: "var(--accent-primary)" }} />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Search Bar */}
      <div style={{ position: "relative", maxWidth: "20rem" }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="Search records…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="form-input"
          style={{ paddingLeft: "2.25rem" }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: "0.75rem",
          border: "1px solid var(--border-color)",
        }}
      >
        <table className="data-table" style={{ minWidth: "600px" }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() =>
                    col.sortable !== false && handleSort(String(col.key))
                  }
                  style={{
                    width: col.width,
                    cursor: col.sortable !== false ? "pointer" : "default",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    {col.label}
                    {col.sortable !== false && (
                      <SortIcon colKey={String(col.key)} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    textAlign: "center",
                    padding: "3rem",
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {columns.map((col) => {
                    const val = row[col.key as keyof T];
                    return (
                      <td key={String(col.key)}>
                        {col.render
                          ? col.render(val, row)
                          : val !== null && val !== undefined
                          ? String(val)
                          : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span>
          Showing{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {Math.min((page - 1) * pageSize + 1, sorted.length)}–
            {Math.min(page * pageSize, sorted.length)}
          </strong>{" "}
          of{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {sorted.length}
          </strong>{" "}
          records
        </span>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "0.35rem 0.625rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "0.5rem",
              cursor: page === 1 ? "not-allowed" : "pointer",
              color: page === 1 ? "var(--text-muted)" : "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              opacity: page === 1 ? 0.5 : 1,
              transition: "border-color 0.2s",
            }}
          >
            <ChevronLeft size={14} />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p: number;
            if (totalPages <= 5) p = i + 1;
            else if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: "0.35rem 0.625rem",
                  minWidth: "2rem",
                  background:
                    p === page ? "var(--accent-primary)" : "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  color:
                    p === page ? "var(--bg-primary)" : "var(--text-secondary)",
                  fontWeight: p === page ? 700 : 400,
                  fontSize: "0.8rem",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "0.35rem 0.625rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "0.5rem",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              color:
                page === totalPages ? "var(--text-muted)" : "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
