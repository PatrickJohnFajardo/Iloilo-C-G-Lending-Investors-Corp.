// ============================================================
// Excel / CSV Parser + Header Mapping Engine
// Maps legacy column headers → Supabase DB columns
// ============================================================
import * as XLSX from "xlsx";
import type {
  Customer,
  DailyCashReport,
  Payroll,
  Loan,
  ImportTableTarget,
  ImportError,
} from "@/lib/types";

// ---- Header Alias Maps ------------------------------------

/** Maps every known legacy header variation → canonical DB column name */
const CUSTOMER_HEADER_MAP: Record<string, string> = {
  // Name
  name: "name",
  "client name": "name",
  "borrower": "name",
  "borrower name": "name",
  "full name": "name",
  // Address
  address: "address",
  area: "address",
  location: "address",
  barangay: "address",
  // Collector
  collector: "collector_assigned",
  "collector assigned": "collector_assigned",
  "assigned collector": "collector_assigned",
  "agent": "collector_assigned",
  // Phone
  phone: "phone_number",
  "phone number": "phone_number",
  "mobile": "phone_number",
  "contact": "phone_number",
  "contact no": "phone_number",
  "contact number": "phone_number",
  // Status
  status: "status",
  // Date Stop
  "date stop": "date_stop",
  "stop date": "date_stop",
  // Savings
  "off savings": "off_savings_balance",
  "off savings balance": "off_savings_balance",
  "savings off": "off_savings_balance",
  "rem savings": "rem_savings_balance",
  "rem. savings": "rem_savings_balance",
  "remaining savings": "rem_savings_balance",
  "remaining savings balance": "rem_savings_balance",
  "savings remaining": "rem_savings_balance",
};

const DCR_HEADER_MAP: Record<string, string> = {
  date: "date",
  collector: "collector_name",
  "collector name": "collector_name",
  "cash on hand forwarded": "cash_on_hand_forwarded",
  "cash forwarded": "cash_on_hand_forwarded",
  "forwarded cash": "cash_on_hand_forwarded",
  "coh forwarded": "cash_on_hand_forwarded",
  "service fee": "service_fee_collected",
  "service fee collected": "service_fee_collected",
  "advance collection": "advance_collection",
  "advance": "advance_collection",
  "penalty": "penalty_collected",
  "penalty collected": "penalty_collected",
  "loan releases": "loan_releases_total",
  "loan release": "loan_releases_total",
  "releases": "loan_releases_total",
  "total releases": "loan_releases_total",
  meals: "meals_expense",
  "meal": "meals_expense",
  transpo: "transpo_expense",
  transportation: "transpo_expense",
  "office supplies": "office_supplies_expense",
  "supplies": "office_supplies_expense",
  "net cash on hand": "net_cash_on_hand",
  "net coh": "net_cash_on_hand",
};

const PAYROLL_HEADER_MAP: Record<string, string> = {
  "employee name": "employee_name",
  employee: "employee_name",
  name: "employee_name",
  period: "period",
  month: "period_month",
  year: "period_year",
  "period month": "period_month",
  "period year": "period_year",
  "base salary": "base_salary",
  salary: "base_salary",
  "basic salary": "base_salary",
  "basic pay": "base_salary",
  "cash bond": "cash_bond_deduction",
  "cash bond deduction": "cash_bond_deduction",
  sss: "sss_deduction",
  "sss deduction": "sss_deduction",
  "sss contribution": "sss_deduction",
  phic: "phic_deduction",
  philhealth: "phic_deduction",
  "phic deduction": "phic_deduction",
  "pagibig": "pag_ibig_deduction",
  "pag-ibig": "pag_ibig_deduction",
  "pag ibig": "pag_ibig_deduction",
  "pag-ibig deduction": "pag_ibig_deduction",
  "sinking fund": "sinking_fund_contribution",
  "sinking fund contri": "sinking_fund_contribution",
  "sinking fund contri.": "sinking_fund_contribution",
  "sinking fund contribution": "sinking_fund_contribution",
  absences: "absences",
  absence: "absences",
  "collection incentive": "collection_incentive",
  incentive: "collection_incentive",
  "net pay": "net_pay",
  netpay: "net_pay",
};

const LOAN_HEADER_MAP: Record<string, string> = {
  "customer id": "customer_id",
  customer: "customer_id",
  "principal": "principal_amount",
  "principal amount": "principal_amount",
  "loan amount": "principal_amount",
  "amount": "principal_amount",
  "term": "term_length",
  "term length": "term_length",
  "daily installment": "daily_installment_expected",
  "daily payment": "daily_installment_expected",
  "installment": "daily_installment_expected",
  "date released": "date_released",
  "release date": "date_released",
  "due date": "due_date",
  "maturity date": "due_date",
  "penalty rate": "penalty_rate",
  "penalty": "penalty_rate",
  "status": "loan_status",
  "loan status": "loan_status",
  "remarks": "remarks",
  "notes": "remarks",
};

const TABLE_HEADER_MAPS: Record<ImportTableTarget, Record<string, string>> = {
  customers: CUSTOMER_HEADER_MAP,
  daily_cash_reports: DCR_HEADER_MAP,
  payroll: PAYROLL_HEADER_MAP,
  loans: LOAN_HEADER_MAP,
};

// ---- Normalise Header Key ----------------------------------

function normaliseKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[_\-\/\\|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---- Parse Raw Rows ----------------------------------------

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, unknown>[];
  unmappedHeaders: string[];
}

export function parseWorkbookFile(file: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(file, { type: "array", cellDates: true });
}

export function sheetToRows(wb: XLSX.WorkBook, sheetIndex = 0): ParsedSheet {
  const sheetName = wb.SheetNames[sheetIndex];
  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw: false, // convert dates to strings
  });

  if (!raw.length) {
    return { headers: [], rows: [], unmappedHeaders: [] };
  }

  const headers = Object.keys(raw[0]);
  return { headers, rows: raw, unmappedHeaders: [] };
}

// ---- Map Headers to DB Columns ----------------------------

export function mapRowsToTable(
  table: ImportTableTarget,
  rows: Record<string, unknown>[]
): { mapped: Record<string, unknown>[]; errors: ImportError[] } {
  const headerMap = TABLE_HEADER_MAPS[table];
  const mapped: Record<string, unknown>[] = [];
  const errors: ImportError[] = [];

  rows.forEach((row, idx) => {
    const newRow: Record<string, unknown> = {};

    for (const [rawKey, value] of Object.entries(row)) {
      const normKey = normaliseKey(rawKey);
      const dbColumn = headerMap[normKey];

      if (dbColumn && dbColumn !== "net_cash_on_hand" && dbColumn !== "net_pay") {
        // Skip generated columns — Supabase computes them
        newRow[dbColumn] = cleanValue(dbColumn, value);
      }
      // Silently skip unmapped columns (they may be totals, notes, etc.)
    }

    // Validate required fields per table
    const rowErrors = validateRow(table, newRow, idx + 2); // +2: 1-indexed + header row
    if (rowErrors.length) {
      errors.push(...rowErrors);
    } else {
      mapped.push(newRow);
    }
  });

  return { mapped, errors };
}

// ---- Value Coercion ----------------------------------------

function cleanValue(column: string, value: unknown): unknown {
  if (value === null || value === undefined || value === "") return null;

  const str = String(value).trim();

  // Numeric columns
  const numericColumns = new Set([
    "off_savings_balance", "rem_savings_balance",
    "cash_on_hand_forwarded", "service_fee_collected",
    "advance_collection", "penalty_collected",
    "loan_releases_total", "meals_expense", "transpo_expense",
    "office_supplies_expense",
    "base_salary", "cash_bond_deduction", "sss_deduction",
    "phic_deduction", "pag_ibig_deduction", "sinking_fund_contribution",
    "absences", "collection_incentive",
    "principal_amount", "daily_installment_expected", "penalty_rate",
    "period_month", "period_year",
  ]);

  if (numericColumns.has(column)) {
    const num = parseFloat(str.replace(/[₱,\s]/g, ""));
    return isNaN(num) ? 0 : num;
  }

  // Status normalization
  if (column === "status") {
    const s = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    if (["Active", "Inactive", "Stop"].includes(s)) return s;
    return "Active";
  }

  if (column === "loan_status") {
    const s = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    if (["Active", "Paid", "Defaulted", "Restructured"].includes(s)) return s;
    return "Active";
  }

  if (column === "period") {
    if (["1-15", "16-31"].includes(str)) return str;
    const num = parseInt(str);
    return num <= 15 ? "1-15" : "16-31";
  }

  // Date columns
  if (["date", "date_stop", "date_released", "due_date"].includes(column)) {
    if (!str || str === "null") return null;
    // Try to parse as date
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
    return null;
  }

  return str;
}

// ---- Row Validation ----------------------------------------

function validateRow(
  table: ImportTableTarget,
  row: Record<string, unknown>,
  rowNum: number
): ImportError[] {
  const errors: ImportError[] = [];

  const required: Record<ImportTableTarget, string[]> = {
    customers: ["name"],
    daily_cash_reports: ["date", "collector_name"],
    payroll: ["employee_name", "period"],
    loans: ["customer_id", "principal_amount"],
  };

  for (const field of required[table]) {
    if (!row[field]) {
      errors.push({
        row: rowNum,
        column: field,
        message: `Missing required field "${field}" in row ${rowNum}`,
      });
    }
  }

  return errors;
}

// ---- Auto-Detect Target Table -----------------------------

/** Heuristically detect which table a sheet's headers belong to */
export function detectTable(headers: string[]): ImportTableTarget | null {
  const normHeaders = headers.map(normaliseKey);

  const scores: Record<ImportTableTarget, number> = {
    customers: 0,
    daily_cash_reports: 0,
    payroll: 0,
    loans: 0,
  };

  for (const h of normHeaders) {
    for (const [table, map] of Object.entries(TABLE_HEADER_MAPS) as [
      ImportTableTarget,
      Record<string, string>
    ][]) {
      if (map[h]) scores[table]++;
    }
  }

  const best = (Object.entries(scores) as [ImportTableTarget, number][]).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return best && best[1] > 0 ? best[0] : null;
}

// ---- Workbook from Supabase data for Export ---------------

export function tableDataToWorkbook<T extends Record<string, unknown>>(
  data: T[],
  sheetName: string
): XLSX.WorkBook {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

export function downloadWorkbook(wb: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(wb, filename);
}
