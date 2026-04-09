#!/usr/bin/env node
/**
 * build-pdf.cjs -- Generate a styled PDF from docs/setup-guide.md
 *
 * Usage:
 *   node scripts/build-pdf.cjs            # generates dist/docs.html (+ .pdf if puppeteer available)
 *   node scripts/build-pdf.cjs --html     # HTML only, skip PDF
 *
 * Dependencies (optional devDependencies):
 *   npm install --save-dev marked puppeteer
 *
 * If puppeteer is not installed, the script still generates a self-contained
 * HTML file that you can open in any browser and print to PDF (Ctrl+P).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const DIST_DIR = path.join(ROOT, 'dist');
const OUT_HTML = path.join(DIST_DIR, 'docs.html');
const OUT_PDF = path.join(DIST_DIR, 'CentraMind-Blueprint-Docs.pdf');

const DOC_FILES = ['setup-guide.md'];

// ── Helpers ─────────────────────────────────────────────────

function readDoc(filename) {
    const filepath = path.join(DOCS_DIR, filename);
    if (!fs.existsSync(filepath)) {
        console.warn(`  [SKIP] ${filename} not found`);
        return null;
    }
    return fs.readFileSync(filepath, 'utf-8');
}

function markdownToHtml(md) {
    try {
        const { marked } = require('marked');
        marked.setOptions({ gfm: true, breaks: false });
        return marked.parse(md);
    } catch {
        return fallbackMarkdown(md);
    }
}

function fallbackMarkdown(md) {
    let html = md;
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`);
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/gm, (_, header, sep, body) => {
        const ths = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
        const rows = body.trim().split('\n').map(row => {
            const tds = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
            return `<tr>${tds}</tr>`;
        }).join('\n');
        return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    });
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/^(?!<[a-z])((?!<).+)$/gm, '<p>$1</p>');
    return html;
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Styles ──────────────────────────────────────────────────

const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    :root {
        --primary: #00D4FF;
        --primary-glow: #00eeff;
        --accent: #E4C790;
        --bg: #0a0a0a;
        --bg-surface: #111113;
        --bg-elevated: #1a1a1e;
        --text: #e8e8ec;
        --text-muted: #8b8b96;
        --text-subtle: #5a5a65;
        --border: rgba(255, 255, 255, 0.08);
        --border-accent: rgba(0, 212, 255, 0.25);
    }

    @page { size: Letter; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 10.5pt;
        line-height: 1.7;
        color: var(--text);
        background: var(--bg);
    }

    .cover {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 60px 40px;
        background: linear-gradient(160deg, #050508 0%, #0a0e14 40%, #0d1520 70%, #050508 100%);
        text-align: center;
        page-break-after: always;
        position: relative;
        overflow: hidden;
    }

    .cover::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, rgba(0, 212, 255, 0.06) 0%, transparent 70%);
        border-radius: 50%;
    }

    .cover .brand-tag {
        font-family: 'JetBrains Mono', monospace;
        font-size: 8pt;
        font-weight: 500;
        letter-spacing: 4px;
        text-transform: uppercase;
        color: var(--primary);
        margin-bottom: 32px;
        position: relative;
    }

    .cover h1 {
        font-size: 38pt;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: -1px;
        line-height: 1.1;
        border: none;
        margin: 0;
        padding: 0;
        position: relative;
    }

    .cover .subtitle {
        font-size: 13pt;
        font-weight: 300;
        color: var(--text-muted);
        margin-top: 16px;
        letter-spacing: 0.5px;
        position: relative;
    }

    .cover .divider {
        width: 60px;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--primary), transparent);
        margin: 32px auto;
        position: relative;
    }

    .cover .version {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9pt;
        color: var(--text-subtle);
        position: relative;
    }

    .cover .tagline {
        font-size: 10pt;
        color: var(--text-subtle);
        margin-top: 48px;
        font-style: italic;
        position: relative;
    }

    .content { padding: 48px 56px; max-width: 100%; }

    h1 {
        font-size: 20pt; font-weight: 800; color: #ffffff;
        margin: 40px 0 12px; padding-bottom: 10px;
        border-bottom: 2px solid var(--border-accent);
        page-break-after: avoid; letter-spacing: -0.5px;
    }
    h2 {
        font-size: 14pt; font-weight: 700; color: var(--primary);
        margin: 32px 0 10px; padding-bottom: 6px;
        border-bottom: 1px solid var(--border);
        page-break-after: avoid;
    }
    h3 {
        font-size: 11.5pt; font-weight: 700; color: var(--accent);
        margin: 20px 0 8px; page-break-after: avoid;
    }
    p { margin: 6px 0; color: var(--text); }
    strong { color: #ffffff; }
    a { color: var(--primary); text-decoration: none; border-bottom: 1px solid rgba(0, 212, 255, 0.3); }
    code {
        font-family: 'JetBrains Mono', monospace; font-size: 9pt;
        background: var(--bg-elevated); color: var(--primary);
        padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border);
    }
    pre {
        background: var(--bg-surface); border: 1px solid var(--border);
        color: var(--text); padding: 14px 18px; border-radius: 8px;
        overflow-x: auto; margin: 10px 0; page-break-inside: avoid;
    }
    pre code { background: none; border: none; padding: 0; color: var(--text-muted); font-size: 8.5pt; }
    table {
        width: 100%; border-collapse: separate; border-spacing: 0;
        margin: 14px 0; font-size: 9.5pt; page-break-inside: avoid;
        border-radius: 8px; overflow: hidden; border: 1px solid var(--border);
    }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--border); }
    th {
        background: var(--bg-elevated); font-weight: 700; font-size: 8.5pt;
        text-transform: uppercase; letter-spacing: 1px; color: var(--primary);
    }
    td { background: var(--bg-surface); color: var(--text-muted); }
    tr:last-child td { border-bottom: none; }
    blockquote {
        border-left: 3px solid var(--primary); padding: 10px 18px;
        margin: 14px 0; color: var(--text-muted); background: var(--bg-surface);
        border-radius: 0 6px 6px 0; font-size: 10pt;
    }
    li { margin: 3px 0; margin-left: 18px; color: var(--text); }
    li::marker { color: var(--primary); }
    hr {
        border: none; height: 1px;
        background: linear-gradient(90deg, transparent, var(--border-accent), transparent);
        margin: 28px 0;
    }

    @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .cover { min-height: 0; height: 100vh; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
    }
`;

// ── Build ───────────────────────────────────────────────────

async function main() {
    const htmlOnly = process.argv.includes('--html');

    console.log('CentraMind Blueprint -- Documentation Builder');
    console.log('==============================================');
    console.log('');

    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    const version = pkg.version || '1.0.0';

    console.log('1. Reading markdown sources...');
    const sections = [];
    for (const file of DOC_FILES) {
        const md = readDoc(file);
        if (md) {
            console.log(`   [OK] ${file}`);
            sections.push({ file, html: markdownToHtml(md) });
        }
    }

    if (sections.length === 0) {
        console.error('No docs found. Create files in docs/ first.');
        process.exit(1);
    }

    console.log('');
    console.log('2. Building HTML...');

    const body = sections.map(s => `<div class="content">${s.html}</div>`).join('\n\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CentraMind Blueprint</title>
    <style>${CSS}</style>
</head>
<body>
    <div class="cover">
        <div class="brand-tag">Eternium Armory</div>
        <h1>CentraMind<br>Blueprint</h1>
        <div class="subtitle">AI agent memory. Skills. Context protocol. Command Center.</div>
        <div class="divider"></div>
        <div class="version">v${version}</div>
        <div class="tagline">The system that runs the business that sells the system.</div>
    </div>

    ${body}
</body>
</html>`;

    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    fs.writeFileSync(OUT_HTML, html);
    console.log(`   [OK] ${path.relative(ROOT, OUT_HTML)}`);

    if (!htmlOnly) {
        console.log('');
        console.log('3. Generating PDF...');
        try {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({ headless: 'new' });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            await page.pdf({
                path: OUT_PDF,
                format: 'Letter',
                margin: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
                printBackground: true,
            });
            await browser.close();
            console.log(`   [OK] ${path.relative(ROOT, OUT_PDF)}`);
        } catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                console.log('   [SKIP] puppeteer not installed');
                console.log('');
                console.log('   To generate PDF automatically:');
                console.log('     npm install --save-dev puppeteer');
                console.log('     npm run docs');
                console.log('');
                console.log('   Or open dist/docs.html in your browser and print to PDF (Ctrl+P).');
            } else {
                console.error('   [ERROR]', err.message);
            }
        }
    }

    console.log('');
    console.log('Done.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
