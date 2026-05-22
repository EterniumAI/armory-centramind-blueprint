-- Editorial Hook template: full-bleed media + bottom-anchored title block
-- Colors driven by CSS variables for per-tenant override:
--   --brand-accent (default: #22d3ee)
--   --brand-bg-from (default: #0a0f14)
--   --brand-bg-to (default: #0d1b24)
--   --brand-label (default: "BRAND")

INSERT INTO visual_templates (brand_slug, role, variant, display_name, slots, render_html, aspect_ratio) VALUES
(
  'default', 'hook', 'editorial', 'Editorial Hook',
  '[{"key":"headline","label":"Headline","max_length":80,"multiline":false},{"key":"kicker","label":"Kicker","max_length":40,"multiline":false}]'::jsonb,
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.bg{position:absolute;inset:0}
.bg img{width:100%;height:100%;object-fit:cover}
.overlay{position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,var(--brand-bg-from) 90%)}
.logo{position:absolute;top:40px;left:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:6px;z-index:3}
.logo::after{content:var(--brand-label)}
.title-block{position:absolute;bottom:0;left:0;right:0;padding:48px 48px 56px;z-index:2}
.divider{width:48px;height:3px;background:var(--brand-accent);margin-bottom:16px}
.kicker{font-size:14px;font-weight:600;color:var(--brand-accent);text-transform:uppercase;letter-spacing:3px;margin-bottom:12px}
.headline{font-family:"Playfair Display",serif;font-size:56px;font-weight:700;color:#fff;line-height:1.1;text-shadow:0 2px 16px rgba(0,0,0,0.5)}
</style></head><body>
<div class="bg"><img src="{{hero_image_url}}" alt=""></div>
<div class="overlay"></div>
<div class="logo"></div>
<div class="title-block">
  <div class="divider"></div>
  <div class="kicker">{{kicker}}</div>
  <h1 class="headline">{{headline}}</h1>
</div>
</body></html>',
  '1:1'
)
ON CONFLICT (brand_slug, role, variant) DO NOTHING;
