const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'd:\\Admin\\Downloads\\drive-download-20260529T062400Z-3-001';

function dumpSheet(filename, rows = 30) {
  console.log(`\n=== DUMPING: ${filename} ===`);
  const wb = xlsx.readFile(path.join(dir, filename));
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: null });
  console.log(JSON.stringify(json.slice(0, rows), null, 2));
}

dumpSheet('DAILY CASH REPORT.xlsx');
dumpSheet('PAYROLL  2025.xlsx');
dumpSheet('SAVINGS FILE.xlsx');
