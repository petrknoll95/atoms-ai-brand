import fs from 'node:fs';
import ts from 'typescript';
const src=fs.readFileSync('src/data/patterns.ts','utf8').replace("import { withBase } from './base';", "const withBase = (s: string) => s;");
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const spec=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
console.log(JSON.stringify(spec));
