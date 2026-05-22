-- Blueprint V2 carousel templates: 6 generic variants
-- Colors driven by CSS variables for per-tenant override:
--   --brand-accent (default: #22d3ee)
--   --brand-bg-from (default: #0a0f14)
--   --brand-bg-to (default: #0d1b24)
--   --brand-label (default: "BRAND")

INSERT INTO visual_templates (brand_slug, role, variant, display_name, slots, render_html, aspect_ratio) VALUES
-- hook/stat_hero
(
  'default', 'hook', 'stat_hero', 'Stat Hero',
  '[{"key":"headline","label":"Headline","max_length":60,"multiline":false},{"key":"stat_number","label":"Stat Number","max_length":10,"multiline":false},{"key":"stat_caption","label":"Stat Caption","max_length":50,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px}
.logo::after{content:var(--brand-label)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;text-align:center;padding:80px}
.stat{font-family:"Inter",sans-serif;font-size:180px;font-weight:700;color:var(--brand-accent);line-height:1;text-shadow:0 8px 40px color-mix(in srgb,var(--brand-accent) 25%,transparent)}
.caption{font-size:18px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:4px;margin-top:12px;margin-bottom:48px}
.headline{font-family:"Inter",sans-serif;font-size:36px;font-weight:700;color:#fff;line-height:1.25;max-width:720px}
.line{width:64px;height:2px;background:var(--brand-accent);margin:32px auto 0}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <div class="stat">{{stat_number}}</div>
  <div class="caption">{{stat_caption}}</div>
  <h1 class="headline">{{headline}}</h1>
  <div class="line"></div>
</div>
</body></html>',
  '1:1'
),
-- hook/quote
(
  'default', 'hook', 'quote', 'Quote Hook',
  '[{"key":"quote_text","label":"Quote","max_length":200,"multiline":true},{"key":"attribution","label":"Attribution","max_length":60,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px}
.logo::after{content:var(--brand-label)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:80px 72px;z-index:2}
.mark{font-size:120px;color:color-mix(in srgb,var(--brand-accent) 20%,transparent);line-height:0.8;font-family:serif;margin-bottom:-20px}
.quote{font-family:"Playfair Display",serif;font-size:42px;font-weight:700;color:#fff;line-height:1.3;font-style:italic;margin-bottom:40px}
.divider{width:48px;height:2px;background:var(--brand-accent);margin-bottom:20px}
.attribution{font-size:16px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:3px}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <div class="mark">"</div>
  <p class="quote">{{quote_text}}</p>
  <div class="divider"></div>
  <div class="attribution">{{attribution}}</div>
</div>
</body></html>',
  '1:1'
),
-- body/split
(
  'default', 'body', 'split', 'Split',
  '[{"key":"headline","label":"Headline","max_length":60,"multiline":false},{"key":"body","label":"Body Text","max_length":400,"multiline":true},{"key":"footer","label":"Footer Note","max_length":60,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px}
.logo::after{content:var(--brand-label)}
.grid{position:absolute;inset:0;display:flex;align-items:center;padding:80px 64px;gap:0;z-index:2}
.left{flex:1;padding-right:48px}
.divider{width:2px;background:var(--brand-accent);align-self:stretch;margin:120px 0;opacity:0.5}
.right{flex:1;padding-left:48px}
.headline{font-family:"Inter",sans-serif;font-size:40px;font-weight:700;color:#fff;line-height:1.2}
.body{font-size:20px;color:rgba(255,255,255,0.75);line-height:1.7}
.footer{font-size:13px;color:var(--brand-accent);text-transform:uppercase;letter-spacing:3px;margin-top:32px}
</style></head><body>
<div class="logo"></div>
<div class="grid">
  <div class="left"><h2 class="headline">{{headline}}</h2></div>
  <div class="divider"></div>
  <div class="right">
    <p class="body">{{body}}</p>
    <div class="footer">{{footer}}</div>
  </div>
</div>
</body></html>',
  '1:1'
),
-- body/callout
(
  'default', 'body', 'callout', 'Callout',
  '[{"key":"headline","label":"Headline","max_length":60,"multiline":false},{"key":"body","label":"Body Text","max_length":400,"multiline":true},{"key":"callout","label":"Callout Text","max_length":120,"multiline":true},{"key":"footer","label":"Footer Note","max_length":60,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px}
.logo::after{content:var(--brand-label)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:80px 72px;z-index:2}
.bar{width:48px;height:3px;background:var(--brand-accent);margin-bottom:20px}
.headline{font-family:"Inter",sans-serif;font-size:38px;font-weight:700;color:#fff;line-height:1.2;margin-bottom:28px}
.body{font-size:19px;color:rgba(255,255,255,0.75);line-height:1.65;margin-bottom:28px}
.callout-box{background:color-mix(in srgb,var(--brand-accent) 6%,transparent);border-left:3px solid var(--brand-accent);padding:20px 24px;border-radius:0 8px 8px 0;margin-bottom:28px}
.callout{font-size:17px;color:rgba(255,255,255,0.85);line-height:1.6;font-style:italic}
.footer{font-size:13px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:3px}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <div class="bar"></div>
  <h2 class="headline">{{headline}}</h2>
  <p class="body">{{body}}</p>
  <div class="callout-box"><p class="callout">{{callout}}</p></div>
  <div class="footer">{{footer}}</div>
</div>
</body></html>',
  '1:1'
),
-- cta/minimal
(
  'default', 'cta', 'minimal', 'Minimal',
  '[{"key":"cta_text","label":"CTA Text","max_length":30,"multiline":false},{"key":"headline","label":"Supporting Line","max_length":60,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px}
.logo::after{content:var(--brand-label)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;text-align:center;padding:80px}
.cta{font-family:"Inter",sans-serif;font-size:72px;font-weight:700;color:var(--brand-accent);line-height:1.1;text-transform:uppercase;letter-spacing:2px;margin-bottom:32px}
.headline{font-size:22px;color:rgba(255,255,255,0.6);line-height:1.5;max-width:640px}
.dot{width:8px;height:8px;background:var(--brand-accent);border-radius:50%;margin:40px auto 0}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <div class="cta">{{cta_text}}</div>
  <p class="headline">{{headline}}</p>
  <div class="dot"></div>
</div>
</body></html>',
  '1:1'
),
-- cta/community
(
  'default', 'cta', 'community', 'Community',
  '[{"key":"cta_text","label":"CTA Text","max_length":40,"multiline":false},{"key":"headline","label":"Headline","max_length":60,"multiline":false},{"key":"footer","label":"Handle / URL","max_length":40,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px}
.logo::after{content:var(--brand-label)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;text-align:center;padding:80px}
.headline{font-family:"Inter",sans-serif;font-size:36px;font-weight:700;color:#fff;line-height:1.3;margin-bottom:48px;max-width:720px}
.arrow{font-size:48px;color:var(--brand-accent);margin-bottom:32px;line-height:1}
.cta{font-size:24px;font-weight:700;color:var(--brand-accent);text-transform:uppercase;letter-spacing:3px;margin-bottom:24px}
.handle{display:inline-block;padding:12px 40px;border:2px solid color-mix(in srgb,var(--brand-accent) 30%,transparent);border-radius:40px;font-size:18px;color:rgba(255,255,255,0.6);letter-spacing:1px}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <h2 class="headline">{{headline}}</h2>
  <div class="arrow">&#8595;</div>
  <div class="cta">{{cta_text}}</div>
  <div class="handle">{{footer}}</div>
</div>
</body></html>',
  '1:1'
)
ON CONFLICT (brand_slug, role, variant) DO NOTHING;
