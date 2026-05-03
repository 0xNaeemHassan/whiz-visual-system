#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function collectFiles(entry) {
  const full = path.resolve(process.cwd(), entry);
  const stat = fs.statSync(full);
  if (stat.isFile()) return [full];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((dirent) => {
    const child = path.join(full, dirent.name);
    if (dirent.isDirectory()) return collectFiles(child);
    return /\.(jsx|tsx)$/.test(dirent.name) ? [child] : [];
  });
}

const files = ['src/components', 'src/pages/Editor.jsx'].flatMap(collectFiles);
const issues = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
  let m;
  while ((m = buttonRegex.exec(text))) {
    const attrs = m[1] || '';
    const rawBody = m[2] || '';
    const body = rawBody.replace(/\{[^}]*\}/g, '').replace(/<[^>]+>/g, '').trim();
    const hasName = /aria-label=|aria-labelledby=|\blabel=/.test(attrs);
    const isCustomRadio = /role=['"]radio['"]/.test(attrs);
    const isIconOnly = Boolean(body) && !/[A-Za-z0-9]/.test(body);
    const hasDynamicContent = /{[^}]+}/.test(rawBody);
    if ((isCustomRadio || (isIconOnly && !hasDynamicContent)) && !hasName) {
      const line = text.slice(0, m.index).split('\n').length;
      issues.push(`${path.relative(process.cwd(), file)}:${line}`);
    }
  }
}

if (issues.length) {
  console.error('Unlabeled icon-only or custom-radio buttons found:');
  issues.forEach((i) => console.error(`- ${i}`));
  process.exit(1);
}
console.log(`Checked ${files.length} files. Icon-only and custom-radio buttons are explicitly named.`);
