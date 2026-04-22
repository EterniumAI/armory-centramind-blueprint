#!/usr/bin/env node
/**
 * build-pdf.cjs -- Generate the Tyrin Barney branded CentraMind Blueprint PDF
 *
 * Usage:
 *   node scripts/build-pdf.cjs            # HTML + PDF
 *   node scripts/build-pdf.cjs --html     # HTML only
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const DIST_DIR = path.join(ROOT, 'dist');
const OUT_HTML = path.join(DIST_DIR, 'docs.html');
const OUT_PDF = path.join(DIST_DIR, 'CentraMind-Blueprint-Docs.pdf');

const DOC_FILES = ['setup-guide.md'];

const ASSETS = {
    tyrinBarney: 'https://wmahfjguvqvefgjpbcdc.supabase.co/storage/v1/object/public/brand-assets/legacy/tb-logo.png',
    claude: 'https://wmahfjguvqvefgjpbcdc.supabase.co/storage/v1/object/public/brand-assets/legacy/claude-full-logo.png',
    supabase: 'https://wmahfjguvqvefgjpbcdc.supabase.co/storage/v1/object/public/brand-assets/legacy/supabase-logo.png',
    github: 'https://wmahfjguvqvefgjpbcdc.supabase.co/storage/v1/object/public/brand-assets/legacy/github-logo.png',
};

function readDoc(filename) {
    const filepath = path.join(DOCS_DIR, filename);
    if (!fs.existsSync(filepath)) {
        console.warn(`  [SKIP] ${filename} not found`);
        return null;
    }
    return fs.readFileSync(filepath, 'utf-8');
}

function markdownToHtml(md) {
    const { marked } = require('marked');
    marked.setOptions({ gfm: true, breaks: false });
    return marked.parse(md);
}

const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600;700&family=Great+Vibes&display=swap');

    :root {
        --gold: #E4C790;
        --gold-light: #F0DDB5;
        --gold-dark: #AD8949;
        --gold-deep: #8B6914;
        --obsidian: #0B0B0F;
        --forge: #111118;
        --vault: #18181F;
        --steel: #22222C;
        --ivory: #F5F0E8;
        --parchment: #D4CFC5;
        --ash: #8A8890;
        --shadow: #5C5A66;
        --border: rgba(228, 199, 144, 0.18);
        --border-soft: rgba(245, 240, 232, 0.08);
    }

    @page { size: Letter; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 11pt;
        line-height: 1.75;
        color: var(--ivory);
        background: var(--obsidian);
        font-weight: 400;
    }

    /* ── Cover ──────────────────────────────────────────────── */
    .cover {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 80px 60px;
        background:
            radial-gradient(ellipse at top, rgba(228, 199, 144, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse at bottom, rgba(228, 199, 144, 0.04) 0%, transparent 50%),
            linear-gradient(180deg, #07070A 0%, #0B0B0F 50%, #07070A 100%);
        text-align: center;
        page-break-after: always;
        overflow: hidden;
    }

    .cover::before {
        content: '';
        position: absolute;
        inset: 40px;
        border: 1px solid var(--border);
        pointer-events: none;
    }

    .cover::after {
        content: '';
        position: absolute;
        inset: 48px;
        border: 1px solid rgba(228, 199, 144, 0.08);
        pointer-events: none;
    }

    .cover .crest {
        width: 140px;
        height: 140px;
        object-fit: contain;
        margin-bottom: 48px;
        filter: drop-shadow(0 0 24px rgba(228, 199, 144, 0.25));
        position: relative;
    }

    .cover .eyebrow {
        font-family: 'Inter', sans-serif;
        font-size: 10pt;
        font-weight: 500;
        letter-spacing: 6px;
        text-transform: uppercase;
        color: var(--gold);
        margin-bottom: 28px;
        position: relative;
    }

    .cover h1 {
        font-family: 'Cinzel', serif;
        font-size: 46pt;
        font-weight: 600;
        color: var(--ivory);
        letter-spacing: 2px;
        line-height: 1.05;
        margin: 0;
        padding: 0;
        border: none;
        position: relative;
        text-transform: uppercase;
    }

    .cover h1 .accent {
        display: block;
        color: var(--gold);
        font-size: 44pt;
        margin-top: 4px;
    }

    .cover .subtitle {
        font-family: 'Inter', sans-serif;
        font-size: 13pt;
        font-weight: 300;
        color: var(--parchment);
        margin-top: 32px;
        letter-spacing: 0.5px;
        max-width: 440px;
        line-height: 1.6;
        position: relative;
    }

    .cover .ornament {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        margin: 44px auto;
        position: relative;
    }

    .cover .ornament .line {
        width: 80px;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--gold), transparent);
    }

    .cover .ornament .diamond {
        width: 6px;
        height: 6px;
        background: var(--gold);
        transform: rotate(45deg);
    }

    .cover .signature {
        font-family: 'Great Vibes', cursive;
        font-size: 22pt;
        color: var(--gold-light);
        margin-top: 8px;
        position: relative;
    }

    .cover .version {
        font-family: 'Inter', sans-serif;
        font-size: 9pt;
        color: var(--shadow);
        margin-top: 12px;
        letter-spacing: 3px;
        text-transform: uppercase;
        position: relative;
    }

    /* ── Logo row page ───────────────────────────────────────── */
    .toolkit {
        padding: 80px 60px;
        min-height: 100vh;
        background:
            radial-gradient(ellipse at center top, rgba(228, 199, 144, 0.04) 0%, transparent 55%),
            var(--obsidian);
        page-break-after: always;
        position: relative;
    }

    .toolkit .eyebrow {
        font-family: 'Inter', sans-serif;
        font-size: 9pt;
        font-weight: 500;
        letter-spacing: 5px;
        text-transform: uppercase;
        color: var(--gold);
        text-align: center;
        margin-bottom: 16px;
    }

    .toolkit h2 {
        font-family: 'Cinzel', serif;
        font-size: 26pt;
        font-weight: 600;
        color: var(--ivory);
        text-align: center;
        letter-spacing: 1px;
        margin: 0 0 12px;
        text-transform: uppercase;
        border: none;
        padding: 0;
    }

    .toolkit .tagline {
        text-align: center;
        color: var(--ash);
        font-size: 11pt;
        max-width: 460px;
        margin: 0 auto 56px;
        line-height: 1.6;
    }

    .toolkit .divider {
        width: 80px;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--gold), transparent);
        margin: 0 auto 56px;
    }

    .toolkit .tools {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 28px;
        margin-top: 40px;
    }

    .toolkit .tool {
        background: linear-gradient(180deg, rgba(228, 199, 144, 0.04) 0%, transparent 100%);
        border: 1px solid var(--border);
        padding: 36px 24px 30px;
        text-align: center;
        position: relative;
    }

    .toolkit .tool .logo-wrap {
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 28px;
    }

    .toolkit .tool .logo-wrap img {
        max-height: 48px;
        max-width: 140px;
        object-fit: contain;
        filter: brightness(1.05);
    }

    .toolkit .tool h3 {
        font-family: 'Cinzel', serif;
        font-size: 13pt;
        font-weight: 600;
        color: var(--gold);
        margin: 0 0 10px;
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .toolkit .tool p {
        font-size: 9.5pt;
        color: var(--parchment);
        line-height: 1.6;
        margin: 0;
    }

    /* ── Main content ───────────────────────────────────────── */
    .content {
        padding: 64px 72px;
        max-width: 100%;
    }

    h1 {
        font-family: 'Cinzel', serif;
        font-size: 22pt;
        font-weight: 600;
        color: var(--ivory);
        margin: 48px 0 18px;
        padding-bottom: 14px;
        border-bottom: 1px solid var(--gold);
        page-break-after: avoid;
        letter-spacing: 1px;
        text-transform: uppercase;
        position: relative;
    }

    h1::before {
        content: '';
        position: absolute;
        left: 0;
        bottom: -1px;
        width: 40px;
        height: 3px;
        background: var(--gold);
    }

    h2 {
        font-family: 'Cinzel', serif;
        font-size: 15pt;
        font-weight: 600;
        color: var(--gold);
        margin: 38px 0 14px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border);
        page-break-after: avoid;
        letter-spacing: 0.5px;
    }

    h3 {
        font-family: 'Cinzel', serif;
        font-size: 12pt;
        font-weight: 600;
        color: var(--gold-light);
        margin: 26px 0 10px;
        letter-spacing: 0.5px;
        page-break-after: avoid;
    }

    p {
        margin: 10px 0;
        color: var(--ivory);
        font-weight: 400;
    }

    strong {
        color: var(--gold);
        font-weight: 600;
    }

    em {
        color: var(--parchment);
        font-style: italic;
    }

    a {
        color: var(--gold);
        text-decoration: none;
        border-bottom: 1px dotted rgba(228, 199, 144, 0.5);
    }

    code {
        font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
        font-size: 9.5pt;
        background: var(--vault);
        color: var(--gold-light);
        padding: 2px 7px;
        border-radius: 3px;
        border: 1px solid var(--border-soft);
    }

    pre {
        background: var(--forge);
        border: 1px solid var(--border);
        border-left: 3px solid var(--gold);
        color: var(--ivory);
        padding: 16px 20px;
        margin: 14px 0;
        page-break-inside: avoid;
    }

    pre code {
        background: none;
        border: none;
        padding: 0;
        color: var(--parchment);
        font-size: 9.5pt;
    }

    blockquote {
        border-left: 3px solid var(--gold);
        padding: 14px 22px;
        margin: 18px 0;
        color: var(--parchment);
        background: rgba(228, 199, 144, 0.04);
        font-size: 10.5pt;
        font-style: italic;
        page-break-inside: avoid;
    }

    blockquote p { margin: 0; color: var(--parchment); }

    ul, ol { margin: 10px 0 10px 8px; }

    li {
        margin: 6px 0;
        margin-left: 20px;
        color: var(--ivory);
        padding-left: 4px;
    }

    li::marker {
        color: var(--gold);
        font-weight: 600;
    }

    hr {
        border: none;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--border), transparent);
        margin: 36px 0;
    }

    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin: 18px 0;
        font-size: 10pt;
        page-break-inside: avoid;
        border: 1px solid var(--border);
    }

    th, td {
        padding: 10px 14px;
        text-align: left;
        border-bottom: 1px solid var(--border-soft);
    }

    th {
        background: var(--forge);
        font-family: 'Cinzel', serif;
        font-weight: 600;
        font-size: 9.5pt;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: var(--gold);
    }

    td {
        background: var(--obsidian);
        color: var(--parchment);
    }

    tr:last-child td { border-bottom: none; }

    /* ── Footer ──────────────────────────────────────────────── */
    .closing {
        padding: 80px 72px;
        text-align: center;
        page-break-before: always;
        background:
            radial-gradient(ellipse at center, rgba(228, 199, 144, 0.06) 0%, transparent 60%),
            var(--obsidian);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: relative;
    }

    .closing::before {
        content: '';
        position: absolute;
        inset: 40px;
        border: 1px solid var(--border);
    }

    .closing .crest-small {
        width: 72px;
        height: 72px;
        object-fit: contain;
        opacity: 0.9;
        margin-bottom: 32px;
    }

    .closing .mantra {
        font-family: 'Cinzel', serif;
        font-size: 16pt;
        font-weight: 500;
        color: var(--ivory);
        letter-spacing: 1px;
        line-height: 1.5;
        max-width: 480px;
        margin: 0 0 28px;
        text-transform: uppercase;
    }

    .closing .sig {
        font-family: 'Great Vibes', cursive;
        font-size: 24pt;
        color: var(--gold);
        margin-top: 20px;
    }

    .closing .url {
        font-family: 'Inter', sans-serif;
        font-size: 10pt;
        color: var(--ash);
        margin-top: 24px;
        letter-spacing: 2px;
        text-transform: lowercase;
    }

    @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .cover, .toolkit, .closing { min-height: 0; height: 100vh; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
    }
`;

async function main() {
    const htmlOnly = process.argv.includes('--html');

    console.log('CentraMind Blueprint -- Tyrin Barney Edition');
    console.log('=============================================');
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
    <title>The CentraMind Blueprint -- Tyrin Barney</title>
    <style>${CSS}</style>
</head>
<body>

    <!-- ── Cover ────────────────────────────────────────── -->
    <div class="cover">
        <img src="${ASSETS.tyrinBarney}" alt="Tyrin Barney" class="crest" />
        <div class="eyebrow">Presented by Tyrin Barney</div>
        <h1>The CentraMind<span class="accent">Blueprint</span></h1>
        <div class="subtitle">
            The exact setup I use to run my company with an AI that never forgets.
        </div>
        <div class="ornament">
            <div class="line"></div>
            <div class="diamond"></div>
            <div class="line"></div>
        </div>
        <div class="signature">Ty</div>
        <div class="version">Edition ${version}</div>
    </div>

    <!-- ── Toolkit page ─────────────────────────────────── -->
    <div class="toolkit">
        <div class="eyebrow">The Three Pillars</div>
        <h2>Your Toolkit</h2>
        <div class="divider"></div>
        <p class="tagline">
            Three free tools. No subscriptions. No upsells. Together, they give your AI a brain, a memory, and a body.
        </p>
        <div class="tools">
            <div class="tool">
                <div class="logo-wrap">
                    <img src="${ASSETS.claude}" alt="Claude" />
                </div>
                <h3>The Mind</h3>
                <p>Claude is the AI itself. Smart, patient, a real teammate. Made by Anthropic.</p>
            </div>
            <div class="tool">
                <div class="logo-wrap">
                    <img src="${ASSETS.supabase}" alt="Supabase" />
                </div>
                <h3>The Memory</h3>
                <p>Supabase is where every thought your AI has gets saved, safely and for free.</p>
            </div>
            <div class="tool">
                <div class="logo-wrap">
                    <img src="${ASSETS.github}" alt="GitHub" />
                </div>
                <h3>The Blueprint</h3>
                <p>GitHub holds the code. Download it once. Never touch it again unless you want to.</p>
            </div>
        </div>
    </div>

    <!-- ── Main content ─────────────────────────────────── -->
    ${body}

    <!-- ── Closing page ─────────────────────────────────── -->
    <div class="closing">
        <img src="${ASSETS.tyrinBarney}" alt="Tyrin Barney" class="crest-small" />
        <div class="mantra">
            Built by hand.<br>Given freely.<br>Yours to own.
        </div>
        <div class="sig">Ty</div>
        <div class="url">tyrinbarney.com / community</div>
    </div>

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
                margin: { top: '0.6in', right: '0.6in', bottom: '0.6in', left: '0.6in' },
                printBackground: true,
            });
            await browser.close();
            console.log(`   [OK] ${path.relative(ROOT, OUT_PDF)}`);
        } catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                console.log('   [SKIP] puppeteer not installed');
                console.log('');
                console.log('   To generate PDF automatically:');
                console.log('     npm install --save-dev puppeteer marked');
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
