#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS=['src/components','src/pages','src/index.css'];
const disallowedColor=[/#5A6478/ig,/#8B95A3/ig,/#3A4560/ig,/rgba\(255,255,255,0\.[0-4]/ig];
const minBody=12; const minPanel=14;
const issues=[];
function walk(p){ const st=statSync(p); if(st.isDirectory()){ for(const n of readdirSync(p)) walk(join(p,n)); return;} if(!/\.(jsx|js|tsx|css)$/.test(p)) return; const s=readFileSync(p,'utf8');
 disallowedColor.forEach(rx=>{ if(rx.test(s)) issues.push(`${p}: disallowed low-contrast color ${rx}`); rx.lastIndex=0;});
 for(const m of s.matchAll(/fontSize\s*:\s*['"]?(\d+(?:\.\d+)?)px/g)){ const v=Number(m[1]); if(v<minBody) issues.push(`${p}: fontSize ${v}px below ${minBody}px`);}
}
ROOTS.forEach(walk);
if(issues.length){ console.error('Contrast/min-font policy violations:'); issues.forEach(i=>console.error(' -',i)); process.exit(1);}
console.log('Contrast/min-font policy: OK');
