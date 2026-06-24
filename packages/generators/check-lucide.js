const { LucideIconValidator } = require('./dist/validators/lucide-icon-validator');
const res1 = LucideIconValidator.validate('import { SortAsc } from "lucide-react";');
const res2 = LucideIconValidator.validate('import { SortDesc } from "lucide-react";');
console.log(JSON.stringify({ SortAsc: res1, SortDesc: res2 }, null, 2));
