-- Visual Templates for carousel slide rendering
-- Each row defines a template with render_html, slots, and metadata.
-- Tenant-agnostic: uses 'default' brand_slug. Post-deploy UPDATE can override
-- accent color and brand label per tenant.

CREATE TABLE IF NOT EXISTS visual_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_slug TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('hook','body','cta')),
  variant TEXT NOT NULL,
  display_name TEXT NOT NULL,
  slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  render_html TEXT NOT NULL,
  preview_url TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '1:1',
  enabled BOOLEAN NOT NULL DEFAULT true,
  studio_layers JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_slug, role, variant)
);

ALTER TABLE visual_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS visual_templates_read ON visual_templates
  FOR SELECT TO authenticated, anon USING (enabled = true);

CREATE INDEX IF NOT EXISTS visual_templates_brand_role_idx
  ON visual_templates(brand_slug, role) WHERE enabled = true;

-- Seed: generic hook/classic
INSERT INTO visual_templates (brand_slug, role, variant, display_name, slots, render_html, aspect_ratio) VALUES
(
  'default', 'hook', 'classic', 'Classic',
  '[{"key":"headline","label":"Headline","max_length":80,"multiline":false},{"key":"accent_phrase","label":"Accent Phrase","max_length":40,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:#0a0a0a}
.bg{position:absolute;inset:0}.bg img{width:100%;height:100%;object-fit:cover}
.overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,10,0.15) 0%,rgba(10,10,10,0.85) 100%)}
.side-l,.side-r{position:absolute;top:0;bottom:0;width:6px}
.side-l{left:0;background:var(--brand-accent)}.side-r{right:0;background:var(--brand-accent)}
.content{position:absolute;bottom:80px;left:48px;right:48px;z-index:2}
.headline{font-family:"Playfair Display",serif;font-size:64px;font-weight:700;color:#fff;line-height:1.1;margin-bottom:16px;text-shadow:0 2px 12px rgba(0,0,0,0.6)}
.accent{font-size:20px;font-weight:600;color:var(--brand-accent);text-transform:uppercase;letter-spacing:2px}
</style></head><body>
<div class="bg"><img src="{{hero_image_url}}" alt=""></div>
<div class="overlay"></div>
<div class="side-l"></div><div class="side-r"></div>
<div class="content">
  <div class="accent">{{accent_phrase}}</div>
  <h1 class="headline">{{headline}}</h1>
</div>
</body></html>',
  '1:1'
),
-- hook/centered
(
  'default', 'hook', 'centered', 'Centered',
  '[{"key":"headline","label":"Headline","max_length":60,"multiline":false},{"key":"stat_number","label":"Stat Number","max_length":10,"multiline":false},{"key":"stat_label","label":"Stat Label","max_length":30,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;text-align:center;padding:64px}
.stat{font-family:"JetBrains Mono",monospace;font-size:120px;font-weight:700;color:var(--brand-accent);line-height:1}
.stat-label{font-size:18px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:3px;margin-top:8px;margin-bottom:32px}
.headline{font-family:"Playfair Display",serif;font-size:48px;font-weight:700;color:#fff;line-height:1.15}
</style></head><body>
<div class="content">
  <div class="stat">{{stat_number}}</div>
  <div class="stat-label">{{stat_label}}</div>
  <h1 class="headline">{{headline}}</h1>
</div>
</body></html>',
  '1:1'
),
-- body/classic
(
  'default', 'body', 'classic', 'Classic',
  '[{"key":"headline","label":"Headline","max_length":60,"multiline":false},{"key":"body","label":"Body Text","max_length":300,"multiline":true},{"key":"footer","label":"Footer Note","max_length":60,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px;z-index:3}
.logo::after{content:var(--brand-label)}
.content{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;justify-content:center;padding:72px 56px;z-index:2}
.bar{width:48px;height:3px;background:var(--brand-accent);margin-bottom:16px}
.headline{font-family:"Inter",sans-serif;font-size:44px;font-weight:700;color:#fff;line-height:1.15;margin-bottom:20px}
.body{font-size:22px;color:rgba(255,255,255,0.85);line-height:1.6;margin-bottom:24px}
.footer{font-size:14px;color:var(--brand-accent);text-transform:uppercase;letter-spacing:2px}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <div class="bar"></div>
  <h2 class="headline">{{headline}}</h2>
  <p class="body">{{body}}</p>
  <div class="footer">{{footer}}</div>
</div>
</body></html>',
  '1:1'
),
-- body/centered
(
  'default', 'body', 'centered', 'Editorial',
  '[{"key":"headline","label":"Headline","max_length":60,"multiline":false},{"key":"body","label":"Body Text","max_length":400,"multiline":true},{"key":"number","label":"Slide Number","max_length":5,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px;z-index:3}
.logo::after{content:var(--brand-label)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:72px;z-index:2}
.num{font-family:"JetBrains Mono",monospace;font-size:80px;font-weight:700;color:color-mix(in srgb,var(--brand-accent) 30%,transparent);position:absolute;top:48px;right:56px}
.headline{font-family:"Inter",sans-serif;font-size:40px;font-weight:700;color:#fff;line-height:1.2;margin-bottom:24px}
.body{font-size:20px;color:rgba(255,255,255,0.8);line-height:1.7}
.divider{width:64px;height:2px;background:var(--brand-accent);margin-bottom:24px}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <div class="num">{{number}}</div>
  <div class="divider"></div>
  <h2 class="headline">{{headline}}</h2>
  <p class="body">{{body}}</p>
</div>
</body></html>',
  '1:1'
),
-- cta/classic
(
  'default', 'cta', 'classic', 'Classic',
  '[{"key":"cta_text","label":"CTA Text","max_length":40,"multiline":false},{"key":"headline","label":"Headline","max_length":60,"multiline":false},{"key":"footer","label":"Handle / URL","max_length":40,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px;z-index:3}
.logo::after{content:var(--brand-label)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;text-align:center;padding:64px}
.headline{font-family:"Inter",sans-serif;font-size:48px;font-weight:700;color:#fff;line-height:1.15;margin-bottom:40px;max-width:800px}
.btn{display:inline-block;padding:20px 56px;background:var(--brand-accent);color:#0a0a0a;font-size:20px;font-weight:700;border-radius:8px;text-transform:uppercase;letter-spacing:2px}
.footer{margin-top:32px;font-size:16px;color:rgba(255,255,255,0.5)}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <h2 class="headline">{{headline}}</h2>
  <div class="btn">{{cta_text}}</div>
  <div class="footer">{{footer}}</div>
</div>
</body></html>',
  '1:1'
),
-- cta/centered
(
  'default', 'cta', 'centered', 'Arrow',
  '[{"key":"cta_text","label":"CTA Text","max_length":40,"multiline":false},{"key":"headline","label":"Headline","max_length":50,"multiline":false},{"key":"footer","label":"Handle / URL","max_length":40,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px;z-index:3}
.logo::after{content:var(--brand-label)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;text-align:center;padding:72px}
.arrow{font-size:96px;color:var(--brand-accent);margin-bottom:24px;line-height:1}
.headline{font-family:"Inter",sans-serif;font-size:44px;font-weight:700;color:#fff;line-height:1.15;margin-bottom:24px;max-width:800px}
.cta{font-size:22px;font-weight:600;color:var(--brand-accent);text-transform:uppercase;letter-spacing:3px;margin-bottom:32px}
.footer{font-size:16px;color:rgba(255,255,255,0.4)}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <div class="arrow">&#8595;</div>
  <h2 class="headline">{{headline}}</h2>
  <div class="cta">{{cta_text}}</div>
  <div class="footer">{{footer}}</div>
</div>
</body></html>',
  '1:1'
)
ON CONFLICT (brand_slug, role, variant) DO NOTHING;
