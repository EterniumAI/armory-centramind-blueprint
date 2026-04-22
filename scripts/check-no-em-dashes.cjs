#!/usr/bin/env node
// Fail the build if src/ contains an em dash character or &mdash; entity.
// CLAUDE.md conventions: no em dashes anywhere in user-facing content.
// Use periods, commas, or double hyphens.

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const EXT = /\.(jsx?|tsx?|css|md|html)$/i;
const bad = [];

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full);
        } else if (EXT.test(entry.name)) {
            const content = fs.readFileSync(full, 'utf8');
            const lines = content.split(/\r?\n/);
            lines.forEach((line, i) => {
                if (/\u2014|&mdash;/.test(line)) {
                    bad.push({ file: full, line: i + 1, text: line.trim() });
                }
            });
        }
    }
}

walk(SRC);

if (bad.length > 0) {
    console.error('Em dash found in src/ (use periods, commas, or -- instead):');
    for (const b of bad) {
        console.error(`  ${path.relative(process.cwd(), b.file)}:${b.line}  ${b.text}`);
    }
    process.exit(1);
}

console.log('No em dashes in src/. Good.');
