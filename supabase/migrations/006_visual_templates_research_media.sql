-- V2 Carousel: add research_media inline slot to body + CTA templates
-- Colors driven by CSS variables for per-tenant override.

-- body/classic: media takes bottom half
UPDATE visual_templates
SET
  slots = slots || '[{"key":"research_media","label":"Research Media","max_length":0,"multiline":false}]'::jsonb,
  render_html = '<!DOCTYPE html>
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
.media-slot{position:absolute;bottom:0;left:0;right:0;height:420px;overflow:hidden;z-index:1}
.media-slot img{width:100%;height:100%;object-fit:cover}
.media-overlay{position:absolute;inset:0;background:linear-gradient(180deg,var(--brand-bg-to) 0%,color-mix(in srgb,var(--brand-bg-to) 20%,transparent) 100%)}
</style></head><body>
<div class="logo"></div>
{{#research_media}}
<div style="position:absolute;inset:0">
<div class="content" style="bottom:380px;justify-content:flex-end">
  <div class="bar"></div>
  <h2 class="headline">{{headline}}</h2>
  <p class="body">{{body}}</p>
  <div class="footer">{{footer}}</div>
</div>
<div class="media-slot">
  <img src="{{research_media.url}}" alt="" />
  <div class="media-overlay"></div>
</div>
</div>
{{/research_media}}
{{^research_media}}
<div class="content">
  <div class="bar"></div>
  <h2 class="headline">{{headline}}</h2>
  <p class="body">{{body}}</p>
  <div class="footer">{{footer}}</div>
</div>
{{/research_media}}
</body></html>',
  updated_at = now()
WHERE brand_slug = 'default' AND role = 'body' AND variant = 'classic';

-- body/centered: media centered below headline
UPDATE visual_templates
SET
  slots = slots || '[{"key":"research_media","label":"Research Media","max_length":0,"multiline":false}]'::jsonb,
  render_html = '<!DOCTYPE html>
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
.media-centered{width:600px;height:340px;margin:28px auto 0;border-radius:8px;overflow:hidden;position:relative}
.media-centered img{width:100%;height:100%;object-fit:cover}
.media-centered .media-overlay{position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,color-mix(in srgb,var(--brand-bg-to) 60%,transparent) 100%);border-radius:8px}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <div class="num">{{number}}</div>
  <div class="divider"></div>
  <h2 class="headline">{{headline}}</h2>
  <p class="body">{{body}}</p>
  {{#research_media}}
  <div class="media-centered">
    <img src="{{research_media.url}}" alt="" />
    <div class="media-overlay"></div>
  </div>
  {{/research_media}}
</div>
</body></html>',
  updated_at = now()
WHERE brand_slug = 'default' AND role = 'body' AND variant = 'centered';

-- body/split: media replaces right column when present
UPDATE visual_templates
SET
  slots = slots || '[{"key":"research_media","label":"Research Media","max_length":0,"multiline":false}]'::jsonb,
  render_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px;z-index:3}
.logo::after{content:var(--brand-label)}
.grid{position:absolute;inset:0;display:flex;align-items:center;padding:80px 64px;gap:0;z-index:2}
.left{flex:1;padding-right:48px}
.divider-line{width:2px;background:var(--brand-accent);align-self:stretch;margin:120px 0;opacity:0.5}
.right{flex:1;padding-left:48px}
.headline{font-family:"Inter",sans-serif;font-size:40px;font-weight:700;color:#fff;line-height:1.2}
.body{font-size:20px;color:rgba(255,255,255,0.75);line-height:1.7}
.footer{font-size:13px;color:var(--brand-accent);text-transform:uppercase;letter-spacing:3px;margin-top:32px}
.media-right{width:100%;height:100%;border-radius:8px;overflow:hidden;position:relative}
.media-right img{width:100%;height:100%;object-fit:cover}
.media-right .media-overlay{position:absolute;inset:0;background:linear-gradient(270deg,transparent 50%,color-mix(in srgb,var(--brand-bg-to) 40%,transparent) 100%);border-radius:8px}
</style></head><body>
<div class="logo"></div>
<div class="grid">
  <div class="left"><h2 class="headline">{{headline}}</h2></div>
  <div class="divider-line"></div>
  <div class="right">
    {{#research_media}}
    <div class="media-right">
      <img src="{{research_media.url}}" alt="" />
      <div class="media-overlay"></div>
    </div>
    {{/research_media}}
    {{^research_media}}
    <p class="body">{{body}}</p>
    <div class="footer">{{footer}}</div>
    {{/research_media}}
  </div>
</div>
</body></html>',
  updated_at = now()
WHERE brand_slug = 'default' AND role = 'body' AND variant = 'split';

-- body/callout: media strip above callout box
UPDATE visual_templates
SET
  slots = slots || '[{"key":"research_media","label":"Research Media","max_length":0,"multiline":false}]'::jsonb,
  render_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px;z-index:3}
.logo::after{content:var(--brand-label)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:80px 72px;z-index:2}
.bar{width:48px;height:3px;background:var(--brand-accent);margin-bottom:20px}
.headline{font-family:"Inter",sans-serif;font-size:38px;font-weight:700;color:#fff;line-height:1.2;margin-bottom:28px}
.body{font-size:19px;color:rgba(255,255,255,0.75);line-height:1.65;margin-bottom:28px}
.media-strip{width:100%;height:280px;border-radius:8px;overflow:hidden;position:relative;margin-bottom:28px}
.media-strip img{width:100%;height:100%;object-fit:cover}
.media-strip .media-overlay{position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in srgb,var(--brand-bg-to) 10%,transparent) 0%,color-mix(in srgb,var(--brand-bg-to) 40%,transparent) 100%);border-radius:8px}
.callout-box{background:color-mix(in srgb,var(--brand-accent) 6%,transparent);border-left:3px solid var(--brand-accent);padding:20px 24px;border-radius:0 8px 8px 0;margin-bottom:28px}
.callout{font-size:17px;color:rgba(255,255,255,0.85);line-height:1.6;font-style:italic}
.footer{font-size:13px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:3px}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <div class="bar"></div>
  <h2 class="headline">{{headline}}</h2>
  <p class="body">{{body}}</p>
  {{#research_media}}
  <div class="media-strip">
    <img src="{{research_media.url}}" alt="" />
    <div class="media-overlay"></div>
  </div>
  {{/research_media}}
  <div class="callout-box"><p class="callout">{{callout}}</p></div>
  <div class="footer">{{footer}}</div>
</div>
</body></html>',
  updated_at = now()
WHERE brand_slug = 'default' AND role = 'body' AND variant = 'callout';

-- cta/classic: media strip at bottom
UPDATE visual_templates
SET
  slots = slots || '[{"key":"research_media","label":"Research Media","max_length":0,"multiline":false}]'::jsonb,
  render_html = '<!DOCTYPE html>
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
.media-bottom{position:absolute;bottom:0;left:0;right:0;height:180px;overflow:hidden;z-index:1}
.media-bottom img{width:100%;height:100%;object-fit:cover}
.media-bottom .media-overlay{position:absolute;inset:0;background:linear-gradient(180deg,var(--brand-bg-to) 0%,color-mix(in srgb,var(--brand-bg-to) 30%,transparent) 100%)}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <h2 class="headline">{{headline}}</h2>
  <div class="btn">{{cta_text}}</div>
  <div class="footer">{{footer}}</div>
</div>
{{#research_media}}
<div class="media-bottom">
  <img src="{{research_media.url}}" alt="" />
  <div class="media-overlay"></div>
</div>
{{/research_media}}
</body></html>',
  updated_at = now()
WHERE brand_slug = 'default' AND role = 'cta' AND variant = 'classic';

-- cta/centered: media strip at bottom
UPDATE visual_templates
SET
  slots = slots || '[{"key":"research_media","label":"Research Media","max_length":0,"multiline":false}]'::jsonb,
  render_html = '<!DOCTYPE html>
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
.media-bottom{position:absolute;bottom:0;left:0;right:0;height:180px;overflow:hidden;z-index:1}
.media-bottom img{width:100%;height:100%;object-fit:cover}
.media-bottom .media-overlay{position:absolute;inset:0;background:linear-gradient(180deg,var(--brand-bg-to) 0%,color-mix(in srgb,var(--brand-bg-to) 30%,transparent) 100%)}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <div class="arrow">&#8595;</div>
  <h2 class="headline">{{headline}}</h2>
  <div class="cta">{{cta_text}}</div>
  <div class="footer">{{footer}}</div>
</div>
{{#research_media}}
<div class="media-bottom">
  <img src="{{research_media.url}}" alt="" />
  <div class="media-overlay"></div>
</div>
{{/research_media}}
</body></html>',
  updated_at = now()
WHERE brand_slug = 'default' AND role = 'cta' AND variant = 'centered';

-- cta/minimal: media strip at bottom
UPDATE visual_templates
SET
  slots = slots || '[{"key":"research_media","label":"Research Media","max_length":0,"multiline":false}]'::jsonb,
  render_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px;z-index:3}
.logo::after{content:var(--brand-label)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;text-align:center;padding:80px}
.cta{font-family:"Inter",sans-serif;font-size:72px;font-weight:700;color:var(--brand-accent);line-height:1.1;text-transform:uppercase;letter-spacing:2px;margin-bottom:32px}
.headline{font-size:22px;color:rgba(255,255,255,0.6);line-height:1.5;max-width:640px}
.dot{width:8px;height:8px;background:var(--brand-accent);border-radius:50%;margin:40px auto 0}
.media-bottom{position:absolute;bottom:0;left:0;right:0;height:180px;overflow:hidden;z-index:1}
.media-bottom img{width:100%;height:100%;object-fit:cover}
.media-bottom .media-overlay{position:absolute;inset:0;background:linear-gradient(180deg,var(--brand-bg-to) 0%,color-mix(in srgb,var(--brand-bg-to) 30%,transparent) 100%)}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <div class="cta">{{cta_text}}</div>
  <p class="headline">{{headline}}</p>
  <div class="dot"></div>
</div>
{{#research_media}}
<div class="media-bottom">
  <img src="{{research_media.url}}" alt="" />
  <div class="media-overlay"></div>
</div>
{{/research_media}}
</body></html>',
  updated_at = now()
WHERE brand_slug = 'default' AND role = 'cta' AND variant = 'minimal';

-- cta/community: media strip at bottom
UPDATE visual_templates
SET
  slots = slots || '[{"key":"research_media","label":"Research Media","max_length":0,"multiline":false}]'::jsonb,
  render_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
:root{--brand-accent:#22d3ee;--brand-bg-from:#0a0f14;--brand-bg-to:#0d1b24;--brand-label:"BRAND"}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:"Inter",sans-serif;background:linear-gradient(180deg,var(--brand-bg-from) 0%,var(--brand-bg-to) 100%)}
.logo{position:absolute;top:40px;right:48px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:6px;z-index:3}
.logo::after{content:var(--brand-label)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;text-align:center;padding:80px}
.headline{font-family:"Inter",sans-serif;font-size:36px;font-weight:700;color:#fff;line-height:1.3;margin-bottom:48px;max-width:720px}
.arrow{font-size:48px;color:var(--brand-accent);margin-bottom:32px;line-height:1}
.cta{font-size:24px;font-weight:700;color:var(--brand-accent);text-transform:uppercase;letter-spacing:3px;margin-bottom:24px}
.handle{display:inline-block;padding:12px 40px;border:2px solid color-mix(in srgb,var(--brand-accent) 30%,transparent);border-radius:40px;font-size:18px;color:rgba(255,255,255,0.6);letter-spacing:1px}
.media-bottom{position:absolute;bottom:0;left:0;right:0;height:180px;overflow:hidden;z-index:1}
.media-bottom img{width:100%;height:100%;object-fit:cover}
.media-bottom .media-overlay{position:absolute;inset:0;background:linear-gradient(180deg,var(--brand-bg-to) 0%,color-mix(in srgb,var(--brand-bg-to) 30%,transparent) 100%)}
</style></head><body>
<div class="logo"></div>
<div class="content">
  <h2 class="headline">{{headline}}</h2>
  <div class="arrow">&#8595;</div>
  <div class="cta">{{cta_text}}</div>
  <div class="handle">{{footer}}</div>
</div>
{{#research_media}}
<div class="media-bottom">
  <img src="{{research_media.url}}" alt="" />
  <div class="media-overlay"></div>
</div>
{{/research_media}}
</body></html>',
  updated_at = now()
WHERE brand_slug = 'default' AND role = 'cta' AND variant = 'community';
