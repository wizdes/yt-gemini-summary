// Renders all Chrome Web Store images into store-assets/images/.
//
// The extension's core UX lives on third-party pages (the toolbar button on
// YouTube → auto-fill in Gemini), so screenshots 1 + 4 + 5 are tasteful on-brand
// HTML/CSS illustrations (clearly stylized, not literal screenshots of YouTube or
// Gemini). Screenshots 2 + 3 render the REAL shipped welcome.html / options.html
// standalone, forced to light color-scheme for a consistent look.
//
// Screenshots are PNG (crisp UI); the two promo tiles are JPEG (the store wants
// 24-bit, no-alpha promo art). Run with: npm run store-assets
//
// No extension load needed — we render everything in headless Chromium, so none of
// the MV3 `--load-extension` flakiness applies.

import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const OUT = join(here, 'images');
mkdirSync(OUT, { recursive: true });

// --- reused real assets -----------------------------------------------------

const dataUri = (rel) =>
  'data:image/png;base64,' + readFileSync(join(ROOT, rel)).toString('base64');
const ICON = dataUri('icons/icon128.png'); // brain + play, no dot
const ICON_ON = dataUri('icons/icon128-on.png'); // green "ready" dot variant

const REPO = 'github.com/wizdes/yt-gemini-summary';
const ABOUT = 'https://yili.dev/projects/youtube_summary_with_gemini/';

// --- brand tokens (from the spec) -------------------------------------------
//   gradient indigo→violet #7C4DFF → #4E27D6 ; ready dot #01AD4E
//   UI accent Google blue #1a73e8 ; success #1e8e3e ; muted #5f6368 ; border #d2d6dc
//   landing dark bg #24252f
const BRAND = `
  :root{
    --g1:#7C4DFF; --g2:#4E27D6; --ready:#01AD4E;
    --accent:#1a73e8; --success:#1e8e3e; --muted:#5f6368; --border:#d2d6dc;
    --dark:#24252f;
  }
  html,body{margin:0;}
  *{box-sizing:border-box;}
  .frame{font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}
`;

// Marketing layout. .shot = 1280×800 captioned frame with headline + OSS badge.
const LAYOUT_CSS = `
  .shot{width:1280px;height:800px;position:relative;overflow:hidden;display:flex;
    flex-direction:column;align-items:center;padding:56px 64px 0;
    background:radial-gradient(125% 120% at 50% -10%, #2f3040 0%, var(--dark) 72%);}
  .shot--light{background:radial-gradient(125% 120% at 50% -10%, #ffffff 0%, #eef0f6 78%);}
  .shot-head{text-align:center;max-width:1080px;display:flex;flex-direction:column;align-items:center;}
  .shot-headline{margin:0;font-size:44px;line-height:1.08;font-weight:800;letter-spacing:-0.8px;color:#f3f1ff;}
  .shot--light .shot-headline{color:#1b1f24;}
  .shot-sub{margin:13px 0 0;font-size:20px;line-height:1.4;color:#b9b6d6;max-width:860px;}
  .shot--light .shot-sub{color:var(--muted);}
  .shot-badge{display:inline-flex;align-items:center;gap:9px;margin-top:18px;padding:8px 16px;
    border-radius:999px;border:1.5px solid rgba(124,77,255,.55);background:rgba(124,77,255,.12);
    color:#cbbcff;font-size:15px;font-weight:700;letter-spacing:.2px;}
  .shot--light .shot-badge{border-color:rgba(78,39,214,.4);background:rgba(124,77,255,.08);color:#4E27D6;}
  .shot-badge .dot{width:9px;height:9px;border-radius:50%;background:var(--ready);}
  .shot-stage{margin-top:40px;flex:1;width:100%;display:flex;align-items:center;justify-content:center;}

  /* a chrome-style window frame for embedding the real pages */
  .win{border-radius:14px;overflow:hidden;background:#fff;border:1px solid rgba(0,0,0,.08);
    box-shadow:0 34px 80px rgba(20,10,60,.5);}
  .shot--light .win{box-shadow:0 30px 70px rgba(80,60,160,.18);}
  .win-bar{height:38px;background:#f1f3f4;display:flex;align-items:center;gap:8px;padding:0 14px;border-bottom:1px solid #e3e6ea;}
  .win-bar i{width:11px;height:11px;border-radius:50%;display:inline-block;}
  .win-bar .r{background:#ff5f57;} .win-bar .y{background:#febc2e;} .win-bar .g{background:#28c840;}
  .win-url{margin-left:12px;flex:1;height:22px;border-radius:11px;background:#fff;border:1px solid #e3e6ea;
    display:flex;align-items:center;padding:0 12px;font-size:12px;color:#80868b;}
  .win iframe{display:block;border:0;background:#fff;}

  /* HERO composite: youtube card → arrow → gemini panel */
  .flow{display:flex;align-items:center;gap:36px;padding-top:96px;}
  .yt-wrap{position:relative;} /* holds the overflowing toolbar-button overlay */
  .yt-card{width:368px;background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(20,10,60,.45);overflow:hidden;}
  .yt-thumb{position:relative;height:207px;background:linear-gradient(135deg,#1e2030,#33354a);}
  .yt-thumb .ply{position:absolute;inset:0;margin:auto;width:74px;height:52px;border-radius:14px;
    background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;}
  .yt-thumb .ply::after{content:"";border-style:solid;border-width:13px 0 13px 22px;border-color:transparent transparent transparent #fff;margin-left:4px;}
  .yt-thumb .len{position:absolute;right:10px;bottom:10px;background:rgba(0,0,0,.82);color:#fff;
    font-size:13px;font-weight:600;padding:2px 7px;border-radius:5px;}
  .yt-meta{display:flex;gap:12px;padding:14px 14px 18px;}
  .yt-av{width:38px;height:38px;border-radius:50%;flex:none;background:linear-gradient(135deg,#7C4DFF,#4E27D6);}
  .yt-tt{font-size:16px;font-weight:700;color:#0f0f0f;line-height:1.3;}
  .yt-by{font-size:13px;color:#606060;margin-top:5px;}
  /* the toolbar button overlay (green-dot ready) sits above the card's top-right */
  .yt-btn{position:absolute;top:-58px;right:14px;width:84px;height:84px;border-radius:20px;background:#fff;
    box-shadow:0 14px 34px rgba(20,10,60,.45);display:flex;align-items:center;justify-content:center;
    border:2px solid #efeaff;z-index:3;}
  .yt-btn img{width:58px;height:58px;}
  .yt-btn-cap{position:absolute;top:-90px;right:-2px;background:var(--ready);color:#fff;font-size:12.5px;
    font-weight:700;padding:5px 11px;border-radius:999px;white-space:nowrap;box-shadow:0 6px 16px rgba(1,173,78,.45);z-index:3;}
  .arrow{display:flex;flex-direction:column;align-items:center;gap:8px;color:#b9b6d6;}
  .arrow svg{filter:drop-shadow(0 4px 10px rgba(124,77,255,.5));}
  .arrow span{font-size:13px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:#9d96d0;}

  .gem{width:430px;background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(20,10,60,.45);overflow:hidden;}
  .gem-bar{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #eceef1;}
  .gem-spark{width:22px;height:22px;border-radius:50%;background:conic-gradient(from 210deg,#4E27D6,#1a73e8,#7C4DFF,#4E27D6);}
  .gem-name{font-size:15px;font-weight:700;color:#1f1f1f;}
  .gem-body{padding:18px;}
  .gem-bubble{background:#f0f4ff;border:1px solid #dbe4ff;border-radius:14px 14px 14px 4px;padding:14px 16px;font-size:15px;color:#1b1f24;}
  .gem-bubble b{font-weight:700;}
  .gem-bubble .meta{margin-top:10px;font-size:13.5px;color:#5b6470;}
  .gem-bubble .meta a{color:var(--accent);}
  .gem-input{margin-top:16px;display:flex;align-items:center;gap:10px;border:1.5px solid #e3e6ea;border-radius:999px;padding:10px 8px 10px 16px;}
  .gem-input span{flex:1;font-size:14px;color:#9aa0a6;}
  .gem-input .go{flex:none;width:34px;height:34px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;}
  .gem-input .go::after{content:"";border-style:solid;border-width:7px 0 7px 11px;border-color:transparent transparent transparent #fff;margin-left:2px;}
  .gem-typing{margin-top:12px;font-size:13px;color:var(--muted);display:flex;align-items:center;gap:8px;}
  .gem-typing .pulse{width:8px;height:8px;border-radius:50%;background:var(--accent);}

  /* icon-states shot (#4) */
  .states{display:flex;gap:64px;align-items:flex-end;}
  .state{display:flex;flex-direction:column;align-items:center;gap:18px;}
  .state .chip{width:158px;height:158px;border-radius:34px;background:#fff;display:flex;align-items:center;justify-content:center;
    box-shadow:0 22px 54px rgba(20,10,60,.42);}
  .state .chip img{width:104px;height:104px;}
  .state .lab{font-size:18px;font-weight:700;color:#f3f1ff;}
  .state .lab.on{color:#7ee6a8;}
  .state .sub2{font-size:14.5px;color:#b9b6d6;max-width:230px;text-align:center;line-height:1.4;}

  /* open-source shot (#5) */
  .oss{display:flex;flex-direction:column;align-items:center;gap:26px;}
  .oss-icon{width:140px;height:140px;border-radius:32px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 24px 58px rgba(20,10,60,.45);}
  .oss-icon img{width:96px;height:96px;}
  .oss-pills{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;}
  .oss-pill{display:flex;align-items:center;gap:9px;padding:11px 20px;border-radius:999px;
    border:1.5px solid rgba(124,77,255,.5);background:rgba(124,77,255,.1);color:#cbbcff;font-size:17px;font-weight:700;}
  .oss-pill .d{width:9px;height:9px;border-radius:50%;background:var(--ready);}
  .oss-repo{margin-top:2px;font-size:19px;color:#9d96d0;font-weight:600;}

  /* MARQUEE 1400×560 */
  .marq{width:1400px;height:560px;position:relative;overflow:hidden;display:flex;align-items:center;
    background:radial-gradient(135% 135% at 8% 12%, #34354a 0%, var(--dark) 70%);}
  .marq-left{width:660px;flex:none;padding-left:84px;}
  .marq-brand{display:flex;align-items:center;gap:16px;}
  .marq-icon{width:62px;height:62px;border-radius:15px;box-shadow:0 8px 22px rgba(0,0,0,.45);}
  .marq-kicker{font-size:17px;color:#b9b6d6;font-weight:700;letter-spacing:.3px;}
  .marq-title{margin:26px 0 0;font-size:52px;line-height:1.05;font-weight:800;letter-spacing:-1px;color:#f3f1ff;}
  .marq-sub{margin:18px 0 0;font-size:21px;line-height:1.42;color:#b9b6d6;max-width:520px;}
  .marq-row{display:flex;align-items:center;gap:18px;margin-top:30px;}
  .marq-badge{display:inline-flex;align-items:center;gap:9px;padding:8px 16px;border-radius:999px;
    border:1.5px solid rgba(124,77,255,.55);background:rgba(124,77,255,.14);color:#cbbcff;font-size:15px;font-weight:700;}
  .marq-badge .dot{width:9px;height:9px;border-radius:50%;background:var(--ready);}
  .marq-url{font-size:16px;color:#8aa8ff;font-weight:600;}
  .marq-right{flex:1;display:flex;align-items:center;justify-content:center;padding-right:48px;}

  /* SMALL TILE 440×280 */
  .smtile{width:440px;height:280px;position:relative;overflow:hidden;padding:30px 28px;
    background:radial-gradient(135% 135% at 22% 8%, #34354a 0%, var(--dark) 78%);}
  .smtile-top{display:flex;align-items:center;gap:14px;}
  .smtile-icon{width:54px;height:54px;border-radius:13px;box-shadow:0 6px 16px rgba(0,0,0,.45);}
  .smtile-title{font-size:23px;font-weight:800;color:#f3f1ff;letter-spacing:-.3px;line-height:1.14;}
  .smtile-tag{margin-top:18px;font-size:16px;line-height:1.4;color:#b9b6d6;max-width:330px;}
  .smtile-badge{position:absolute;bottom:22px;right:24px;display:inline-flex;align-items:center;gap:7px;
    padding:5px 12px;border-radius:999px;border:1.4px solid rgba(124,77,255,.6);background:rgba(124,77,255,.16);
    color:#cbbcff;font-size:12px;font-weight:800;letter-spacing:.3px;}
  .smtile-badge .dot{width:7px;height:7px;border-radius:50%;background:var(--ready);}
  .smtile-foot{position:absolute;left:28px;bottom:26px;display:flex;align-items:center;gap:10px;}
  .smtile-foot .pill{font-size:12.5px;font-weight:700;color:#9d96d0;}
`;

const ARROW_SVG = `<svg width="76" height="40" viewBox="0 0 76 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 20H66" stroke="url(#ag)" stroke-width="5" stroke-linecap="round"/>
  <path d="M54 6L72 20L54 34" stroke="url(#ag)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <defs><linearGradient id="ag" x1="2" y1="20" x2="74" y2="20" gradientUnits="userSpaceOnUse">
  <stop stop-color="#7C4DFF"/><stop offset="1" stop-color="#4E27D6"/></linearGradient></defs></svg>`;

const badge = () => `<span class="shot-badge"><span class="dot"></span>Open Source · MIT</span>`;

const doc = (body, extraCss = '') =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${BRAND}${LAYOUT_CSS}${extraCss}</style></head><body class="frame">${body}</body></html>`;

// shot wrapper: headline + sub + OSS badge + a stage holding `inner`.
const shot = (headline, sub, inner, { light = false } = {}) =>
  doc(`<div class="shot${light ? ' shot--light' : ''}">
    <div class="shot-head"><h1 class="shot-headline">${headline}</h1>
    <p class="shot-sub">${sub}</p>${badge()}</div>
    <div class="shot-stage">${inner}</div>
  </div>`);

// --- HERO composite (#1) ----------------------------------------------------
const HERO = shot(
  'Summarize any YouTube video in one click',
  'Click the toolbar button → Gemini opens with your summary prompt filled in and the title &amp; link attached automatically. (Illustration of the flow.)',
  `<div class="flow">
     <div class="yt-wrap">
       <div class="yt-btn"><img src="${ICON_ON}" alt=""></div>
       <div class="yt-btn-cap">● Ready — click to summarize</div>
       <div class="yt-card">
         <div class="yt-thumb"><div class="ply"></div><div class="len">18:42</div></div>
         <div class="yt-meta"><div class="yt-av"></div>
           <div><div class="yt-tt">How transformers actually work — a visual guide</div>
           <div class="yt-by">DeepLearn Daily · 412K views</div></div></div>
       </div>
     </div>
     <div class="arrow">${ARROW_SVG}<span>one click</span></div>
     <div class="gem">
       <div class="gem-bar"><div class="gem-spark"></div><div class="gem-name">Gemini</div></div>
       <div class="gem-body">
         <div class="gem-bubble"><b>Summarize the video:</b>
           <div class="meta">How transformers actually work — a visual guide<br>
           <a href="#">https://www.youtube.com/watch?v=dQw4w9WgXcQ</a></div></div>
         <div class="gem-input"><span>Edit the prompt to analyze, critique, or ask questions…</span><span class="go"></span></div>
         <div class="gem-typing"><span class="pulse"></span>Auto-filled &amp; sent — summary generating…</div>
       </div>
     </div>
   </div>`,
);

// --- icon-states (#4) -------------------------------------------------------
const STATES = shot(
  'A green dot when you’re ready',
  'The toolbar icon stays quiet on other pages and lights up with a green “ready” dot the moment you’re on a YouTube video — and the prompt is always yours to edit.',
  `<div class="states">
     <div class="state"><div class="chip"><img src="${ICON}" alt="idle icon"></div>
       <div class="lab">Not a video</div><div class="sub2">Calm icon, no dot — nothing to summarize.</div></div>
     <div class="state"><div class="chip"><img src="${ICON_ON}" alt="ready icon"></div>
       <div class="lab on">● Ready</div><div class="sub2">Green dot = you’re on a video. One click summarizes it.</div></div>
   </div>`,
);

// --- open source (#5) -------------------------------------------------------
const OSS = shot(
  'Free &amp; open source',
  'MIT licensed. No tracking, no ads, no data sent to the developer — read every line yourself.',
  `<div class="oss">
     <div class="oss-icon"><img src="${ICON}" alt=""></div>
     <div class="oss-pills">
       <span class="oss-pill"><span class="d"></span>MIT licensed</span>
       <span class="oss-pill"><span class="d"></span>No tracking</span>
       <span class="oss-pill"><span class="d"></span>No ads</span>
       <span class="oss-pill"><span class="d"></span>Manifest V3</span>
     </div>
     <div class="oss-repo">${REPO}</div>
   </div>`,
);

// --- real-page shots (#2 welcome, #3 options) -------------------------------
// We render the real page into an <iframe srcdoc>, forcing light color-scheme so
// the `Canvas`/`CanvasText` system colors resolve consistently. Relative asset
// refs (icons/icon128.png, options.css) are rewritten to data/inline so the
// srcdoc iframe can resolve them with no extension origin.

const optionsCss = readFileSync(join(ROOT, 'options.css'), 'utf8');
const FORCE_LIGHT = `<style>:root{color-scheme:light !important;}html,body{background:#ffffff !important;}</style>`;

let welcomeHtml = readFileSync(join(ROOT, 'welcome.html'), 'utf8')
  .replace('icons/icon128.png', ICON)
  .replace('</head>', `${FORCE_LIGHT}</head>`);

let optionsHtml = readFileSync(join(ROOT, 'options.html'), 'utf8')
  .replace('<link rel="stylesheet" href="options.css" />', `<style>${optionsCss}</style>`)
  .replace('<script type="module" src="options.js"></script>', '')
  // pre-fill the editable prompt so the page reads as a real, used options screen
  .replace(
    '<textarea id="prompt" spellcheck="false" aria-label="Summary prompt"></textarea>',
    '<textarea id="prompt" spellcheck="false" aria-label="Summary prompt">Summarize the video in 5 bullet points, then list any action items.</textarea>',
  )
  .replace('<span id="status" role="status" aria-live="polite"></span>', '<span id="status" role="status" aria-live="polite">Saved</span>')
  .replace('</head>', `${FORCE_LIGHT}</head>`);

const winFrame = (url, iframeW, iframeH, srcdoc) =>
  `<div class="win" style="width:${iframeW + 2}px;">
     <div class="win-bar"><i class="r"></i><i class="y"></i><i class="g"></i>
       <div class="win-url">${url}</div></div>
     <iframe width="${iframeW}" height="${iframeH}" srcdoc="${srcdoc.replace(/"/g, '&quot;')}"></iframe>
   </div>`;

const WELCOME = shot(
  'Set up in seconds',
  'Install, pin the icon, open a video, click. The built-in welcome page walks you through it.',
  winFrame('chrome-extension · welcome', 820, 520, welcomeHtml),
);

const OPTIONS = shot(
  'Your prompt, your way',
  'Summarize, analyze, critique, or ask your own questions. The video’s title and link are added for you — edit the rest any time.',
  winFrame('Extension options', 820, 520, optionsHtml),
);

// --- promos -----------------------------------------------------------------
const MARQUEE = doc(`<div class="marq">
   <div class="marq-left">
     <div class="marq-brand"><img class="marq-icon" src="${ICON_ON}"><span class="marq-kicker">Chrome extension</span></div>
     <h1 class="marq-title">YouTube Summary<br>with Gemini</h1>
     <p class="marq-sub">One click summarizes the video you’re watching — Gemini opens with your prompt filled in, title and link attached.</p>
     <div class="marq-row"><span class="marq-badge"><span class="dot"></span>Open Source · MIT</span><span class="marq-url">${REPO}</span></div>
   </div>
   <div class="marq-right">
     <div class="gem" style="width:470px;">
       <div class="gem-bar"><div class="gem-spark"></div><div class="gem-name">Gemini</div></div>
       <div class="gem-body">
         <div class="gem-bubble"><b>Summarize the video:</b>
           <div class="meta">How transformers actually work — a visual guide<br>
           <a href="#">https://www.youtube.com/watch?v=dQw4w9WgXcQ</a></div></div>
         <div class="gem-typing" style="margin-top:14px;"><span class="pulse"></span>Auto-filled &amp; sent — summary generating…</div>
       </div>
     </div>
   </div>
 </div>`);

const SMALL = doc(`<div class="smtile">
   <span class="smtile-badge"><span class="dot"></span>OPEN SOURCE</span>
   <div class="smtile-top"><img class="smtile-icon" src="${ICON_ON}">
     <div class="smtile-title">YouTube Summary<br>with Gemini</div></div>
   <p class="smtile-tag">One click summarizes the video you’re watching in Gemini.</p>
   <div class="smtile-foot"><span class="pill">● One click · editable prompt</span></div>
 </div>`);

// --- asset specs ------------------------------------------------------------
const assets = [
  { name: 'screenshot-1-hero.png', w: 1280, h: 800, html: HERO },
  { name: 'screenshot-2-welcome.png', w: 1280, h: 800, html: WELCOME },
  { name: 'screenshot-3-options.png', w: 1280, h: 800, html: OPTIONS },
  { name: 'screenshot-4-ready.png', w: 1280, h: 800, html: STATES },
  { name: 'screenshot-5-open-source.png', w: 1280, h: 800, html: OSS },
  { name: 'promo-marquee-1400x560.jpg', w: 1400, h: 560, type: 'jpeg', html: MARQUEE },
  { name: 'promo-small-440x280.jpg', w: 440, h: 280, type: 'jpeg', html: SMALL },
];

// --- render -----------------------------------------------------------------
const browser = await chromium.launch();
for (const a of assets) {
  const page = await browser.newPage({
    viewport: { width: a.w, height: a.h },
    deviceScaleFactor: 1,
    colorScheme: 'light', // keep the real pages' `color-scheme: light dark` rendering consistent
  });
  await page.setContent(a.html, { waitUntil: 'load' });
  await page.waitForTimeout(180); // let webfonts/iframes settle
  const path = join(OUT, a.name);
  if (a.type === 'jpeg') await page.screenshot({ path, type: 'jpeg', quality: 95 });
  else await page.screenshot({ path, type: 'png' });
  await page.close();
  console.log('✓', a.name, `${a.w}×${a.h}`);
}
await browser.close();

// Store icon is the shipped 128px icon, reused verbatim.
copyFileSync(join(ROOT, 'icons', 'icon128.png'), join(OUT, 'store-icon-128.png'));
console.log('✓ store-icon-128.png 128×128 (copied from icons/icon128.png)');
console.log('\nImages written to store-assets/images/');
