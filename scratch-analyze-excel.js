const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'd:\\Admin\\Downloads\\drive-download-20260529T062400Z-3-001';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.xlsx')) {
    console.log(`\n=== ${file} ===`);
    try {
      const wb = xlsx.readFile(path.join(dir, file));
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
      
      console.log("Top 5 rows:");
      console.log(json.slice(0, 5));
    } catch (e) {
      console.error("Error reading file:", e.message);
    }
  }
}
