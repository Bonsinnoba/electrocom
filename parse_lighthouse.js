const fs = require('fs');
const report = JSON.parse(fs.readFileSync('c:\\Users\\balik\\.gemini\\antigravity\\brain\\a9e01ece-d659-4ddc-8a40-ffe64f9e2928\\artifacts\\report.json', 'utf8'));

const failed = Object.values(report.audits).filter(a => a.score !== null && a.score < 1);
failed.forEach(audit => {
  if (audit.scoreDisplayMode !== 'notApplicable' && audit.scoreDisplayMode !== 'informative') {
      console.log(`- ${audit.title} (Score: ${audit.score})`);
      console.log(`  Description: ${audit.description}`);
      console.log(`  Help: ${audit.helpText}`);
  }
});
