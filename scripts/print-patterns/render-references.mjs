// Usage: PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs CHROMIUM_PATH=/absolute/browser node scripts/print-patterns/render-references.mjs
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import ts from 'typescript';import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');const work=process.env.PATTERN_WORK||'/tmp/atomsai-pattern-production';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||work+'/runtime/node_modules/playwright/index.mjs'));
fs.mkdirSync(work+'/render',{recursive:true});
for(const [src,name] of [['src/data/patterns.ts','patterns'],['src/scripts/pattern-renderer.ts','renderer']]){
 let s=fs.readFileSync(root+'/'+src,'utf8').replace("import { withBase } from './base';","const withBase = (s:string) => s;").replace("from '../data/patterns'","from './patterns.js'");
 fs.writeFileSync(work+'/render/'+name+'.js',ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
const server=http.createServer((req,res)=>{let p=req.url==='/'?null:req.url.startsWith('/pattern-masks/')?root+'/public'+req.url:work+'/render'+req.url;res.setHeader('Content-Type',p?.endsWith('.js')?'text/javascript':p?.endsWith('.svg')?'image/svg+xml':'text/html');res.end(p?fs.readFileSync(p):'<script type="module">import {renderField} from "./renderer.js";window.renderField=renderField;</script>')});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.renderField);
for(const j of JSON.parse(fs.readFileSync(work+'/jobs.json','utf8'))){const data=await page.evaluate(async j=>(await window.renderField({structure:j.family,density:j.density,colors:j.colors},600)).toDataURL(),j);fs.writeFileSync(work+'/'+j.id+'-reference.png',Buffer.from(data.split(',')[1],'base64'));}}
finally{await browser.close();server.close();}
console.log('Current renderer references saved');
