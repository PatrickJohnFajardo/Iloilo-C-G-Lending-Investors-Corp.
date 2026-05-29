// ============================================================
// TypeScript Type Definitions — Lending Portal
// ============================================================

export type CustomerStatus = "Active" | "Inactive" | "Stop";
export type LoanStatus = "Active" | "Paid" | "Defaulted" | "Restructured";
export type PayrollPeriod = "1-15" | "16-31";

export interface Customer {
  id: string;
  name: string;
  address: string | null;
  collector_assigned: string | null;
  phone_number: string | null;
  status: CustomerStatus;
  date_stop: string | null; // ISO date string
  off_savings_balance: number;
  rem_savings_balance: number;
  created_at: string;
  updated_at: string;
}

export interface DailyCashReport {
  id: string;
  date: string; // ISO date string
  collector_name: string;
  cash_on_hand_forwarded: number;
  service_fee_collected: number;
  advance_collection: number;
  penalty_collected: number;
  loan_releases_total: number;
  meals_expense: number;
  transpo_expense: number;
  office_supplies_expense: number;
  net_cash_on_hand: number; // computed column
  created_at: string;
  updated_at: string;
}

export interface Payroll {
  id: string;
  employee_name: string;
  period: PayrollPeriod;
  period_month: number;
  period_year: number;
  base_salary: number;
  cash_bond_deduction: number;
  sss_deduction: number;
  phic_deduction: number;
  pag_ibig_deduction: number;
  sinking_fund_contribution: number;
  absences: number;
  collection_incentive: number;
  net_pay: number; // computed column
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  customer_id: string;
  principal_amount: number;
  term_length: string;
  daily_installment_expected: number;
  date_released: string; // ISO date string
  due_date: string | null; // ISO date string
  penalty_rate: number; // e.g. 0.01 = 1%
  loan_status: LoanStatus;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  customers?: Pick<Customer, "id" | "name" | "address" | "collector_assigned">;
}

// ---- Excel Import Types ----------------------------------

export type ImportTableTarget =
  | "customers"
  | "daily_cash_reports"
  | "payroll"
  | "loans";

export interface ImportResult {
  success: boolean;
  rowsProcessed: number;
  rowsUpserted: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  column?: string;
  message: string;
}

// ---- UI Types ---------------------------------------------

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface TableFilter {
  column: string;
  value: string;
}

// ---- KPI Types -------------------------------------------

export interface DashboardKPIs {
  totalCustomers: number;
  activeLoans: number;
  totalPrincipal: number;
  totalCollectedToday: number;
  defaultedLoans: number;
  customersThisMonth: number;
}
