import { BASE_URL } from "./club.js";

export const esc = (v="") => String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const attr = (v="") => esc(v).replace(/\n/g," ");
export const metaText = (v="",max=160) => {
  const s=String(v||"").replace(/\s+/g," ").trim();
  return s.length<=max?s:s.slice(0,max-1).replace(/\s+\S*$/,"")+"…";
};

export function headers(extra={}) {
  return {
    "content-type":"text/html; charset=utf-8",
    "x-content-type-options":"nosniff",
    "referrer-policy":"strict-origin-when-cross-origin",
    "permissions-policy":"camera=(), microphone=(), geolocation=()",
    "strict-transport-security":"max-age=31536000; includeSubDomains",
    "x-frame-options":"DENY",
    "cross-origin-opener-policy":"same-origin-allow-popups",
    "cross-origin-resource-policy":"same-origin",
    "content-security-policy":"default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.clarity.ms; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    ...extra
  };
}

function analytics(env={}) {
  const ga = env.GA4_MEASUREMENT_ID ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${attr(env.GA4_MEASUREMENT_ID)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${attr(env.GA4_MEASUREMENT_ID)}',{send_page_view:true});</script>` : "";
  const clarity = env.CLARITY_PROJECT_ID ? `<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${attr(env.CLARITY_PROJECT_ID)}");</script>` : "";
  return ga+clarity;
}

export function css() {
  return `
:root{
  --ink:#1b153c;--muted:#6e6882;--line:#d9d3ef;--blue:#4255ff;--bg:#f7f0e6;--soft:#f0ecff;
  --cream:#f7f0e6;--paper:#fffdf9;--green:#2f8c56;--orange:#ff6b3d;--pink:#e574c6;--lavender:#d8d2ff;
  --display:"Iowan Old Style","Palatino Linotype","Book Antiqua",Palatino,Georgia,serif
}
*{box-sizing:border-box}
html{background:var(--cream);scroll-behavior:smooth}
body{margin:0;font-family:"Avenir Next","Helvetica Neue",Helvetica,Arial,ui-sans-serif,system-ui,sans-serif;color:var(--ink);background:var(--cream);letter-spacing:-.01em;-webkit-font-smoothing:antialiased}
a{color:inherit}.wrap{max-width:1180px;margin:0 auto;padding-left:24px;padding-right:24px}
.site-header{position:sticky;top:0;z-index:30;padding:16px 0;background:rgba(247,240,230,.92);backdrop-filter:blur(12px)}
.header-inner{min-height:58px;display:flex;align-items:center;justify-content:space-between;gap:28px;padding:8px 10px 8px 18px;background:rgba(255,255,255,.72);border:1px solid var(--lavender);border-radius:999px;box-shadow:0 8px 24px rgba(41,32,89,.06);backdrop-filter:blur(10px)}
.brand{display:flex;align-items:center;gap:9px;font-size:20px;font-weight:550;letter-spacing:-.03em;text-decoration:none;white-space:nowrap}.brand img{width:26px;height:26px;object-fit:contain}
.site-nav{display:flex;align-items:center;gap:4px;font-size:14px}.site-nav a{padding:9px 12px;border-radius:999px;color:#514b65;text-decoration:none;white-space:nowrap}.site-nav a:hover,.site-nav a:focus{background:#efeaff;color:var(--ink)}.site-nav a.cta-nav{background:#e8e3ff;color:var(--ink);font-weight:600}
.site-main{min-height:calc(100vh - 190px);padding-top:12px;padding-bottom:84px}
.hero{padding:56px 0 34px}.hero.center{text-align:center}.hero.center h1,.hero.center p,.hero.center .search{margin-left:auto;margin-right:auto}
.hero h1,h1,h2,h3,.display{font-family:var(--display);color:var(--ink)}
.hero h1{font-size:clamp(44px,6vw,56px);line-height:.96;font-weight:400;letter-spacing:-.04em;max-width:930px;margin:0 0 14px}
.hero p{max-width:800px;margin:0;font-size:17px;line-height:1.55;color:#615b74}
h1{font-weight:400;letter-spacing:-.04em}h2{font-size:34px;line-height:1.02;font-weight:400;letter-spacing:-.03em}h3{font-size:23px;line-height:1.1;font-weight:400;letter-spacing:-.025em}p{line-height:1.55}.muted{color:var(--muted)}.kicker{font-size:13px;line-height:1.45;color:var(--muted)}
.eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:12px;font-weight:750;color:var(--blue);margin-bottom:8px}
.section{padding:44px 0}.section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:18px}.section-head h2{margin:0}.section-head>a,.text-link{color:var(--blue);text-decoration:underline;text-underline-offset:3px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(290px,100%),1fr));gap:18px}
.card{position:relative;overflow:hidden;display:block;border:1px solid var(--lavender);border-radius:26px;padding:24px;background:rgba(255,255,255,.82);color:var(--ink);text-decoration:none;box-shadow:0 10px 28px rgba(41,32,89,.055);transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}
.grid>.card:nth-child(4n+1){background:linear-gradient(145deg,#f8fbff 0%,#edf4ff 100%);border-color:#d9e0ff}.grid>.card:nth-child(4n+2){background:linear-gradient(145deg,#f8fdf9 0%,#e9f8ef 100%);border-color:#d0eadb}.grid>.card:nth-child(4n+3){background:linear-gradient(145deg,#fdfbff 0%,#eeeaff 100%);border-color:#ddd6ff}.grid>.card:nth-child(4n+4){background:linear-gradient(145deg,#fffaf6 0%,#ffefe4 100%);border-color:#f1d8c8}
.card:hover,.card:focus-within{transform:translateY(-3px);border-color:#aa98ef;box-shadow:0 16px 36px rgba(41,32,89,.095)}.card h2,.card h3{margin:8px 0 10px}.card p{color:#625c75}.card-link{position:absolute;inset:0;z-index:1}.card-content{position:relative;z-index:2;pointer-events:none}.card-actions{position:relative;z-index:3;display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:18px}.card-actions a,.card-actions button{pointer-events:auto}
.btn,.search button,button.btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:11px 20px;border:1px solid var(--blue);border-radius:999px;background:var(--blue);color:#fff;font:inherit;font-size:14px;font-weight:600;text-decoration:none;cursor:pointer;box-shadow:0 5px 14px rgba(66,85,255,.16);transition:transform .14s ease,box-shadow .14s ease,background .14s ease}
.btn:hover,.search button:hover,button.btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(66,85,255,.23)}.btn.secondary{background:rgba(255,255,255,.78);color:var(--ink);border-color:var(--lavender);box-shadow:none}.btn.small{min-height:36px;padding:7px 13px;font-size:12px}.btn.ghost{background:transparent;color:var(--ink);border-color:transparent;box-shadow:none}
.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}
.search{display:flex;gap:8px;max-width:800px;margin-top:24px;padding:7px;border:1px solid var(--lavender);border-radius:999px;background:rgba(255,255,255,.76);box-shadow:0 8px 24px rgba(41,32,89,.045)}
.search input,.search select,.search textarea,input[type="text"],input[type="email"],input[type="number"],input[type="month"],input[type="tel"],input[type="date"],input[type="search"],select,textarea{width:100%;border:1px solid var(--lavender)!important;border-radius:16px!important;padding:12px 14px!important;background:rgba(255,255,255,.88)!important;color:var(--ink);font:inherit;outline:none}
.search input,.search select{min-height:48px;border:0!important;border-radius:999px!important;background:transparent!important;padding-left:16px!important}input:focus,select:focus,textarea:focus{border-color:#aa98ef!important;box-shadow:0 0 0 3px rgba(66,85,255,.09)}
.proof,.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:14px;margin:24px 0 28px;padding:0;border:0}.proof>div,.stat{background:rgba(255,255,255,.82);border:1px solid var(--lavender);border-radius:24px;padding:22px;box-shadow:0 8px 24px rgba(41,32,89,.04)}.proof strong,.stat strong{display:block;font-family:var(--display);font-size:38px;line-height:1;font-weight:400;letter-spacing:-.03em;margin-bottom:6px}
.value-badge,.pill{display:inline-flex;align-items:center;gap:5px;border:1px solid #ddd6ff;border-radius:999px;padding:6px 10px;background:rgba(255,255,255,.72);color:#514b65;font-size:12px;line-height:1.2;text-decoration:none;margin:3px 4px 3px 0}.value-badge{font-weight:650}.value-badge.good{background:#e9f7ee;color:#267348;border-color:#cfe7d8}.value-badge.high{background:#fff4e9;color:#915328;border-color:#f1d8c8}
.filters,.seo-links{display:flex;gap:7px;flex-wrap:wrap;margin:16px 0}.filter-panel{border:1px solid var(--lavender);border-radius:28px;background:rgba(255,255,255,.76);padding:16px;box-shadow:0 8px 24px rgba(41,32,89,.045)}.filter-row{display:grid;grid-template-columns:minmax(220px,2fr) repeat(2,minmax(130px,1fr)) auto;gap:9px}.quick-filters{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.quick-filters label{display:flex;gap:7px;align-items:center;padding:8px 11px;border:1px solid var(--lavender);border-radius:999px;background:#fff;font-size:12px;color:#514b65}
.notice,.empty{border:1px solid var(--lavender);border-radius:20px;padding:18px 20px;background:rgba(255,255,255,.78);color:var(--muted)}.notice strong,.empty strong{color:var(--ink)}.error{border-color:#efc9c9;background:#fff2f1;color:#8d2424}
.two{display:grid;grid-template-columns:minmax(0,3fr) minmax(280px,1fr);gap:28px;align-items:start}.main-col{min-width:0}.rail{min-width:0}.rail-inner{position:sticky;top:106px;display:grid;gap:16px}
.fact-table{width:100%;overflow:hidden;border-collapse:separate;border-spacing:0;border:1px solid var(--lavender);border-radius:22px;background:rgba(255,255,255,.8);box-shadow:0 8px 24px rgba(41,32,89,.035)}.fact-table th,.fact-table td{padding:15px 18px;border-bottom:1px solid #e7e1f5;text-align:left;vertical-align:top}.fact-table tr:last-child th,.fact-table tr:last-child td{border-bottom:0}.fact-table th{width:34%;color:var(--muted);font-weight:550}
.detail-card{border:1px solid var(--lavender);border-radius:28px;padding:26px;background:rgba(255,255,255,.82);box-shadow:0 10px 28px rgba(41,32,89,.055);margin-bottom:18px}.detail-card h2{margin-top:0}.amenity-list{display:flex;gap:7px;flex-wrap:wrap}.source-note{font-size:13px;color:var(--muted)}
.club-photo{width:100%;height:210px;object-fit:cover;border-radius:20px;border:1px solid var(--lavender);background:#efeaff;margin-bottom:14px}
.match-shell{border:1px solid var(--lavender);border-radius:30px;padding:28px;background:linear-gradient(145deg,#fffdf9 0%,#efebff 100%);box-shadow:0 10px 28px rgba(41,32,89,.055)}.match-shell h2{margin:6px 0 8px}.prompt-box{margin-top:18px}.prompt-box textarea{min-height:110px;resize:vertical}.prompt-actions{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:10px}.examples{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.match-results{margin-top:22px}.match-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.match-card{border:1px solid var(--lavender);border-radius:22px;padding:18px;background:rgba(255,255,255,.82)}.match-card h3{margin:8px 0}.match-score{font-family:var(--display);font-size:32px}.match-why{font-size:14px;color:var(--muted)}
.directory-state-nav{display:flex;gap:7px;flex-wrap:wrap;margin:16px 0 34px}.directory-state-nav a{padding:7px 10px;border:1px solid var(--lavender);border-radius:999px;text-decoration:none;background:#fff;font-size:12px}.state-section{padding:24px 0;border-top:1px solid #e7e1f5}.state-heading{display:flex;justify-content:space-between;align-items:baseline;gap:18px}.state-heading h2{margin:0}.club-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.club-link{display:block;padding:14px 16px;border:1px solid var(--lavender);border-radius:18px;text-decoration:none;background:rgba(255,255,255,.7)}.club-link strong,.club-link span{display:block}.club-link span{margin-top:5px;color:var(--muted);font-size:12px}
.compare-dock{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:40;width:min(980px,calc(100% - 24px));display:none}.compare-dock.show{display:block}.compare-inner{display:flex;align-items:center;gap:12px;padding:10px 12px 10px 18px;border:1px solid var(--lavender);border-radius:999px;background:rgba(255,253,249,.96);box-shadow:0 16px 42px rgba(41,32,89,.16);backdrop-filter:blur(14px)}.compare-summary{white-space:nowrap;font-size:13px}.compare-chips{display:flex;gap:6px;min-width:0;overflow:auto;flex:1}.compare-chip{white-space:nowrap;padding:7px 10px;border-radius:999px;background:var(--soft);font-size:12px}
.modal-backdrop{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(27,21,60,.32);backdrop-filter:blur(4px)}.modal-backdrop.open{display:flex}.modal{position:relative;width:min(960px,100%);max-height:90vh;overflow:auto;border:1px solid var(--lavender);border-radius:28px;background:var(--paper);padding:26px;box-shadow:0 24px 70px rgba(27,21,60,.22)}.modal.narrow{width:min(580px,100%)}.modal-close{position:absolute;right:18px;top:16px;border:0;background:transparent;font-size:25px;cursor:pointer;color:var(--muted)}.compare-table-wrap{overflow:auto;margin-top:18px}.compare-table{border-collapse:separate;border-spacing:0;width:100%;min-width:700px}.compare-table th,.compare-table td{padding:12px;border-bottom:1px solid #e7e1f5;text-align:left;vertical-align:top}.compare-table th:first-child{color:var(--muted);font-weight:550}.form-grid{display:grid;gap:12px}.form-grid label{display:grid;gap:6px;color:#514b65;font-size:13px}.form-status{font-size:13px;color:var(--muted)}
.faq details{margin:10px 0;padding:16px 18px;border:1px solid var(--lavender);border-radius:18px;background:rgba(255,255,255,.76)}.faq summary{font-family:var(--display);font-size:21px;cursor:pointer;color:var(--ink)}.faq p{color:var(--muted)}
.site-footer{margin-top:0;padding:34px 0;background:var(--ink);color:#eae7f4;font-size:14px}.footer-inner{display:flex;justify-content:space-between;gap:30px;align-items:flex-start}.footer-links{display:flex;gap:14px;flex-wrap:wrap}.footer-links a{color:#eae7f4}
.breadcrumbs{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--muted);margin-bottom:16px}.breadcrumbs a{color:var(--blue)}
@media(max-width:900px){.two{grid-template-columns:1fr}.rail-inner{position:static}.match-grid{grid-template-columns:1fr}.filter-row{grid-template-columns:1fr 1fr}.filter-row input{grid-column:1/-1}.club-links{grid-template-columns:1fr}.compare-inner{border-radius:24px;align-items:flex-start;flex-wrap:wrap}.compare-chips{order:3;flex-basis:100%}}
@media(max-width:720px){.wrap{padding-left:16px;padding-right:16px}.site-header{padding:10px 0}.header-inner{padding-left:14px}.site-nav a:not(.cta-nav){display:none}.hero{padding:38px 0 22px}.hero h1{font-size:clamp(40px,12vw,50px)}.section{padding:32px 0}.search{border-radius:24px;flex-direction:column}.search input,.search select{border-radius:14px!important;background:#fff!important;border:1px solid var(--lavender)!important}.filter-row{grid-template-columns:1fr}.prompt-actions{align-items:stretch;flex-direction:column}.prompt-actions .btn{width:100%}.proof{grid-template-columns:1fr 1fr}.footer-inner{flex-direction:column}.match-shell{padding:20px}.modal{padding:22px 16px}.site-main{padding-bottom:110px}}
`;
}

export function page(body, env={}, {
  title="ClubTaps",
  description="Compare private clubs, membership details, dues, access rules, pools and amenities.",
  canonical="/",
  jsonLd=null,
  robots="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  script=""
}={}) {
  const canonicalUrl=canonical.startsWith("http")?canonical:BASE_URL+canonical;
  return new Response(`<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png?v=5"><link rel="shortcut icon" type="image/x-icon" href="/favicon.ico?v=5"><link rel="apple-touch-icon" href="/favicon.png?v=5">
<title>${esc(title)}</title><meta name="description" content="${attr(metaText(description))}"><meta name="robots" content="${attr(robots)}">${env.GOOGLE_SITE_VERIFICATION?`<meta name="google-site-verification" content="${attr(env.GOOGLE_SITE_VERIFICATION)}">`:""}
<link rel="canonical" href="${attr(canonicalUrl)}"><meta property="og:site_name" content="ClubTaps"><meta property="og:title" content="${attr(title)}"><meta property="og:description" content="${attr(metaText(description))}"><meta property="og:url" content="${attr(canonicalUrl)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${attr(title)}"><meta name="twitter:description" content="${attr(metaText(description))}">
${jsonLd?`<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g,"\\u003c")}</script>`:""}${analytics(env)}
<style>${css()}</style></head><body>
<header class="site-header"><div class="wrap"><div class="header-inner">
<a class="brand" href="/"><img src="/favicon.png?v=5" alt="">ClubTaps</a>
<nav class="site-nav" aria-label="Primary"><a href="/clubs">Explore clubs</a><a href="/#city-guides">City guides</a><a href="/about">About</a><a href="/faq">FAQ</a><a class="cta-nav" href="/#find-my-club">Find my club</a></nav>
</div></div></header>
<main class="site-main">${body}</main>
<footer class="site-footer"><div class="wrap footer-inner"><div><strong>ClubTaps</strong><div style="margin-top:7px;color:#bdb7cf">Source-backed private-club membership and access research.</div></div><nav class="footer-links"><a href="/clubs">All clubs</a><a href="/about">About</a><a href="/faq">FAQ</a><a href="/contact">Contact</a><a href="/openapi.json">API</a></nav></div></footer>
<div id="compareDock" class="compare-dock" aria-live="polite"></div>
<div id="compareModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Compare clubs"></div>
<div id="inquiryModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Membership inquiry"></div>
${script?`<script>${script}</script>`:""}</body></html>`,{headers:headers()});
}
