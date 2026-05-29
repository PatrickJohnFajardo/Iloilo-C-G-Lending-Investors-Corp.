const xlsx = require("xlsx");
const path = require("path");

const outDir = path.join(__dirname, "public", "templates");
const fs = require("fs");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function createTemplate(filename, data) {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Template");
  
  // Set some column widths
  const wscols = Object.keys(data[0]).map(() => ({ wch: 20 }));
  ws["!cols"] = wscols;

  const outPath = path.join(outDir, filename);
  xlsx.writeFile(wb, outPath);
  console.log(`Created template: ${outPath}`);
}

// 1. Customers Template
createTemplate("Template_Customers.xlsx", [
  {
    "name": "Dela Cruz, Juan",
    "address": "Jaro, Iloilo City",
    "collector_assigned": "Baltazar",
    "phone_number": "09171234567",
    "status": "Active",
    "date_stop": "",
    "OFF SAVINGS": 1500.00,
    "REM. SAVINGS": 500.00
  },
  {
    "name": "Reyes, Maria",
    "address": "Molo, Iloilo City",
    "collector_assigned": "Diaz",
    "phone_number": "09189876543",
    "status": "Stop",
    "date_stop": "2026-05-01",
    "OFF SAVINGS": 0,
    "REM. SAVINGS": 200.00
  }
]);

// 2. Daily Cash Reports Template
createTemplate("Template_Daily_Cash_Reports.xlsx", [
  {
    "date": "2026-05-29",
    "collector_name": "Baltazar",
    "CASH ON HAND FORWARDED": 303437.25,
    "service_fee_collected": 10720.00,
    "advance_collection": 5000.00,
    "penalty_collected": 150.00,
    "loan_releases_total": 20000.00,
    "meals_expense": 250.00,
    "transpo_expense": 150.00,
    "office_supplies_expense": 500.00
  },
  {
    "date": "2026-05-29",
    "collector_name": "Diaz",
    "CASH ON HAND FORWARDED": 150000.00,
    "service_fee_collected": 8500.00,
    "advance_collection": 2000.00,
    "penalty_collected": 0,
    "loan_releases_total": 10000.00,
    "meals_expense": 200.00,
    "transpo_expense": 100.00,
    "office_supplies_expense": 0
  }
]);

// 3. Payroll Template
createTemplate("Template_Payroll.xlsx", [
  {
    "employee_name": "Eusoya, Marven",
    "period": "1-15",
    "period_month": 5,
    "period_year": 2026,
    "base_salary": 6000.00,
    "sss_deduction": 500.00,
    "PAG-IBIG": 100.00,
    "PHIC": 150.00,
    "cash_bond_deduction": 1000.00,
    "SINKING FUND CONTRI.": 200.00,
    "absences": 0,
    "collection_incentive": 1500.00
  }
]);

// 4. Loans Template
createTemplate("Template_Loans.xlsx", [
  {
    "customer_name": "Dela Cruz, Juan",
    "principal_amount": 10000.00,
    "term_length": "30 Days",
    "daily_installment_expected": 400.00,
    "date_released": "2026-05-28",
    "due_date": "2026-06-27",
    "penalty_rate": 0.05,
    "loan_status": "Active",
    "remarks": "First time borrower"
  }
]);
