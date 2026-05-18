#!/usr/bin/env node
/**
 * scripts/patch-tenant-theme.cjs
 *
 * Patches theme.config.js with tenant-specific values from environment variables:
 *   PRIMARY_COLOR  -- overrides colors.primary (and derived glow/dim/accent)
 *   COMPANY_NAME   -- overrides brandName
 *   LOGO_URL       -- overrides logos.brand
 *
 * Called during CI (provision-tenant.yml) before npm run build. The prebuild
 * hook (build-theme.cjs) regenerates src/theme.generated.css from the patched
 * theme.config.js automatically.
 *
 * Defensive: missing env vars or missing fields warn but do not crash.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'theme.config.js');

function main() {
  const primaryColor = process.env.PRIMARY_COLOR || '';
  const companyName = process.env.COMPANY_NAME || '';
  const logoUrl = process.env.LOGO_URL || '';

  if (!primaryColor && !companyName && !logoUrl) {
    console.log('[patch-tenant-theme] No env vars set, skipping patch.');
    return;
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    console.warn('[patch-tenant-theme] theme.config.js not found, skipping.');
    return;
  }

  let content = fs.readFileSync(CONFIG_PATH, 'utf8');

  // Patch primary color
  if (primaryColor) {
    // Replace primary color value
    const primaryRe = /(primary:\s*')([^']*?)(')/;
    const primaryReDouble = /(primary:\s*")([^"]*?)(")/;
    if (primaryRe.test(content)) {
      content = content.replace(primaryRe, `$1${primaryColor}$3`);
    } else if (primaryReDouble.test(content)) {
      content = content.replace(primaryReDouble, `$1${primaryColor}$3`);
    } else {
      console.warn('[patch-tenant-theme] Could not find primary color field to patch.');
    }

    // Also patch accent if it matches the old primary
    const accentRe = /(accent:\s*')([^']*?)(')/;
    const accentReDouble = /(accent:\s*")([^"]*?)(")/;
    if (accentRe.test(content)) {
      content = content.replace(accentRe, `$1${primaryColor}$3`);
    } else if (accentReDouble.test(content)) {
      content = content.replace(accentReDouble, `$1${primaryColor}$3`);
    }

    // Patch primaryGlow (primary + 66 alpha)
    const glowRe = /(primaryGlow:\s*')([^']*?)(')/;
    const glowReDouble = /(primaryGlow:\s*")([^"]*?)(")/;
    const glowValue = primaryColor + '66';
    if (glowRe.test(content)) {
      content = content.replace(glowRe, `$1${glowValue}$3`);
    } else if (glowReDouble.test(content)) {
      content = content.replace(glowReDouble, `$1${glowValue}$3`);
    }

    // Patch primaryDim (primary + 15 alpha)
    const dimRe = /(primaryDim:\s*')([^']*?)(')/;
    const dimReDouble = /(primaryDim:\s*")([^"]*?)(")/;
    const dimValue = primaryColor + '15';
    if (dimRe.test(content)) {
      content = content.replace(dimRe, `$1${dimValue}$3`);
    } else if (dimReDouble.test(content)) {
      content = content.replace(dimReDouble, `$1${dimValue}$3`);
    }

    // Patch borderAccent derived from primary
    const borderAccentRe = /(borderAccent:\s*')([^']*?)(')/;
    const borderAccentReDouble = /(borderAccent:\s*")([^"]*?)(")/;
    // Convert hex to rgba with 0.2 alpha
    const r = parseInt(primaryColor.slice(1, 3), 16);
    const g = parseInt(primaryColor.slice(3, 5), 16);
    const b = parseInt(primaryColor.slice(5, 7), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      const borderAccentValue = `rgba(${r}, ${g}, ${b}, 0.2)`;
      if (borderAccentRe.test(content)) {
        content = content.replace(borderAccentRe, `$1${borderAccentValue}$3`);
      } else if (borderAccentReDouble.test(content)) {
        content = content.replace(borderAccentReDouble, `$1${borderAccentValue}$3`);
      }
    }

    console.log(`[patch-tenant-theme] Patched primary color: ${primaryColor}`);
  }

  // Patch brand name
  if (companyName) {
    const brandRe = /(brandName:\s*')([^']*?)(')/;
    const brandReDouble = /(brandName:\s*")([^"]*?)(")/;
    if (brandRe.test(content)) {
      content = content.replace(brandRe, `$1${companyName}$3`);
    } else if (brandReDouble.test(content)) {
      content = content.replace(brandReDouble, `$1${companyName}$3`);
    } else {
      console.warn('[patch-tenant-theme] Could not find brandName field to patch.');
    }
    console.log(`[patch-tenant-theme] Patched brandName: ${companyName}`);
  }

  // Patch logo URL
  if (logoUrl) {
    const logoRe = /(brand:\s*)(null|'[^']*?'|"[^"]*?")/;
    if (logoRe.test(content)) {
      content = content.replace(logoRe, `$1'${logoUrl}'`);
    } else {
      console.warn('[patch-tenant-theme] Could not find logos.brand field to patch.');
    }
    console.log(`[patch-tenant-theme] Patched logos.brand: ${logoUrl}`);
  }

  fs.writeFileSync(CONFIG_PATH, content, 'utf8');
  console.log('[patch-tenant-theme] theme.config.js patched successfully.');
}

main();
