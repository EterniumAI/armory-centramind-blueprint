/**
 * lint-friendly-copy.cjs
 * Greps src/components/friendly/ for banned engineering words
 * that should never appear in customer-facing UI text.
 * Exits non-zero if any are found.
 */

const fs = require('fs');
const path = require('path');

const BANNED_WORDS = [
  'cron',
  'severity',
  'dedupe',
  'digest cron',
  'mode',
  'payload',
  'schema',
  'queued',
  'digested',
  'deduped',
  'RLS',
  'JWT',
  'tenant_id',
  'regex',
  'webhook',
];

// Build a case-insensitive regex matching any banned word as a whole word
const BANNED_RE = new RegExp(
  '\\b(' + BANNED_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
  'gi'
);

const FRIENDLY_DIR = path.join(__dirname, '..', 'src', 'components', 'friendly');

// Only check JSX text content and copy.js string values.
// We scan .jsx files for text between > and < (JSX text nodes)
// and copy.js for string literals (single or double quoted).
const JSX_TEXT_RE = />([^<>{]+)</g;
const STRING_LITERAL_RE = /['"]([^'"]+)['"]/g;

let violations = 0;

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const basename = path.basename(filePath);
  const isJsx = filePath.endsWith('.jsx');
  const isCopy = basename === 'copy.js';

  // Skip the showcase page (it's internal-only and shows engineering state)
  if (basename === 'FriendlyPrimitivesShowcase.jsx') return;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Skip comments and imports
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('import ')) return;

    let textsToCheck = [];

    if (isJsx) {
      // Extract JSX text content (between > and <)
      let match;
      while ((match = JSX_TEXT_RE.exec(line)) !== null) {
        textsToCheck.push(match[1]);
      }
    }

    if (isCopy) {
      // Extract string literal values
      let match;
      while ((match = STRING_LITERAL_RE.exec(line)) !== null) {
        textsToCheck.push(match[1]);
      }
    }

    for (const text of textsToCheck) {
      const banned = text.match(BANNED_RE);
      if (banned) {
        // Filter out false positives: "mode" inside longer words
        const realBanned = banned.filter((b) => {
          if (b.toLowerCase() === 'mode') {
            // Allow "mode" as a JS property key (not in user-facing strings)
            // But flag it in copy.js string values and JSX text
            return true;
          }
          return true;
        });
        if (realBanned.length > 0) {
          console.error(`  ${filePath}:${lineNum}  banned word(s): ${realBanned.join(', ')}`);
          console.error(`    ${line.trim()}`);
          violations++;
        }
      }
    }
  });
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full);
    } else if (entry.name.endsWith('.jsx') || entry.name === 'copy.js') {
      checkFile(full);
    }
  }
}

console.log('Checking src/components/friendly/ for banned engineering words...');
walkDir(FRIENDLY_DIR);

if (violations > 0) {
  console.error(`\nFound ${violations} violation(s). Customer-facing text must not contain engineering terminology.`);
  process.exit(1);
} else {
  console.log('No banned words found. All clear.');
  process.exit(0);
}
