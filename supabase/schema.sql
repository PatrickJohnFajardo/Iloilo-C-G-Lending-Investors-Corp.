-- ============================================================
-- LENDING PORTAL — SUPABASE SCHEMA
-- Iloilo C&G Lending Investors Corp. / Maco Lending Corporation
-- ============================================================
-- Run this entire file in the Supabase SQL Editor.
-- ============================================================

-- UUID generation uses gen_random_uuid() — built into PostgreSQL 13+ (no extension needed)

-- ============================================================
-- TABLE 1: customers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id                    UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  name                  TEXT          NOT NULL,
  address               TEXT,                          -- e.g. Jaro, Molo, Arevalo
  collector_assigned    TEXT,                          -- e.g. Baltazar, Diaz, Eusoya
  phone_number          TEXT,
  status                TEXT          NOT NULL DEFAULT 'Active'
                          CHECK (status IN ('Active', 'Inactive', 'Stop')),
  date_stop             DATE,                          -- date status changed to Stop
  off_savings_balance   NUMERIC(14,2) NOT NULL DEFAULT 0,  -- OFF SAVINGS
  rem_savings_balance   NUMERIC(14,2) NOT NULL DEFAULT 0,  -- REMAINING SAVINGS
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.customers IS 'Borrower/client master list for the lending firm.';
COMMENT ON COLUMN public.customers.off_savings_balance IS 'OFF SAVINGS balance — maps legacy header "OFF SAVINGS".';
COMMENT ON COLUMN public.customers.rem_savings_balance IS 'Remaining savings balance — maps legacy header "REM. SAVINGS" or "REMAINING SAVINGS".';

-- ============================================================
-- TABLE 2: daily_cash_reports (DCR)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_cash_reports (
  id                      UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  date                    DATE          NOT NULL,
  collector_name          TEXT          NOT NULL,
  cash_on_hand_forwarded  NUMERIC(14,2) NOT NULL DEFAULT 0,  -- CASH ON HAND FORWARDED
  service_fee_collected   NUMERIC(14,2) NOT NULL DEFAULT 0,
  advance_collection      NUMERIC(14,2) NOT NULL DEFAULT 0,
  penalty_collected       NUMERIC(14,2) NOT NULL DEFAULT 0,
  loan_releases_total     NUMERIC(14,2) NOT NULL DEFAULT 0,
  meals_expense           NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Operational: Meals
  transpo_expense         NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Operational: Transpo
  office_supplies_expense NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Operational: Office Supplies
  net_cash_on_hand        NUMERIC(14,2) GENERATED ALWAYS AS (
                            cash_on_hand_forwarded
                            + service_fee_collected
                            + advance_collection
                            + penalty_collected
                            - loan_releases_total
                            - meals_expense
                            - transpo_expense
                            - office_supplies_expense
                          ) STORED,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.daily_cash_reports IS 'Daily Cash Reports (DCR) per collector per day.';
COMMENT ON COLUMN public.daily_cash_reports.cash_on_hand_forwarded IS 'Maps legacy header "CASH ON HAND FORWARDED".';
COMMENT ON COLUMN public.daily_cash_reports.net_cash_on_hand IS 'Auto-computed: forwarded + collections - releases - expenses.';

CREATE UNIQUE INDEX IF NOT EXISTS dcr_date_collector_uidx
  ON public.daily_cash_reports (date, collector_name);

-- ============================================================
-- TABLE 3: payroll
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payroll (
  id                      UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name           TEXT          NOT NULL,
  period                  TEXT          NOT NULL CHECK (period IN ('1-15', '16-31')),
  period_month            INT           NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year             INT           NOT NULL CHECK (period_year > 2000),
  base_salary             NUMERIC(14,2) NOT NULL DEFAULT 0,
  cash_bond_deduction     NUMERIC(14,2) NOT NULL DEFAULT 0,
  sss_deduction           NUMERIC(14,2) NOT NULL DEFAULT 0,
  phic_deduction          NUMERIC(14,2) NOT NULL DEFAULT 0,  -- PhilHealth
  pag_ibig_deduction      NUMERIC(14,2) NOT NULL DEFAULT 0,
  sinking_fund_contribution NUMERIC(14,2) NOT NULL DEFAULT 0, -- Maps "SINKING FUND CONTRI."
  absences                NUMERIC(14,2) NOT NULL DEFAULT 0,
  collection_incentive    NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_pay                 NUMERIC(14,2) GENERATED ALWAYS AS (
                            base_salary
                            + collection_incentive
                            - cash_bond_deduction
                            - sss_deduction
                            - phic_deduction
                            - pag_ibig_deduction
                            - sinking_fund_contribution
                            - absences
                          ) STORED,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payroll IS 'Bi-monthly payroll records per employee.';
COMMENT ON COLUMN public.payroll.sinking_fund_contribution IS 'Maps legacy header "SINKING FUND CONTRI.".';
COMMENT ON COLUMN public.payroll.net_pay IS 'Auto-computed: base + incentives - all deductions.';

CREATE UNIQUE INDEX IF NOT EXISTS payroll_employee_period_uidx
  ON public.payroll (employee_name, period, period_month, period_year);

-- ============================================================
-- TABLE 4: loans (Promissory Notes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loans (
  id                          UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id                 UUID          NOT NULL REFERENCES public.customers (id)
                                ON DELETE CASCADE ON UPDATE CASCADE,
  principal_amount            NUMERIC(14,2) NOT NULL,
  term_length                 TEXT          NOT NULL,  -- e.g. '2 months', '60 days'
  daily_installment_expected  NUMERIC(14,2) NOT NULL DEFAULT 0,
  date_released               DATE          NOT NULL DEFAULT CURRENT_DATE,
  due_date                    DATE,
  penalty_rate                NUMERIC(6,4)  NOT NULL DEFAULT 0.0100, -- 1% per day late
  loan_status                 TEXT          NOT NULL DEFAULT 'Active'
                                CHECK (loan_status IN ('Active', 'Paid', 'Defaulted', 'Restructured')),
  remarks                     TEXT,
  created_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.loans IS 'Promissory notes / loan records linked to customers.';
COMMENT ON COLUMN public.loans.penalty_rate IS '1% per day default. Stored as decimal: 0.01 = 1%.';

CREATE INDEX IF NOT EXISTS loans_customer_id_idx ON public.loans (customer_id);
CREATE INDEX IF NOT EXISTS loans_status_idx ON public.loans (loan_status);
CREATE INDEX IF NOT EXISTS loans_due_date_idx ON public.loans (due_date);

-- ============================================================
-- AUTO-UPDATED updated_at TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER dcr_updated_at
  BEFORE UPDATE ON public.daily_cash_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER payroll_updated_at
  BEFORE UPDATE ON public.payroll
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_cash_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans              ENABLE ROW LEVEL SECURITY;

-- Only authenticated users (logged in via Supabase Auth) may access data
CREATE POLICY "Authenticated read/write: customers"
  ON public.customers FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read/write: dcr"
  ON public.daily_cash_reports FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read/write: payroll"
  ON public.payroll FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read/write: loans"
  ON public.loans FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================
-- SAMPLE SEED DATA (optional — remove in production)
-- ============================================================
-- INSERT INTO public.customers (name, address, collector_assigned, phone_number, status, off_savings_balance, rem_savings_balance)
-- VALUES
--   ('Juan dela Cruz', 'Jaro', 'Baltazar', '09171234567', 'Active', 500.00, 1200.00),
--   ('Maria Santos',   'Molo', 'Diaz',     '09189876543', 'Active', 250.00, 800.00),
--   ('Pedro Reyes',    'Arevalo', 'Eusoya', '09201112222', 'Stop',  0.00,   0.00);
