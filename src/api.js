import { API_VERSION, listItem, normalizeClub, publicClubRecord } from "./club.js";
import { parsePreferences, rankClubMatches } from "./matcher.js";

export function apiHeaders(extra={}) {
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
export function json(data,status=200,extra={}) {
  return new Response(JSON.stringify(data),{status,headers:apiHeaders(extra)});
}
const bad = (message,status=400) => json({error:message},status,{"cache-control":"no-store"});
const clean = (v,max=1000) => typeof v==="string" ? v.trim().slice(0,max) : "";
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

async function rowsAll(env,sql="SELECT * FROM clubs WHERE is_published=1 ORDER BY name") {
  const r=await env.DB.prepare(sql).all();
  return r.results||[];
}

export async function clubsList(env) {
  const rows=await rowsAll(env);
  return json(rows.map(listItem));
}
export async function clubsIndex(env) {
  const rows=await env.DB.prepare("SELECT id,name,canonical_slug,city,state_code,club_type,membership_status FROM clubs WHERE is_published=1 ORDER BY state_code,name").all();
  return json((rows.results||[]).map(r=>({
    id:String(r.id),name:r.name,canonicalSlug:r.canonical_slug,city:r.city,stateCode:r.state_code,clubType:r.club_type,membershipStatus:r.membership_status
  })));
}
export async function clubsStats(env) {
  const r=await env.DB.prepare(`SELECT COUNT(*) total,
    SUM(CASE WHEN membership_status IN ('open','limited') THEN 1 ELSE 0 END) openOrLimited,
    SUM(CASE WHEN dues_min IS NOT NULL OR dues_max IS NOT NULL THEN 1 ELSE 0 END) priced
    FROM clubs WHERE is_published=1`).first();
  return json({total:Number(r?.total||0),openOrLimited:Number(r?.openOrLimited||0),priced:Number(r?.priced||0)});
}
export async function clubsGet(env,url) {
  const slug=clean(url.searchParams.get("slug"),240);
  if(!slug)return bad("slug is required");
  const row=await env.DB.prepare("SELECT * FROM clubs WHERE canonical_slug=? AND is_published=1 LIMIT 1").bind(slug).first();
  return row?json(detailRecord(row)):json(null,404);
}
function detailRecord(row) {
  const c=normalizeClub(row);
  return {
    id:String(c.id),name:c.name,canonicalSlug:c.canonical_slug,city:c.city,stateCode:c.state_code,zipCode:c.zip_code,
    neighborhood:c.neighborhood,address:c.address,lat:c.lat,lng:c.lng,coverImageUrl:c.cover_image_url,galleryImages:c.gallery_images,
    clubType:c.club_type,membershipTypes:c.membership_types,membershipStatus:c.membership_status,membershipCycle:c.membership_cycle,
    duesMin:c.dues_min,duesMax:c.dues_max,initiationFeeMin:c.initiation_fee_min,initiationFeeMax:c.initiation_fee_max,
    pricingSummary:c.pricing_summary,description:c.description,amenities:c.amenities,seasonDetails:c.season_details,website:c.website,
    phone:c.phone,membershipUrl:c.membership_url,sourceUrl:c.source_url,sourceCheckedAt:c.source_checked_at,isClaimed:c.is_claimed,
    membershipSummary:c.membership_summary,seoTitle:c.seo_title,seoDescription:c.seo_description,dataConfidence:c.data_confidence,
    sponsorRequired:c.sponsor_required,residencyRestricted:c.residency_restricted,ownershipRequired:c.ownership_required,
    waitEstimateMinMonths:c.wait_estimate_min_months,waitEstimateMaxMonths:c.wait_estimate_max_months,eligibilitySummary:c.eligibility_summary,
    tierAccess:c.tier_access,dayPassAvailable:c.day_pass_available,dayPassPrice:c.day_pass_price,guestAccess:c.guest_access,guestFee:c.guest_fee,
    trialAccess:c.trial_access,lapSwim:c.lap_swim,kidsPool:c.kids_pool,diving:c.diving,foodService:c.food_service,parking:c.parking,
    lessons:c.lessons,camps:c.camps,bookingUrl:c.booking_url,accessNotes:c.access_notes,operatingHours:c.operating_hours,
    seasonOpenDate:c.season_open_date,seasonCloseDate:c.season_close_date,updatedAt:c.updated_at
  };
}

export async function publicSearch(env,url) {
  const sp=url.searchParams;
  const clauses=["is_published=1"],binds=[];
  const q=clean(sp.get("q"),180).toLowerCase();
  const city=clean(sp.get("city"),120);
  const state=clean(sp.get("state"),2).toUpperCase();
  const clubType=clean(sp.get("clubType"),40);
  const membershipStatus=clean(sp.get("membershipStatus"),40);
  const access=clean(sp.get("access"),40);
  const accessMap={dayPass:"day_pass_available",guestAccess:"guest_access",trialAccess:"trial_access",lapSwim:"lap_swim",kidsPool:"kids_pool",diving:"diving",foodService:"food_service",parking:"parking",lessons:"lessons",camps:"camps"};
  if(city){clauses.push("LOWER(city)=LOWER(?)");binds.push(city)}
  if(state){clauses.push("state_code=?");binds.push(state)}
  if(clubType){clauses.push("club_type=?");binds.push(clubType)}
  if(membershipStatus){clauses.push("membership_status=?");binds.push(membershipStatus)}
  if(accessMap[access])clauses.push(accessMap[access]+"=1");
  const maxDues=Number(sp.get("maxDues"));
  if(Number.isFinite(maxDues)&&maxDues>=0){clauses.push("COALESCE(dues_max,dues_min) IS NOT NULL AND COALESCE(dues_max,dues_min)<=?");binds.push(maxDues)}
  if(q){
    const like="%"+q+"%";
    clauses.push("(LOWER(name) LIKE ? OR LOWER(COALESCE(city,'')) LIKE ? OR LOWER(COALESCE(state_code,'')) LIKE ? OR LOWER(COALESCE(description,'')) LIKE ? OR LOWER(COALESCE(amenities,'')) LIKE ?)");
    binds.push(like,like,like,like,like);
  }
  const limit=Math.max(1,Math.min(100,Number(sp.get("limit"))||25));
  const offset=Math.max(0,Number(sp.get("offset"))||0);
  const where=clauses.join(" AND ");
  const [count,res]=await Promise.all([
    env.DB.prepare("SELECT COUNT(*) n FROM clubs WHERE "+where).bind(...binds).first(),
    env.DB.prepare("SELECT * FROM clubs WHERE "+where+" ORDER BY name LIMIT ? OFFSET ?").bind(...binds,limit,offset).all()
  ]);
  const results=(res.results||[]).map(publicClubRecord);
  return json({apiVersion:API_VERSION,meta:{total:Number(count?.n||0),limit,offset,returned:results.length},results});
}

export async function publicGet(env,url) {
  const slug=clean(url.searchParams.get("slug"),240);
  if(!slug)return bad("slug is required");
  const row=await env.DB.prepare("SELECT * FROM clubs WHERE canonical_slug=? AND is_published=1 LIMIT 1").bind(slug).first();
  if(!row)return json({apiVersion:API_VERSION,error:"Club not found"},404);
  return json(publicClubRecord(row));
}

export async function publicMarkets(env,url) {
  const state=clean(url.searchParams.get("state"),2).toUpperCase();
  const where=state?"is_published=1 AND state_code=?":"is_published=1";
  const stmt=env.DB.prepare(`SELECT city,state_code,COUNT(*) count,
    SUM(CASE WHEN dues_min IS NOT NULL OR dues_max IS NOT NULL THEN 1 ELSE 0 END) withPublicPricing,
    SUM(CASE WHEN membership_status IN ('open','limited') THEN 1 ELSE 0 END) openOrLimited,
    SUM(CASE WHEN guest_access=1 THEN 1 ELSE 0 END) withGuestAccess,
    SUM(CASE WHEN lap_swim=1 THEN 1 ELSE 0 END) withLapSwim
    FROM clubs WHERE ${where} AND city IS NOT NULL AND state_code IS NOT NULL GROUP BY city,state_code ORDER BY count DESC,state_code,city`);
  const [total,res]=await Promise.all([
    (state?env.DB.prepare("SELECT COUNT(*) n FROM clubs WHERE "+where).bind(state):env.DB.prepare("SELECT COUNT(*) n FROM clubs WHERE "+where)).first(),
    (state?stmt.bind(state):stmt).all()
  ]);
  const markets=(res.results||[]).map(r=>({city:r.city,state:r.state_code,count:Number(r.count),withPublicPricing:Number(r.withPublicPricing),openOrLimited:Number(r.openOrLimited),withGuestAccess:Number(r.withGuestAccess),withLapSwim:Number(r.withLapSwim)}));
  return json({apiVersion:API_VERSION,totalClubs:Number(total?.n||0),markets});
}

async function publishedIds(env,ids) {
  if(!ids.length)return [];
  const placeholders=ids.map(()=>"?").join(",");
  const r=await env.DB.prepare(`SELECT id,name FROM clubs WHERE is_published=1 AND id IN (${placeholders})`).bind(...ids).all();
  return r.results||[];
}
export async function createInquiry(request,env) {
  if((request.headers.get("content-type")||"").split(";")[0]!=="application/json")return bad("JSON required",415);
  const b=await request.json().catch(()=>null);
  if(!b)return bad("Invalid request");
  if(clean(b.website,200))return json({ok:true,inquiryId:"accepted"},200,{"cache-control":"no-store"});
  const clubId=Number(b.clubId);
  const name=clean(b.name,120),email=clean(b.email,240).toLowerCase(),phone=clean(b.phone,60),membershipType=clean(b.membershipType,160),message=clean(b.message,3000);
  if(!Number.isInteger(clubId)||!validEmail(email))return bad("Valid club and email are required");
  const clubs=await publishedIds(env,[clubId]); if(clubs.length!==1)return bad("Club not found",404);
  const r=await env.DB.prepare("INSERT INTO membership_inquiries (club_id,name,email,phone,membership_type,message) VALUES (?,?,?,?,?,?)").bind(clubId,name||null,email,phone||null,membershipType||null,message||null).run();
  return json({ok:true,inquiryId:String(r.meta?.last_row_id??"accepted")},201,{"cache-control":"no-store"});
}
export async function bulkInquiry(request,env) {
  if((request.headers.get("content-type")||"").split(";")[0]!=="application/json")return bad("JSON required",415);
  const b=await request.json().catch(()=>null); if(!b)return bad("Invalid request");
  if(clean(b.website,200))return json({ok:true,inquiryIds:["accepted"]},200,{"cache-control":"no-store"});
  const ids=[...new Set((Array.isArray(b.clubIds)?b.clubIds:[]).map(Number).filter(Number.isInteger))].slice(0,5);
  const name=clean(b.name,120),email=clean(b.email,240).toLowerCase(),phone=clean(b.phone,60),searchQuery=clean(b.searchQuery,1200),message=clean(b.message,3000);
  if(!ids.length||!validEmail(email))return bad("Valid clubs and email are required");
  const clubs=await publishedIds(env,ids); if(clubs.length!==ids.length)return bad("One or more clubs were not found",404);
  const note=["ClubTaps Find my club availability check.",searchQuery?`User search: ${searchQuery}`:"",message?`Additional note: ${message}`:""].filter(Boolean).join("\n\n");
  const results=[];
  for(const club of clubs){
    const r=await env.DB.prepare("INSERT INTO membership_inquiries (club_id,name,email,phone,membership_type,message) VALUES (?,?,?,?,?,?)").bind(Number(club.id),name||null,email,phone||null,"ClubTaps availability check",note||null).run();
    results.push(String(r.meta?.last_row_id??"accepted"));
  }
  return json({ok:true,inquiryIds:results},201,{"cache-control":"no-store"});
}

export async function clubMatch(request,env) {
  if((request.headers.get("content-type")||"").split(";")[0]!=="application/json")return bad("JSON required",415);
  const b=await request.json().catch(()=>null); const query=clean(b?.query,1200);
  if(query.length<8)return bad("Tell us a little more about what you want");
  const preferences=parsePreferences(query);
  const rows=await rowsAll(env);
  const matches=rankClubMatches(rows.map(listItem),preferences);
  return json({preferences,matches},200,{"cache-control":"no-store"});
}

export function openApiDocument() {
  return {
    openapi:"3.1.0",
    info:{title:"ClubTaps Public Club API",version:API_VERSION,description:"Source-backed private club membership, access, pricing and amenity data. Unknown values remain null."},
    servers:[{url:"https://clubtaps.com"}],
    paths:{
      "/_api/public/clubs/search":{get:{summary:"Search published clubs",parameters:[
        {name:"q",in:"query",schema:{type:"string"}},{name:"city",in:"query",schema:{type:"string"}},{name:"state",in:"query",schema:{type:"string",maxLength:2}},
        {name:"clubType",in:"query",schema:{type:"string"}},{name:"membershipStatus",in:"query",schema:{type:"string"}},
        {name:"access",in:"query",schema:{type:"string",enum:["dayPass","guestAccess","trialAccess","lapSwim","kidsPool","diving","foodService","parking","lessons","camps"]}},
        {name:"maxDues",in:"query",schema:{type:"number"}},{name:"limit",in:"query",schema:{type:"integer",minimum:1,maximum:100}},{name:"offset",in:"query",schema:{type:"integer",minimum:0}}
      ],responses:{"200":{description:"Matching clubs"}}}},
      "/_api/public/clubs/get":{get:{summary:"Get a published club by canonical slug",responses:{"200":{description:"Club record"},"404":{description:"Not found"}}}},
      "/_api/public/clubs/markets":{get:{summary:"List city/state market aggregates",responses:{"200":{description:"Market aggregates"}}}}
    }
  };
}
