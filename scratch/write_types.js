import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:\\Users\\CarixStudio\\.gemini\\antigravity\\brain\\3b155de0-f141-49f1-829e-e83b0fdda7d4\\.system_generated\\steps\\674\\output.txt', 'utf8'));
fs.writeFileSync('c:\\projects\\Ambassadors-Assembly\\Ambassadors-Admin\\src\\types\\database.types.ts', data.types);
console.log('Types written successfully');
