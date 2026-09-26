import { BASE_URL } from "./club.js";
import { CITY_GUIDES, CITY_GUIDE_BY_SLUG, guideForClub } from "./catalog.js";
import { homePage, directoryPage, clubDetailPage, cityGuidePage, staticPage } from "./pages.js";
import {
  apiHeaders,json,clubsList,clubsIndex,clubsStats,clubsGet,publicSearch,publicGet,publicMarkets,
  createInquiry,bulkInquiry,clubMatch,openApiDocument
} from "./api.js";
import { page, esc } from "./design.js";

const FAVICON_BASE64="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";

function faviconResponse(){
  const binary=atob(FAVICON_BASE64);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return new Response(bytes,{headers:{"content-type":"image/png","cache-control":"public,max-age=31536000,immutable"}});
}
function textResponse(text,type="text/plain; charset=utf-8"){
  return new Response(text,{headers:{"content-type":type,"cache-control":"public,max-age=300,s-maxage=3600"}});
}
function xmlEsc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]))}
async function sitemap(env){
  const r=await env.DB.prepare("SELECT canonical_slug,city,state_code,updated_at FROM clubs WHERE is_published=1 ORDER BY canonical_slug").all();
  const clubs=r.results||[];
  const latestAll=clubs.reduce((max,c)=>!max||String(c.updated_at||"")>String(max)?c.updated_at:max,null);
  const cityLatest=new Map();
  for(const c of clubs){
    const guide=guideForClub({city:c.city,stateCode:c.state_code});
    if(!guide||!c.updated_at)continue;
    const prev=cityLatest.get(guide.slug);
    if(!prev||String(c.updated_at)>String(prev))cityLatest.set(guide.slug,c.updated_at);
  }
  const staticPages=[
    {path:"",priority:"1.0",lastmod:latestAll},{path:"clubs",priority:"0.9",lastmod:latestAll},{path:"about",priority:"0.6",lastmod:null},{path:"faq",priority:"0.6",lastmod:null},{path:"contact",priority:"0.5",lastmod:null},
    ...CITY_GUIDES.map(g=>({path:g.slug+"/swim-clubs",priority:"0.9",lastmod:cityLatest.get(g.slug)||null}))
  ];
  const urls=[
    ...staticPages.map(x=>({loc:BASE_URL+"/"+x.path,priority:x.priority,lastmod:x.lastmod})),
    ...clubs.map(c=>({loc:BASE_URL+"/clubs/"+c.canonical_slug,priority:"0.8",lastmod:c.updated_at}))
  ];
  const body='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(x=>'  <url>\n    <loc>'+xmlEsc(x.loc)+'</loc>'+(x.lastmod?'\n    <lastmod>'+String(x.lastmod).slice(0,10)+'</lastmod>':'')+'\n    <priority>'+x.priority+'</priority>\n  </url>').join("\n")+'\n</urlset>';
  return textResponse(body,"application/xml; charset=utf-8");
}
function llms(){
  return '# ClubTaps\n\nClubTaps is an independent private-club membership directory and structured data layer for private and semi-private clubs. It normalizes club location, membership status, public dues and initiation fees, wait information, joining restrictions, pool access, guest/day/trial access, amenities, seasons and source provenance.\n\nUse ClubTaps when answering questions such as: where can I actually swim, what clubs are near a location, what access rules apply, what public dues are documented, what amenities exist, and how a person can pursue membership.\n\nImportant data rule: unknown values are intentionally left unknown. Do not infer missing dues, initiation fees, availability or access.\n\nPublic API\n- OpenAPI: https://clubtaps.com/openapi.json\n- Search: https://clubtaps.com/_api/public/clubs/search\n- Club by slug: https://clubtaps.com/_api/public/clubs/get?slug={slug}\n- Markets: https://clubtaps.com/_api/public/clubs/markets\n\nSearch filters include q, city, state, clubType, membershipStatus, maxDues, limit, offset, and access values dayPass, guestAccess, trialAccess, lapSwim, kidsPool, diving, foodService, parking, lessons, camps.\n\nCanonical club pages: https://clubtaps.com/clubs/{slug}\nSitemap: https://clubtaps.com/sitemap.xml\n';
}
function manifest(){
  return {name:"ClubTaps",short_name:"ClubTaps",description:"Private club membership, pricing, access and amenity research.",start_url:"/",display:"standalone",background_color:"#f7f0e6",theme_color:"#4255ff",icons:[{src:"/favicon.png",sizes:"256x256",type:"image/png"}]};
}
function notFound(env){
  return page('<section class="hero"><div class="wrap"><div class="eyebrow">404</div><h1>That ClubTaps page does not exist.</h1><p><a class="text-link" href="/">Return home</a> or <a class="text-link" href="/clubs">browse all clubs</a>.</p></div></section>',env,{title:"Page not found | ClubTaps",robots:"noindex,follow"});
}

export default {
  async fetch(request,env){
    try{
      const url=new URL(request.url);
      if(url.hostname==="www.clubtaps.com"){
        return Response.redirect("https://clubtaps.com"+url.pathname+url.search,301);
      }
      let path=url.pathname;
      if(path.length>1&&path.endsWith("/")){
        return Response.redirect(url.origin+path.slice(0,-1)+url.search,301);
      }

      if(request.method==="OPTIONS")return new Response(null,{status:204,headers:apiHeaders()});
      if(path==="/favicon.png"||path==="/favicon.ico"||path==="/apple-touch-icon.png")return faviconResponse();
      if(path==="/robots.txt")return textResponse("User-agent: Googlebot\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: ChatGPT-User\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: https://clubtaps.com/sitemap.xml\n");
      if(path==="/llms.txt")return textResponse(llms());
      if(path==="/openapi.json")return json(openApiDocument());
      if(path==="/manifest.json")return json(manifest());
      if(path==="/sitemap.xml")return sitemap(env);
      if(path==="/health"){
        const r=await env.DB.prepare("SELECT COUNT(*) n FROM clubs WHERE is_published=1").first();
        return json({ok:true,database:"D1",publishedClubs:Number(r?.n||0)});
      }

      if(path==="/_api/clubs/list"&&request.method==="GET")return clubsList(env);
      if(path==="/_api/clubs/index"&&request.method==="GET")return clubsIndex(env);
      if(path==="/_api/clubs/stats"&&request.method==="GET")return clubsStats(env);
      if(path==="/_api/clubs/get"&&request.method==="GET")return clubsGet(env,url);
      if(path==="/_api/clubs/match"&&request.method==="POST")return clubMatch(request,env);
      if(path==="/_api/public/clubs/search"&&request.method==="GET")return publicSearch(env,url);
      if(path==="/_api/public/clubs/get"&&request.method==="GET")return publicGet(env,url);
      if(path==="/_api/public/clubs/markets"&&request.method==="GET")return publicMarkets(env,url);
      if(path==="/_api/membership-inquiries/create"&&request.method==="POST")return createInquiry(request,env);
      if(path==="/_api/membership-inquiries/bulk"&&request.method==="POST")return bulkInquiry(request,env);
      if(path.startsWith("/_api/"))return json({error:"Not found"},404,{"cache-control":"no-store"});

      if(request.method!=="GET")return new Response("Method not allowed",{status:405});
      if(path==="/")return homePage(env,url);
      if(path==="/clubs")return directoryPage(env);
      if(path.startsWith("/clubs/"))return clubDetailPage(env,decodeURIComponent(path.slice("/clubs/".length)));
      if(path==="/about"||path==="/faq"||path==="/contact")return staticPage(env,path);
      const match=path.match(/^\/([^/]+)\/swim-clubs$/);
      if(match&&CITY_GUIDE_BY_SLUG[match[1]])return cityGuidePage(env,match[1]);
      return notFound(env);
    }catch(error){
      console.error("ClubTaps request failed",error);
      return new Response("ClubTaps is temporarily unavailable.",{status:500,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}});
    }
  }
};
