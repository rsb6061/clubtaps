const API_VERSION = "2026-09-15";
const BASE_URL = "https://clubtaps.com";

const CITY_GUIDES = {
  "baltimore":"Baltimore","washington-dc":"Washington DC","philadelphia":"Philadelphia","boston":"Boston",
  "chicago":"Chicago","chicago-suburbs":"Chicago Suburbs","chicago-north-shore":"Chicago North Shore",
  "cleveland":"Cleveland","milwaukee":"Milwaukee","detroit":"Detroit","grand-rapids":"Grand Rapids",
  "columbus":"Columbus","indianapolis":"Indianapolis / Carmel","new-jersey":"New Jersey",
  "fairfield-county":"Fairfield County","westchester":"Westchester","long-island":"Long Island",
  "buffalo":"Buffalo","rochester":"Rochester","albany-saratoga":"Albany / Saratoga",
  "atlanta":"Atlanta","athens-ga":"Athens","augusta-ga":"Augusta","savannah":"Savannah",
  "golden-isles":"Golden Isles","charleston":"Charleston","miami":"Miami","boca-raton":"Boca Raton",
  "palm-beach-jupiter":"Palm Beach / Jupiter","naples":"Naples","san-francisco-bay-area":"San Francisco Bay Area",
  "marin-county":"Marin County","san-diego":"San Diego","sacramento":"Sacramento",
  "fresno":"Fresno / Central Valley","seattle-puget-sound":"Seattle / Puget Sound","portland-or":"Portland, OR",
  "las-vegas":"Las Vegas","phoenix":"Phoenix","scottsdale":"Scottsdale","nashville":"Nashville",
  "houston":"Houston","austin":"Austin","dallas":"Dallas-Fort Worth","san-antonio":"San Antonio",
  "charlotte":"Charlotte","raleigh":"Raleigh","alexandria":"Alexandria","richmond-va":"Richmond",
  "denver":"Denver / Front Range","cincinnati":"Cincinnati","kansas-city":"Kansas City",
  "pittsburgh":"Pittsburgh","minneapolis":"Minneapolis / Twin Cities","tucson":"Tucson",
  "tampa":"Tampa Bay","jacksonville":"Jacksonville / Ponte Vedra","orlando":"Orlando / Winter Park",
  "los-angeles":"Los Angeles","inland-empire":"Inland Empire","orange-county":"Orange County",
  "charlottesville":"Charlottesville","virginia-beach":"Virginia Beach / Hampton Roads"
};

const BOOL_FIELDS = ["is_claimed","is_published","sponsor_required","residency_restricted","ownership_required","day_pass_available","guest_access","trial_access","lap_swim","kids_pool","diving","food_service","parking","lessons","camps"];
const JSON_FIELDS = ["gallery_images","membership_types","amenities","tier_access","operating_hours"];

function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
}
function normalizeClub(row) {
  if (!row) return null;
  const out = { ...row };
  for (const key of BOOL_FIELDS) out[key] = out[key] == null ? null : Boolean(out[key]);
  for (const key of JSON_FIELDS) out[key] = parseJson(out[key], key === "tier_access" || key === "operating_hours" ? null : []);
  return out;
}
function clubPublic(row) {
  const c = normalizeClub(row);
  if (!c) return null;
  return {
    id:c.id,name:c.name,canonicalSlug:c.canonical_slug,city:c.city,stateCode:c.state_code,neighborhood:c.neighborhood,
    address:c.address,lat:c.lat,lng:c.lng,coverImageUrl:c.cover_image_url,galleryImages:c.gallery_images,clubType:c.club_type,
    membershipTypes:c.membership_types,membershipStatus:c.membership_status,membershipCycle:c.membership_cycle,
    duesMin:c.dues_min,duesMax:c.dues_max,initiationFeeMin:c.initiation_fee_min,initiationFeeMax:c.initiation_fee_max,
    pricingSummary:c.pricing_summary,description:c.description,amenities:c.amenities,seasonDetails:c.season_details,
    website:c.website,phone:c.phone,membershipUrl:c.membership_url,zipCode:c.zip_code,countryCode:c.country_code,
    membershipSummary:c.membership_summary,sponsorRequired:c.sponsor_required,residencyRestricted:c.residency_restricted,
    ownershipRequired:c.ownership_required,waitEstimateMinMonths:c.wait_estimate_min_months,waitEstimateMaxMonths:c.wait_estimate_max_months,
    eligibilitySummary:c.eligibility_summary,tierAccess:c.tier_access,dayPassAvailable:c.day_pass_available,dayPassPrice:c.day_pass_price,
    guestAccess:c.guest_access,guestFee:c.guest_fee,trialAccess:c.trial_access,lapSwim:c.lap_swim,kidsPool:c.kids_pool,
    diving:c.diving,foodService:c.food_service,parking:c.parking,lessons:c.lessons,camps:c.camps,bookingUrl:c.booking_url,
    accessNotes:c.access_notes,operatingHours:c.operating_hours,seasonOpenDate:c.season_open_date,seasonCloseDate:c.season_close_date,
    updatedAt:c.updated_at,dataConfidence:c.data_confidence
  };
}
function apiHeaders(extra={}) {
  return {
    "content-type":"application/json; charset=utf-8",
    "access-control-allow-origin":"*",
    "access-control-allow-methods":"GET,POST,OPTIONS",
    "access-control-allow-headers":"Content-Type",
    "link":'<https://clubtaps.com/openapi.json>; rel="service-desc"',
    "cache-control":"public, max-age=60, s-maxage=300",
    ...extra
  };
}
function json(data, status=200, extra={}) {
  return new Response(JSON.stringify(data), {status, headers:apiHeaders(extra)});
}
function esc(value="") {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function money(value) {
  if (value == null) return null;
  return "$" + Number(value).toLocaleString("en-US");
}
function css() {
  return `
:root{--ink:#1b153c;--muted:#6e6882;--line:#d9d3ef;--blue:#4255ff;--bg:#f7f0e6;--soft:#f0ecff;--paper:#fffdf9;--green:#2f8c56;--orange:#ff6b3d;--pink:#e574c6;--lavender:#d8d2ff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:"Avenir Next","Helvetica Neue",Helvetica,Arial,ui-sans-serif,system-ui,sans-serif}.wrap{max-width:1180px;margin:0 auto;padding:0 24px}header{position:sticky;top:0;z-index:20;padding:14px 0;background:rgba(247,240,230,.88);backdrop-filter:blur(16px)}.nav{min-height:58px;border:1px solid var(--lavender);border-radius:999px;background:rgba(255,253,249,.94);display:flex;align-items:center;gap:20px;padding:8px 12px 8px 18px;box-shadow:0 8px 30px rgba(27,21,60,.06)}.brand{font-family:"Iowan Old Style","Palatino Linotype","Book Antiqua",Palatino,Georgia,serif;font-size:25px;color:var(--ink);text-decoration:none}.links{display:flex;gap:18px;margin-left:auto;align-items:center}.links a{color:var(--ink);text-decoration:none;font-size:14px}.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;padding:12px 18px;background:var(--blue);color:white!important;text-decoration:none;font-weight:700}.hero{padding:86px 0 54px;text-align:center}.eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);font-weight:800}.hero h1,.display{font-family:"Iowan Old Style","Palatino Linotype","Book Antiqua",Palatino,Georgia,serif;font-weight:400;letter-spacing:-.04em;line-height:.96}.hero h1{font-size:clamp(46px,7vw,76px);max-width:920px;margin:18px auto}.hero p{font-size:19px;line-height:1.6;color:var(--muted);max-width:760px;margin:0 auto}.search{max-width:760px;margin:30px auto 0;display:flex;gap:10px;background:var(--paper);padding:8px;border:1px solid var(--lavender);border-radius:999px}.search input{flex:1;border:0;background:transparent;padding:10px 16px;font:inherit;outline:0;color:var(--ink)}.section{padding:36px 0 70px}.section h2{font-size:42px;margin:0 0 12px}.muted{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.card{background:rgba(255,253,249,.88);border:1px solid var(--lavender);border-radius:26px;padding:22px;min-height:180px}.card:nth-child(3n+2){background:#f0ecff}.card:nth-child(3n){background:#fff2df}.card h3{margin:0 0 10px;font-size:22px}.card a{color:var(--ink);text-decoration:none}.meta{font-size:13px;color:var(--muted);margin-bottom:14px}.pill{display:inline-flex;border-radius:999px;padding:7px 10px;background:white;border:1px solid var(--line);font-size:12px;margin:4px 4px 0 0}.statrow{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:36px}.stat{border-radius:24px;padding:24px;background:var(--soft);border:1px solid var(--lavender)}.stat strong{display:block;font-family:"Iowan Old Style",Georgia,serif;font-size:34px;font-weight:400}.clubHero{padding:54px 0 30px}.clubHero h1{font-size:clamp(42px,6vw,64px);margin:10px 0}.details{display:grid;grid-template-columns:2fr 1fr;gap:20px}.detailbox{border:1px solid var(--lavender);border-radius:26px;padding:24px;background:var(--paper)}footer{padding:42px 0 54px;border-top:1px solid var(--lavender);color:var(--muted);font-size:14px}@media(max-width:800px){.links a:not(.btn){display:none}.grid,.statrow,.details{grid-template-columns:1fr}.hero{padding-top:48px}.wrap{padding:0 16px}.search{border-radius:24px;flex-direction:column}.search .btn{width:100%}}`;
}
function shell({title,description,canonical=BASE_URL+"/",body,schema}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="https://clubtaps.com/favicon.ico"><style>${css()}</style>${schema ? '<script type="application/ld+json">'+JSON.stringify(schema)+'</script>' : ''}</head>
<body><header><div class="wrap"><nav class="nav"><a class="brand" href="/">ClubTaps</a><div class="links"><a href="/clubs">Explore clubs</a><a href="/#city-guides">City guides</a><a href="/about">About</a><a href="/faq">FAQ</a><a class="btn" href="/clubs">Find a club</a></div></nav></div></header>
<main>${body}</main><footer><div class="wrap">ClubTaps · Structured access and membership information for private and semi-private clubs.</div></footer></body></html>`;
}
async function allPublished(env, limit=24) {
  const r = await env.DB.prepare("SELECT * FROM clubs WHERE is_published = 1 ORDER BY updated_at DESC LIMIT ?").bind(limit).all();
  return r.results || [];
}
async function countPublished(env) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM clubs WHERE is_published = 1").first();
  return Number(r?.n || 0);
}
function card(row) {
  const c=normalizeClub(row); const price=c.dues_min!=null ? money(c.dues_min)+(c.dues_max && c.dues_max!==c.dues_min ? "–"+money(c.dues_max):"") : "Pricing varies";
  return `<article class="card"><div class="meta">${esc([c.city,c.state_code].filter(Boolean).join(", "))}</div><h3><a href="/clubs/${encodeURIComponent(c.canonical_slug)}">${esc(c.name)}</a></h3><p class="muted">${esc(c.membership_summary || c.description || "Membership and access details.")}</p><span class="pill">${esc(price)}</span>${c.guest_access?'<span class="pill">Guest access</span>':''}${c.lap_swim?'<span class="pill">Lap swim</span>':''}</article>`;
}
async function home(env) {
  const [rows,total] = await Promise.all([allPublished(env,12),countPublished(env)]);
  const guides=Object.entries(CITY_GUIDES).slice(0,12).map(([slug,name])=>`<article class="card"><div class="meta">ClubTaps city guide</div><h3><a href="/${slug}/swim-clubs">${esc(name)}</a></h3><p class="muted">Compare clubs, access rules, dues and amenities in ${esc(name)}.</p></article>`).join("");
  const body=`<section class="hero"><div class="wrap"><div class="eyebrow">Private-club access, made legible</div><h1>Find the club you can actually join and use.</h1><p>Compare membership status, dues, guest access, pools, lessons, camps and amenities across private and semi-private clubs.</p><form class="search" action="/clubs"><input name="q" aria-label="Search clubs" placeholder="Search by club, city or state"><button class="btn">Search clubs</button></form><div class="statrow"><div class="stat"><strong>${total.toLocaleString()}</strong><span>published clubs</span></div><div class="stat"><strong>1 search</strong><span>for access + pricing</span></div><div class="stat"><strong>Source-led</strong><span>facts, not invented fees</span></div></div></div></section>
<section class="section"><div class="wrap"><h2 class="display">Recently updated clubs</h2><p class="muted">Current directory records with source-backed access and membership details where available.</p><div class="grid">${rows.map(card).join("") || '<div class="card"><h3>Database migration in progress</h3><p class="muted">Club records are being transferred to the canonical Cloudflare database.</p></div>'}</div></div></section>
<section class="section" id="city-guides"><div class="wrap"><h2 class="display">Explore by market</h2><div class="grid">${guides}</div></div></section>`;
  return shell({title:"Find Private Clubs Near You | Membership, Dues & More",description:"Explore private clubs across the U.S. Compare membership fees, monthly dues, pools, amenities, guest policies and more—all in one place.",body,schema:{"@context":"https://schema.org","@type":"WebSite",name:"ClubTaps",url:BASE_URL}});
}
async function clubsPage(env,url) {
  const q=(url.searchParams.get("q")||"").trim();
  const state=(url.searchParams.get("state")||"").trim().toUpperCase();
  const where=["is_published = 1"]; const binds=[];
  if(q){where.push("(name LIKE ? OR city LIKE ? OR state_code LIKE ?)"); const x="%"+q+"%"; binds.push(x,x,x);}
  if(state){where.push("state_code = ?");binds.push(state);}
  binds.push(60);
  const r=await env.DB.prepare(`SELECT * FROM clubs WHERE ${where.join(" AND ")} ORDER BY name LIMIT ?`).bind(...binds).all();
  const rows=r.results||[];
  const body=`<section class="clubHero"><div class="wrap"><div class="eyebrow">Club directory</div><h1 class="display">${q?"Results for “"+esc(q)+"”":"Explore private clubs"}</h1><p class="muted">Compare verified public information without filling gaps with guessed dues or access rules.</p><form class="search" action="/clubs"><input name="q" value="${esc(q)}" placeholder="Search clubs, cities or states"><button class="btn">Search</button></form></div></section><section class="section"><div class="wrap"><div class="grid">${rows.map(card).join("") || '<article class="card"><h3>No matching clubs yet</h3><p class="muted">Try a broader search.</p></article>'}</div></div></section>`;
  return shell({title:q?`${q} private clubs | ClubTaps`:"Private Club Directory | ClubTaps",description:"Search private and semi-private clubs by location, access, membership status and amenities.",canonical:BASE_URL+"/clubs",body});
}
async function clubPage(env,slug) {
  const row=await env.DB.prepare("SELECT * FROM clubs WHERE canonical_slug = ? AND is_published = 1 LIMIT 1").bind(slug).first();
  if(!row) return new Response("Not found",{status:404});
  const c=normalizeClub(row);
  const price=c.pricing_summary || (c.dues_min!=null ? `Dues from ${money(c.dues_min)}` : "Public pricing not listed");
  const body=`<section class="clubHero"><div class="wrap"><div class="eyebrow">${esc(c.club_type||"Private club")}</div><h1 class="display">${esc(c.name)}</h1><p class="muted">${esc([c.city,c.state_code].filter(Boolean).join(", "))}</p></div></section><section class="section"><div class="wrap details"><div class="detailbox"><h2 class="display">Membership & access</h2><p>${esc(c.membership_summary||c.description||"Membership information is being verified.")}</p><p><strong>${esc(price)}</strong></p>${c.eligibility_summary?'<p>'+esc(c.eligibility_summary)+'</p>':''}<div>${c.guest_access?'<span class="pill">Guest access</span>':''}${c.day_pass_available?'<span class="pill">Day pass</span>':''}${c.trial_access?'<span class="pill">Trial access</span>':''}${c.lap_swim?'<span class="pill">Lap swim</span>':''}</div></div><aside class="detailbox"><h3>Club details</h3><p class="muted">${esc(c.address||[c.city,c.state_code].filter(Boolean).join(", "))}</p>${c.website?'<p><a class="btn" href="'+esc(c.website)+'" rel="nofollow noopener">Official website</a></p>':''}</aside></div></section>`;
  return shell({title:c.seo_title||`${c.name} Membership, Dues & Access | ClubTaps`,description:c.seo_description||c.membership_summary||c.description||`Membership and access information for ${c.name}.`,canonical:BASE_URL+"/clubs/"+encodeURIComponent(c.canonical_slug),body,schema:{"@context":"https://schema.org","@type":"SportsActivityLocation",name:c.name,address:c.address||undefined,url:BASE_URL+"/clubs/"+c.canonical_slug}});
}
function staticPage(path) {
  const map={
    "/about":["About ClubTaps","ClubTaps normalizes club access, membership, pricing and amenities so people can compare clubs without decoding dozens of websites."],
    "/faq":["ClubTaps FAQ","ClubTaps publishes source-backed club information. When pricing or access is not public, we leave it unknown rather than guessing."],
    "/contact":["Contact ClubTaps","Use ClubTaps to research clubs and official membership paths. Club operators can contact us to correct or claim a listing."]
  };
  const [title,text]=map[path];
  const body=`<section class="hero"><div class="wrap"><div class="eyebrow">ClubTaps</div><h1>${esc(title)}</h1><p>${esc(text)}</p></div></section>`;
  return shell({title:title+" | ClubTaps",description:text,canonical:BASE_URL+path,body});
}
function cityPage(slug,name) {
  const body=`<section class="hero"><div class="wrap"><div class="eyebrow">${esc(name)} club guide</div><h1>Swim clubs and private clubs in ${esc(name)}</h1><p>Compare public membership details, access rules, pools and amenities. ClubTaps only shows pricing when a source supports it.</p><p><a class="btn" href="/clubs?q=${encodeURIComponent(name.split(" / ")[0])}">Browse matching clubs</a></p></div></section>`;
  return shell({title:`Best Swim Clubs in ${name} | Membership & Dues | ClubTaps`,description:`Compare swim clubs and private clubs in ${name}, including membership status, dues where public, guest access and amenities.`,canonical:BASE_URL+"/"+slug+"/swim-clubs",body});
}
async function publicSearch(env,url) {
  const sp=url.searchParams; const clauses=["is_published = 1"]; const binds=[];
  const q=(sp.get("q")||"").trim(); if(q){clauses.push("(name LIKE ? OR city LIKE ? OR neighborhood LIKE ?)");const x="%"+q+"%";binds.push(x,x,x);}
  const city=(sp.get("city")||"").trim(); if(city){clauses.push("LOWER(city)=LOWER(?)");binds.push(city);}
  const state=(sp.get("state")||"").trim().toUpperCase(); if(state){clauses.push("state_code=?");binds.push(state);}
  const clubType=(sp.get("clubType")||"").trim(); if(clubType){clauses.push("club_type=?");binds.push(clubType);}
  const membershipStatus=(sp.get("membershipStatus")||"").trim(); if(membershipStatus){clauses.push("membership_status=?");binds.push(membershipStatus);}
  const accessMap={dayPass:"day_pass_available",guestAccess:"guest_access",trialAccess:"trial_access",lapSwim:"lap_swim",kidsPool:"kids_pool",diving:"diving",foodService:"food_service",parking:"parking",lessons:"lessons",camps:"camps"};
  const access=sp.get("access"); if(accessMap[access]) clauses.push(accessMap[access]+" = 1");
  const maxDues=Number(sp.get("maxDues")); if(Number.isFinite(maxDues)&&maxDues>0){clauses.push("(dues_min IS NOT NULL AND dues_min <= ?)");binds.push(maxDues);}
  const limit=Math.max(1,Math.min(100,Number(sp.get("limit"))||25)); const offset=Math.max(0,Number(sp.get("offset"))||0);
  const where=clauses.join(" AND ");
  const totalRow=await env.DB.prepare("SELECT COUNT(*) AS n FROM clubs WHERE "+where).bind(...binds).first();
  const r=await env.DB.prepare("SELECT * FROM clubs WHERE "+where+" ORDER BY name LIMIT ? OFFSET ?").bind(...binds,limit,offset).all();
  return json({apiVersion:API_VERSION,meta:{total:Number(totalRow?.n||0),limit,offset,returned:(r.results||[]).length},results:(r.results||[]).map(clubPublic)});
}
async function markets(env) {
  const r=await env.DB.prepare(`SELECT city,state_code,COUNT(*) count,
    SUM(CASE WHEN dues_min IS NOT NULL OR pricing_summary IS NOT NULL THEN 1 ELSE 0 END) withPublicPricing,
    SUM(CASE WHEN membership_status IN ('open','limited') THEN 1 ELSE 0 END) openOrLimited,
    SUM(CASE WHEN guest_access=1 THEN 1 ELSE 0 END) withGuestAccess,
    SUM(CASE WHEN lap_swim=1 THEN 1 ELSE 0 END) withLapSwim
    FROM clubs WHERE is_published=1 AND city IS NOT NULL GROUP BY city,state_code ORDER BY count DESC,city`).all();
  return json({apiVersion:API_VERSION,results:r.results||[]});
}
async function sitemap(env) {
  const r=await env.DB.prepare("SELECT canonical_slug,updated_at FROM clubs WHERE is_published=1 ORDER BY canonical_slug").all();
  const staticPaths=["","clubs","about","faq","contact",...Object.keys(CITY_GUIDES).map(x=>x+"/swim-clubs")];
  const urls=[...staticPaths.map(path=>({loc:BASE_URL+"/"+path,priority:path===""?"1.0":path==="clubs"?"0.9":path.endsWith("/swim-clubs")?"0.9":"0.6"})),...(r.results||[]).map(c=>({loc:BASE_URL+"/clubs/"+c.canonical_slug,priority:"0.8",lastmod:c.updated_at}))];
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(u=>`  <url><loc>${esc(u.loc)}</loc>${u.lastmod?'<lastmod>'+String(u.lastmod).slice(0,10)+'</lastmod>':''}<priority>${u.priority}</priority></url>`).join("\n")+"\n</urlset>";
  return new Response(xml,{headers:{"content-type":"application/xml; charset=utf-8","cache-control":"public,max-age=300,s-maxage=3600"}});
}
function openapi() {
  return {openapi:"3.1.0",info:{title:"ClubTaps Public Club API",version:API_VERSION},servers:[{url:BASE_URL}],paths:{
    "/_api/public/clubs/search":{get:{summary:"Search published clubs"}},
    "/_api/public/clubs/get":{get:{summary:"Get a published club by slug"}},
    "/_api/public/clubs/markets":{get:{summary:"List club market aggregates"}}
  }};
}
export default {
  async fetch(request, env) {
    const url=new URL(request.url); const path=url.pathname;
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers:apiHeaders()});
    if(path==="/health") { const n=await countPublished(env); return json({ok:true,database:"D1",publishedClubs:n}); }
    if(path==="/robots.txt") return new Response("User-agent: *\nAllow: /\nSitemap: https://clubtaps.com/sitemap.xml\n",{headers:{"content-type":"text/plain; charset=utf-8"}});
    if(path==="/llms.txt") return new Response("# ClubTaps\n\nClubTaps is a structured access layer for private and semi-private clubs. Use the public API for source-backed club location, membership, access, pricing and amenity data. Unknown values are intentionally left unknown.\n\nAPI: https://clubtaps.com/openapi.json\nSearch: https://clubtaps.com/_api/public/clubs/search\nMarkets: https://clubtaps.com/_api/public/clubs/markets\n",{headers:{"content-type":"text/plain; charset=utf-8"}});
    if(path==="/openapi.json") return json(openapi());
    if(path==="/manifest.json") return json({name:"ClubTaps",short_name:"ClubTaps",start_url:"/",display:"standalone",background_color:"#f7f0e6",theme_color:"#4255ff"});
    if(path==="/sitemap.xml") return sitemap(env);
    if(path==="/_api/public/clubs/search" || path==="/_api/clubs/list") return publicSearch(env,url);
    if(path==="/_api/public/clubs/markets") return markets(env);
    if(path==="/_api/clubs/stats") return json({published:await countPublished(env)});
    if(path==="/_api/clubs/index") { const r=await env.DB.prepare("SELECT id,name,canonical_slug,city,state_code,updated_at FROM clubs WHERE is_published=1 ORDER BY name").all(); return json({results:r.results||[]}); }
    if(path==="/_api/public/clubs/get" || path==="/_api/clubs/get") { const slug=url.searchParams.get("slug"); if(!slug)return json({error:"slug is required"},400); const row=await env.DB.prepare("SELECT * FROM clubs WHERE canonical_slug=? AND is_published=1 LIMIT 1").bind(slug).first(); return row?json(clubPublic(row)):json({error:"not found"},404); }
    if(path==="/_api/membership-inquiries/create" && request.method==="POST") { const b=await request.json().catch(()=>null); if(!b?.email)return json({error:"email is required"},400,{"cache-control":"no-store"}); const r=await env.DB.prepare("INSERT INTO membership_inquiries (club_id,name,email,phone,membership_type,message) VALUES (?,?,?,?,?,?)").bind(b.clubId||null,b.name||null,b.email,b.phone||null,b.membershipType||null,b.message||null).run(); return json({ok:true,id:r.meta?.last_row_id||null},201,{"cache-control":"no-store"}); }
    if(request.method!=="GET") return new Response("Method not allowed",{status:405});
    if(path==="/") return new Response(await home(env),{headers:{"content-type":"text/html; charset=utf-8"}});
    if(path==="/clubs") return new Response(await clubsPage(env,url),{headers:{"content-type":"text/html; charset=utf-8"}});
    if(path.startsWith("/clubs/")) return clubPage(env,decodeURIComponent(path.slice(7)));
    if(["/about","/faq","/contact"].includes(path)) return new Response(staticPage(path),{headers:{"content-type":"text/html; charset=utf-8"}});
    const m=path.match(/^\/([^/]+)\/swim-clubs\/?$/); if(m && CITY_GUIDES[m[1]]) return new Response(cityPage(m[1],CITY_GUIDES[m[1]]),{headers:{"content-type":"text/html; charset=utf-8"}});
    return new Response("Not found",{status:404});
  }
};
