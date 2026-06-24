const ts = require('typescript');
const code = 'const x = <div className="test" ';
const sf = ts.createSourceFile('t.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
console.log(sf.parseDiagnostics);
