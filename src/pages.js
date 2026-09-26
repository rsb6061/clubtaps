import { page, esc } from "./design.js";
import { CITY_GUIDES, CITY_GUIDE_BY_SLUG, guideForClub, groupedCityGuides } from "./catalog.js";
import { normalizeClub, listItem, moneyRange, formatWait, pretty, BASE_URL } from "./club.js";
import { clubCard, findMyClubPanel, clientScript, statusLabel } from "./components.js";

const STATE_NAMES={
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia"
};

async function directoryStats(env){
  const r=await env.DB.prepare("SELECT COUNT(*) total,SUM(CASE WHEN membership_status IN ('open','limited') THEN 1 ELSE 0 END) openOrLimited,SUM(CASE WHEN dues_min IS NOT NULL OR dues_max IS NOT NULL THEN 1 ELSE 0 END) priced FROM clubs WHERE is_published=1").first();
  return {total:Number(r?.total||0),openOrLimited:Number(r?.openOrLimited||0),priced:Number(r?.priced||0)};
}
async function allListItems(env){
  const r=await env.DB.prepare("SELECT * FROM clubs WHERE is_published=1 ORDER BY name").all();
  return (r.results||[]).map(listItem);
}
async function homepageRows(env,url){
  const sp=url.searchParams,clauses=["is_published=1"],binds=[];
  const q=String(sp.get("q")||"").trim().slice(0,180);
  const type=String(sp.get("clubType")||"").slice(0,40);
  const status=String(sp.get("membershipStatus")||"").slice(0,40);
  if(q){const like="%"+q.toLowerCase()+"%";clauses.push("(LOWER(name) LIKE ? OR LOWER(COALESCE(city,'')) LIKE ? OR LOWER(COALESCE(state_code,'')) LIKE ? OR LOWER(COALESCE(amenities,'')) LIKE ?)");binds.push(like,like,like,like)}
  if(type){clauses.push("club_type=?");binds.push(type)}
  if(status){clauses.push("membership_status=?");binds.push(status)}
  if(sp.get("pool")==="1")clauses.push("(lap_swim=1 OR kids_pool=1 OR LOWER(COALESCE(amenities,'')) LIKE '%pool%' OR LOWER(COALESCE(amenities,'')) LIKE '%swim%')");
  if(sp.get("racquets")==="1")clauses.push("(LOWER(COALESCE(amenities,'')) LIKE '%tennis%' OR LOWER(COALESCE(amenities,'')) LIKE '%racquet%' OR LOWER(COALESCE(amenities,'')) LIKE '%pickleball%')");
  if(sp.get("golf")==="1")clauses.push("(club_type IN ('golf','country') OR LOWER(COALESCE(amenities,'')) LIKE '%golf%')");
  if(sp.get("publishedDues")==="1")clauses.push("(dues_min IS NOT NULL OR dues_max IS NOT NULL)");
  if(sp.get("wait")==="1")clauses.push("(wait_estimate_min_months IS NOT NULL OR wait_estimate_max_months IS NOT NULL)");
  if(sp.get("sponsor")==="1")clauses.push("sponsor_required=1");
  if(sp.get("residency")==="1")clauses.push("residency_restricted=1");
  const sql="SELECT * FROM clubs WHERE "+clauses.join(" AND ")+" ORDER BY CASE membership_status WHEN 'open' THEN 0 WHEN 'limited' THEN 1 WHEN 'inquiry_only' THEN 2 WHEN 'waitlist' THEN 3 ELSE 4 END,(dues_min IS NULL AND dues_max IS NULL),name LIMIT 48";
  const r=await env.DB.prepare(sql).bind(...binds).all();
  return (r.results||[]).map(listItem);
}
function checked(url,name){return url.searchParams.get(name)==="1"?" checked":""}
function selected(url,name,value){return url.searchParams.get(name)===value?" selected":""}

export async function homePage(env,url){
  const [stats,clubs]=await Promise.all([directoryStats(env),homepageRows(env,url)]);
  const filtering=[...url.searchParams.keys()].length>0;
  const typeOptions=[["","All club types"],["swim_pool","Swim & Pool"],["country","Country"],["golf","Golf"],["racquet","Racquet"],["yacht","Yacht"],["beach","Beach"],["social","Social"],["athletic","Athletic"],["dining","Dining"]];
  const statusOptions=[["","Any membership"],["open","Open"],["limited","Limited"],["waitlist","Waitlist"],["inquiry_only","Contact club"]];
  let body='<section class="hero center"><div class="wrap"><div class="eyebrow">Private-club access, made legible</div><h1>Find the club you can actually join and use.</h1><p>Compare membership status, dues, wait times, pools, amenities, guest policies and joining requirements across sourced private-club records.</p>'+
    '<form class="search" action="/" method="get"><input name="q" type="search" value="'+esc(url.searchParams.get("q")||"")+'" placeholder="Search by club, city, ZIP or state" aria-label="Search clubs"><button type="submit">Search clubs</button></form>'+
    '<div class="proof"><div><strong>'+stats.total.toLocaleString("en-US")+'</strong><span>published clubs</span></div><div><strong>'+stats.openOrLimited.toLocaleString("en-US")+'</strong><span>open or limited</span></div><div><strong>'+stats.priced.toLocaleString("en-US")+'</strong><span>with public dues</span></div><div><strong>Source-led</strong><span>unknown means unknown</span></div></div></div></section>';

  body+=findMyClubPanel(stats.total);

  body+='<section class="section" id="clubs"><div class="wrap"><div class="section-head"><div><div class="eyebrow">Explore clubs</div><h2>'+(filtering?"Matching clubs":"Browse the directory")+'</h2></div><a href="/clubs">All clubs by state →</a></div>'+
    '<form class="filter-panel" action="/" method="get"><div class="filter-row"><input type="search" name="q" value="'+esc(url.searchParams.get("q")||"")+'" placeholder="City, ZIP, or club name"><select name="clubType" aria-label="Club type">'+typeOptions.map(function(x){return '<option value="'+x[0]+'"'+selected(url,"clubType",x[0])+'>'+x[1]+'</option>'}).join("")+'</select><select name="membershipStatus" aria-label="Membership status">'+statusOptions.map(function(x){return '<option value="'+x[0]+'"'+selected(url,"membershipStatus",x[0])+'>'+x[1]+'</option>'}).join("")+'</select><button class="btn" type="submit">Search</button></div>'+
    '<div class="quick-filters"><label><input type="checkbox" name="pool" value="1"'+checked(url,"pool")+'> Pool</label><label><input type="checkbox" name="racquets" value="1"'+checked(url,"racquets")+'> Tennis / racquets</label><label><input type="checkbox" name="golf" value="1"'+checked(url,"golf")+'> Golf</label><label><input type="checkbox" name="publishedDues" value="1"'+checked(url,"publishedDues")+'> Dues published</label><label><input type="checkbox" name="wait" value="1"'+checked(url,"wait")+'> Wait estimate</label><label><input type="checkbox" name="sponsor" value="1"'+checked(url,"sponsor")+'> Sponsor required</label><label><input type="checkbox" name="residency" value="1"'+checked(url,"residency")+'> Residency restricted</label></div></form>'+
    (filtering?'<p class="kicker">'+clubs.length+' result'+(clubs.length===1?"":"s")+' shown · <a class="text-link" href="/">Clear filters</a></p>':"")+
    '<div class="grid">'+(clubs.length?clubs.map(function(c){return clubCard(c)}).join(""):'<div class="empty"><strong>No matching clubs.</strong><br>Try a broader location or remove a filter.</div>')+'</div></div></section>';

  body+='<section class="section" id="city-guides"><div class="wrap"><div class="section-head"><div><div class="eyebrow">City guides</div><h2>Explore clubs by market</h2></div></div>';
  for(const group of groupedCityGuides()){
    body+='<div style="margin:28px 0 12px"><strong>'+esc(group[0])+'</strong></div><div class="seo-links">'+group[1].map(function(g){return '<a class="pill" href="/'+g.slug+'/swim-clubs">'+esc(g.label)+'</a>'}).join("")+'</div>';
  }
  body+='</div></section>';

  body+='<section class="section"><div class="wrap"><div class="section-head"><div><div class="eyebrow">Browse by type</div><h2>Different clubs, different access</h2></div></div><div class="grid">'+
    [["swim_pool","Swim & pool clubs","Seasonal pools, lap swim, family memberships and lessons."],["country","Country clubs","Golf, racquets, dining, pools and layered membership categories."],["racquet","Racquet clubs","Tennis, pickleball and athletic memberships."],["yacht","Yacht & waterfront clubs","Waterfront access, social memberships and boating communities."]].map(function(x){return '<a class="card" href="/?clubType='+x[0]+'#clubs"><div class="eyebrow">'+esc(x[1])+'</div><h3>'+esc(x[1])+'</h3><p>'+esc(x[2])+'</p></a>'}).join("")+
    '</div></div></section>';

  return page(body,env,{title:"Find Private Clubs Near You | Membership, Dues & More",description:"Explore private clubs across the U.S. Compare membership fees, monthly dues, pools, amenities, guest policies, waits and joining requirements in one place.",canonical:"/",jsonLd:{"@context":"https://schema.org","@type":"WebSite",name:"ClubTaps",url:BASE_URL,potentialAction:{"@type":"SearchAction",target:BASE_URL+"/?q={search_term_string}","query-input":"required name=search_term_string"}},script:clientScript()});
}

export async function directoryPage(env){
  const rows=await env.DB.prepare("SELECT id,name,canonical_slug,city,state_code,club_type,membership_status FROM clubs WHERE is_published=1 ORDER BY state_code,name").all();
  const clubs=(rows.results||[]).map(function(r){return {id:String(r.id),name:r.name,canonicalSlug:r.canonical_slug,city:r.city,stateCode:r.state_code,clubType:r.club_type,membershipStatus:r.membership_status}});
  const groups=new Map();
  clubs.forEach(function(c){const s=c.stateCode||"Other";if(!groups.has(s))groups.set(s,[]);groups.get(s).push(c)});
  const ordered=[...groups.entries()].sort(function(a,b){return a[0].localeCompare(b[0])});
  let body='<section class="hero"><div class="wrap"><nav class="breadcrumbs"><a href="/">ClubTaps</a><span>/</span><span>All private clubs</span></nav><div class="eyebrow">Full directory</div><h1>All private clubs by state</h1><p>Browse every published ClubTaps profile. Club pages include membership status, joining details, amenities and public pricing when a current source is available.</p><div class="proof"><div><strong>'+clubs.length.toLocaleString("en-US")+'</strong><span>published clubs</span></div><div><strong>'+ordered.length+'</strong><span>states and districts</span></div></div></div></section><section class="section"><div class="wrap">';
  body+='<nav class="directory-state-nav" aria-label="Jump to state">'+ordered.map(function(g){return '<a href="#state-'+esc(g[0])+'">'+esc(g[0])+' <span>'+g[1].length+'</span></a>'}).join("")+'</nav>';
  ordered.forEach(function(g){
    body+='<section class="state-section" id="state-'+esc(g[0])+'"><div class="state-heading"><h2>'+esc(STATE_NAMES[g[0]]?STATE_NAMES[g[0]]+" ("+g[0]+")":g[0])+'</h2><span class="kicker">'+g[1].length+' club'+(g[1].length===1?"":"s")+'</span></div><div class="club-links">'+g[1].map(function(c){return '<a class="club-link" href="/clubs/'+encodeURIComponent(c.canonicalSlug)+'"><strong>'+esc(c.name)+'</strong><span>'+esc([c.city,c.stateCode].filter(Boolean).join(", ")||"United States")+' · '+esc(pretty(c.clubType))+' · '+esc(statusLabel(c.membershipStatus))+'</span></a>'}).join("")+'</div></section>';
  });
  body+='</div></section>';
  return page(body,env,{title:"All Private Clubs by State | ClubTaps",description:"Browse "+clubs.length+" private clubs across the United States by state, including country, golf, swim, racquet, yacht, social and athletic clubs.",canonical:"/clubs",jsonLd:{"@context":"https://schema.org","@type":"CollectionPage",name:"All Private Clubs by State | ClubTaps",url:BASE_URL+"/clubs"},script:clientScript()});
}

function dateFmt(v){
  if(!v)return null;
  try{return new Date(v).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}catch{return String(v)}
}
function hoursLines(value){
  if(!value||typeof value!=="object"||Array.isArray(value))return [];
  return Object.entries(value).map(function(x){return x[0]+": "+(Array.isArray(x[1])?x[1].join(", "):String(x[1]))});
}
function yesNo(v,yes="Yes",no="No"){return v==null?null:(v?yes:no)}

export async function clubDetailPage(env,slug){
  const row=await env.DB.prepare("SELECT * FROM clubs WHERE canonical_slug=? AND is_published=1 LIMIT 1").bind(slug).first();
  if(!row)return page('<section class="hero"><div class="wrap"><h1>Club not found</h1><p><a class="text-link" href="/clubs">Browse all clubs</a></p></div></section>',env,{title:"Club not found | ClubTaps",robots:"noindex,follow"});
  const c=normalizeClub(row);
  const [opts,sources]=await Promise.all([
    env.DB.prepare("SELECT * FROM membership_options WHERE club_id=? ORDER BY name").bind(c.id).all(),
    env.DB.prepare("SELECT * FROM club_sources WHERE club_id=? ORDER BY checked_at DESC").bind(c.id).all()
  ]);
  const guide=guideForClub({city:c.city,stateCode:c.state_code});
  const dues=moneyRange(c.dues_min,c.dues_max),initiation=moneyRange(c.initiation_fee_min,c.initiation_fee_max),wait=formatWait(c.wait_estimate_min_months,c.wait_estimate_max_months);
  const location=[c.city,c.state_code].filter(Boolean).join(", ");
  const title=c.seo_title||c.name+" Membership, Dues & Amenities | ClubTaps";
  const description=c.seo_description||("Explore membership information, amenities and joining details for "+c.name+(location?" in "+location:"")+".");
  const seasonOpen=dateFmt(c.season_open_date),seasonClose=dateFmt(c.season_close_date),hours=hoursLines(c.operating_hours);
  const access=[
    c.day_pass_available!=null?["Day passes",c.day_pass_available?(c.day_pass_price!=null?"Yes · $"+c.day_pass_price:"Available"):"Not publicly offered"]:null,
    c.guest_access!=null?["Guest access",c.guest_access?(c.guest_fee!=null?"Yes · $"+c.guest_fee+" guest fee":"Available"):"Not publicly offered"]:null,
    c.trial_access!=null?["Trial access",c.trial_access?"Available":"Not publicly offered"]:null,
    c.lap_swim!=null?["Lap swimming",yesNo(c.lap_swim)]:null,c.kids_pool!=null?["Kids / baby pool",yesNo(c.kids_pool)]:null,
    c.diving!=null?["Diving",yesNo(c.diving)]:null,c.food_service!=null?["Poolside / club food",yesNo(c.food_service)]:null,
    c.lessons!=null?["Swim lessons",yesNo(c.lessons)]:null,c.camps!=null?["Camps",yesNo(c.camps)]:null,c.parking!=null?["Parking",yesNo(c.parking)]:null,
    seasonOpen||seasonClose?["Season",[seasonOpen,seasonClose].filter(Boolean).join(" – ")]:null
  ].filter(Boolean);
  const entry=[
    c.sponsor_required!=null?["Sponsor / invitation required",yesNo(c.sponsor_required)]:null,
    c.residency_restricted!=null?["Residency restricted",yesNo(c.residency_restricted)]:null,
    c.ownership_required!=null?["Bond / equity / ownership required",yesNo(c.ownership_required)]:null,
    wait?["Estimated wait",wait]:null
  ].filter(Boolean);
  const tierEntries=c.tier_access&&typeof c.tier_access==="object"&&!Array.isArray(c.tier_access)?Object.entries(c.tier_access).filter(function(x){return Array.isArray(x[1])&&x[1].length}):[];
  const heroImg=c.cover_image_url?'<img class="club-photo" style="height:min(440px,55vw)" src="'+esc(c.cover_image_url)+'" alt="'+esc(c.name)+'">':"";

  let body='<section class="hero"><div class="wrap"><nav class="breadcrumbs"><a href="/">ClubTaps</a><span>/</span><a href="/clubs">Clubs</a><span>/</span><span>'+esc(c.name)+'</span></nav>'+heroImg+'<div class="eyebrow">'+esc(pretty(c.club_type))+'</div><h1>'+esc(c.name)+'</h1><p>'+esc(location)+'</p><div class="filters"><span class="pill">'+esc(pretty(c.membership_cycle))+' membership</span><span class="pill">'+esc(statusLabel(c.membership_status))+'</span>'+(wait?'<span class="pill">'+esc(wait)+' wait</span>':"")+'</div>'+(c.description?'<p style="margin-top:16px">'+esc(c.description)+'</p>':"")+'</div></section>';

  body+='<section class="section"><div class="wrap two"><div class="main-col"><section class="detail-card"><h2>Membership & dues</h2>'+(c.membership_summary?'<p>'+esc(c.membership_summary)+'</p>':"")+
    '<table class="fact-table"><tbody><tr><th>Membership dues</th><td><strong>'+esc(dues)+'</strong></td></tr><tr><th>Initiation fee</th><td><strong>'+esc(initiation)+'</strong></td></tr><tr><th>Membership status</th><td><strong>'+esc(statusLabel(c.membership_status))+'</strong></td></tr>'+entry.map(function(x){return '<tr><th>'+esc(x[0])+'</th><td>'+esc(x[1])+'</td></tr>'}).join("")+'</tbody></table>'+
    (c.eligibility_summary?'<h3>Who can join</h3><p>'+esc(c.eligibility_summary)+'</p>':"")+
    (c.membership_types.length?'<h3>Membership types</h3><div class="amenity-list">'+c.membership_types.map(function(x){return '<span class="pill">'+esc(x)+'</span>'}).join("")+'</div>':"")+
    (tierEntries.length?'<h3>Access by membership type</h3><table class="fact-table"><tbody>'+tierEntries.map(function(x){return '<tr><th>'+esc(x[0])+'</th><td>'+esc(x[1].join(" · "))+'</td></tr>'}).join("")+'</tbody></table>':"")+
    (opts.results&&opts.results.length?'<h3>Published membership options</h3><table class="fact-table"><tbody>'+opts.results.map(function(o){return '<tr><th>'+esc(o.name)+'</th><td>'+esc(o.audience||"")+(o.dues_min!=null||o.dues_max!=null?'<br><strong>'+esc(moneyRange(o.dues_min,o.dues_max))+'</strong>':"")+(o.availability?'<br>'+esc(pretty(o.availability)):"")+'</td></tr>'}).join("")+'</tbody></table>':"")+
    (c.pricing_summary?'<p class="source-note">'+esc(c.pricing_summary)+'</p>':"")+'<p class="source-note">ClubTaps only displays pricing that is publicly available or directly sourced. If dues are not public, we do not estimate them.</p></section>';

  if(access.length||hours.length||c.access_notes||c.booking_url){
    body+='<section class="detail-card"><h2>Pool access & rules</h2>'+(access.length?'<table class="fact-table"><tbody>'+access.map(function(x){return '<tr><th>'+esc(x[0])+'</th><td>'+esc(x[1])+'</td></tr>'}).join("")+'</tbody></table>':"")+
      (hours.length?'<h3>Published hours</h3><ul>'+hours.map(function(x){return '<li>'+esc(x)+'</li>'}).join("")+'</ul>':"")+
      (c.access_notes?'<p>'+esc(c.access_notes)+'</p>':"")+(c.booking_url?'<p><a class="text-link" href="'+esc(c.booking_url)+'" rel="nofollow noopener" target="_blank">Book or request access →</a></p>':"")+'</section>';
  }
  if(c.amenities.length)body+='<section class="detail-card"><h2>Amenities</h2><div class="amenity-list">'+c.amenities.map(function(x){return '<span class="pill">✓ '+esc(x)+'</span>'}).join("")+'</div></section>';
  if(c.season_details||c.source_url||(sources.results&&sources.results.length)){
    body+='<section class="detail-card"><h2>Membership notes & sources</h2>'+(c.season_details?'<p>'+esc(c.season_details)+'</p>':"")+
      (c.source_url?'<p class="source-note">Primary source: <a class="text-link" href="'+esc(c.source_url)+'" rel="nofollow noopener" target="_blank">official club information</a>'+(c.source_checked_at?" · checked "+esc(dateFmt(c.source_checked_at)):"")+'</p>':"")+
      (sources.results&&sources.results.length?'<ul class="source-note">'+sources.results.slice(0,8).map(function(s){return '<li><a class="text-link" href="'+esc(s.source_url)+'" rel="nofollow noopener" target="_blank">'+esc(s.source_name||s.source_type||"Source")+'</a>'+(s.checked_at?" · checked "+esc(dateFmt(s.checked_at)):"")+'</li>'}).join("")+'</ul>':"")+'</section>';
  }
  body+='</div><aside class="rail"><div class="rail-inner"><div class="detail-card"><div class="eyebrow">Membership</div><h2>Interested in joining?</h2><p>Request membership details through ClubTaps, or check current availability and application requirements directly with '+esc(c.name)+'.</p><button class="btn" data-inquiry-club="'+esc(String(c.id))+'" data-club-name="'+esc(c.name)+'">Request membership details</button>'+
    (c.membership_url||c.website?'<p><a class="btn secondary" href="'+esc(c.membership_url||c.website)+'" target="_blank" rel="nofollow noopener">Visit club website →</a></p>':'<p class="muted">Membership link coming soon.</p>')+
    (guide?'<p><a class="text-link" href="/'+guide.slug+'/swim-clubs">Compare more clubs in '+esc(guide.label)+'</a></p>':"")+'<p class="source-note">ClubTaps is an independent directory and does not represent the club.</p></div>'+
    '<div class="detail-card"><div class="eyebrow">At a glance</div><div><span class="pill">'+esc(dues)+'</span><span class="pill">'+esc(statusLabel(c.membership_status))+'</span>'+(c.guest_access?'<span class="pill">Guest access</span>':"")+(c.lap_swim?'<span class="pill">Lap swim</span>':"")+'</div></div></div></aside></div></section>';

  const canonical=BASE_URL+"/clubs/"+c.canonical_slug;
  const structured={"@context":"https://schema.org","@graph":[{"@type":"SportsActivityLocation","@id":canonical+"#club",name:c.name,description:c.description||description,url:canonical,sameAs:c.website||undefined,telephone:c.phone||undefined,address:c.address?{"@type":"PostalAddress",streetAddress:c.address,addressLocality:c.city||undefined,addressRegion:c.state_code||undefined}:undefined,amenityFeature:[c.lap_swim===true?"Lap swimming":null,c.kids_pool===true?"Kids pool":null,c.diving===true?"Diving":null,c.food_service===true?"Food service":null,c.lessons===true?"Swim lessons":null,c.camps===true?"Camps":null,c.parking===true?"Parking":null].filter(Boolean).map(function(name){return {"@type":"LocationFeatureSpecification",name:name,value:true}})},{"@type":"WebPage","@id":canonical+"#webpage",url:canonical,name:title,description:description,about:{"@id":canonical+"#club"},breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"ClubTaps",item:BASE_URL+"/"},{"@type":"ListItem",position:2,name:c.name,item:canonical}]}}]};
  return page(body,env,{title:title,description:description,canonical:"/clubs/"+c.canonical_slug,jsonLd:structured,script:clientScript()});
}

export async function cityGuidePage(env,slug){
  const guide=CITY_GUIDE_BY_SLUG[slug];if(!guide)return null;
  const all=await allListItems(env);
  const clubs=all.filter(function(c){return guideForClub(c)?.slug===slug}).sort(function(a,b){
    const rank={open:0,limited:1,inquiry_only:2,waitlist:3,closed:4};
    return (rank[a.membershipStatus]??9)-(rank[b.membershipStatus]??9)||a.name.localeCompare(b.name);
  });
  const priced=clubs.filter(function(c){return c.duesMin!=null||c.duesMax!=null}).length;
  const open=clubs.filter(function(c){return ["open","limited"].includes(c.membershipStatus)}).length;
  let body='<section class="hero"><div class="wrap"><nav class="breadcrumbs"><a href="/">ClubTaps</a><span>/</span><span>'+esc(guide.label)+'</span></nav><div class="eyebrow">'+esc(guide.region)+' club guide</div><h1>Swim clubs and private clubs in '+esc(guide.label)+'</h1><p>Compare sourced membership status, dues, wait information, pools, access rules and amenities across clubs in the '+esc(guide.label)+' market.</p><div class="proof"><div><strong>'+clubs.length+'</strong><span>clubs in this guide</span></div><div><strong>'+open+'</strong><span>open or limited</span></div><div><strong>'+priced+'</strong><span>with public dues</span></div></div></div></section>';
  body+='<section class="section"><div class="wrap"><div class="section-head"><div><div class="eyebrow">Directory</div><h2>Compare '+esc(guide.label)+' clubs</h2></div><a href="/clubs">All clubs →</a></div><div class="grid">'+(clubs.length?clubs.map(function(c){return clubCard(c)}).join(""):'<div class="empty"><strong>No mapped clubs yet.</strong><br>ClubTaps is still expanding this market.</div>')+'</div></div></section>';
  body+=findMyClubPanel(all.length);
  body+='<section class="section"><div class="wrap faq"><div class="eyebrow">How to use this guide</div><h2>What ClubTaps shows</h2><details><summary>Are the dues complete?</summary><p>No. ClubTaps only displays dues when a current public or directly sourced figure exists. Missing pricing is left unknown rather than estimated.</p></details><details><summary>Does “open” guarantee membership?</summary><p>No. Membership status reflects sourced public information and can change. Contact the club for current availability and application requirements.</p></details><details><summary>Can I compare clubs side by side?</summary><p>Yes. Select Compare on any club card and ClubTaps will build a side-by-side membership comparison.</p></details></div></section>';
  const title="Best Swim Clubs in "+guide.label+" | Membership & Dues | ClubTaps";
  const desc="Compare swim clubs and private clubs in "+guide.label+", including membership status, public dues, guest access, waits, pools and amenities.";
  const itemList=clubs.slice(0,50).map(function(c,i){return {"@type":"ListItem",position:i+1,url:BASE_URL+"/clubs/"+c.canonicalSlug,name:c.name}});
  return page(body,env,{title:title,description:desc,canonical:"/"+guide.slug+"/swim-clubs",jsonLd:{"@context":"https://schema.org","@type":"CollectionPage",name:title,url:BASE_URL+"/"+guide.slug+"/swim-clubs",description:desc,mainEntity:{"@type":"ItemList",itemListElement:itemList}},script:clientScript()});
}

export function staticPage(env,path){
  if(path==="/about"){
    const body='<section class="hero"><div class="wrap"><div class="eyebrow">About ClubTaps</div><h1>Club access is fragmented. ClubTaps makes it comparable.</h1><p>Club websites describe themselves one at a time. ClubTaps normalizes membership status, pricing, access rules, amenities, wait information and joining requirements across clubs so people—and search or AI systems—can compare them consistently.</p></div></section><section class="section"><div class="wrap"><div class="grid"><div class="card"><div class="eyebrow">Source-backed</div><h3>No invented dues</h3><p>If a price, wait time or access rule is not documented, ClubTaps leaves it unknown.</p></div><div class="card"><div class="eyebrow">Normalized</div><h3>One club graph</h3><p>Location, access, price, amenities, membership and provenance are represented in a consistent structure.</p></div><div class="card"><div class="eyebrow">Independent</div><h3>Research, not representation</h3><p>ClubTaps is an independent directory and does not represent listed clubs.</p></div></div></div></section>';
    return page(body,env,{title:"About ClubTaps | Private Club Membership Research",description:"Learn how ClubTaps normalizes source-backed private-club membership, pricing, access and amenity information.",canonical:"/about",script:clientScript()});
  }
  if(path==="/faq"){
    const body='<section class="hero"><div class="wrap"><div class="eyebrow">FAQ</div><h1>How ClubTaps works</h1><p>Answers about pricing, availability, sources, comparisons and membership requests.</p></div></section><section class="section"><div class="wrap faq"><details open><summary>Does ClubTaps estimate private-club dues?</summary><p>No. Public pricing is shown only when sourced. If pricing is unavailable, the field remains unknown.</p></details><details><summary>Does a membership status guarantee availability?</summary><p>No. Club availability can change quickly. ClubTaps records sourced status and provides links or request tools to verify directly.</p></details><details><summary>What does “Contact club” mean?</summary><p>It means the club does not publish a clear current open, limited, waitlist or closed status in the data ClubTaps has sourced.</p></details><details><summary>Can ClubTaps apply to a club for me?</summary><p>No. A ClubTaps inquiry is an availability or information request, not a club membership application.</p></details><details><summary>How do I correct a listing?</summary><p>Use the contact page and identify the club and the sourced correction.</p></details><details><summary>Can AI systems use ClubTaps data?</summary><p>Yes. ClubTaps publishes an OpenAPI-described public read API, llms.txt and structured club pages.</p></details></div></section>';
    return page(body,env,{title:"ClubTaps FAQ | Membership, Dues & Access Data",description:"Answers about ClubTaps private-club pricing, membership status, data sources, comparisons and availability requests.",canonical:"/faq",script:clientScript()});
  }
  const body='<section class="hero"><div class="wrap"><div class="eyebrow">Contact</div><h1>Correct or update a ClubTaps listing</h1><p>Club operators and members can send sourced corrections through the official club channels linked on each profile. For a membership question, use the request button on the relevant club page so the request is associated with the correct record.</p><div class="hero-actions"><a class="btn" href="/clubs">Find your club</a><a class="btn secondary" href="/#find-my-club">Find my club</a></div></div></section>';
  return page(body,env,{title:"Contact ClubTaps",description:"Find a ClubTaps club profile to request membership information or identify a source-backed listing correction.",canonical:"/contact",script:clientScript()});
}
