const { LucideIconValidator } = require('./dist/validators/lucide-icon-validator');
const fs = require('fs');

const passIcons = ['SortAsc', 'SortDesc', 'Loader', 'LogOut', 'LucideProps'];
const failIcons = ['Subtract', 'Equals', 'Multiply'];
const res = { passes: {}, fails: {} };

passIcons.forEach(i => res.passes[i] = LucideIconValidator.validate(`import { ${i} } from 'lucide-react';`).isValid ? 'PASS' : 'FAIL');
failIcons.forEach(i => res.fails[i] = !LucideIconValidator.validate(`import { ${i} } from 'lucide-react';`).isValid ? 'PASS' : 'FAIL');

fs.writeFileSync('c:/website-generator-core/website-generator-core/generation-artifacts/lucide-post-fix-verification.json', JSON.stringify(res, null, 2));
console.log('Done');
