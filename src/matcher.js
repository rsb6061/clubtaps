import {
  hasPool,hasRacquets,hasGolf,hasFamilyMembership,hasSocialMembership,hasNonResidentMembership,hasYoungMembership,
  moneyRange,formatWait,pretty
} from "./club.js";
import { CITY_GUIDES, guideForClub } from "./catalog.js";

const STATE_NAMES = {
  alabama:"AL",alaska:"AK",arizona:"AZ",arkansas:"AR",california:"CA",colorado:"CO",connecticut:"CT",delaware:"DE",
  florida:"FL",georgia:"GA",hawaii:"HI",idaho:"ID",illinois:"IL",indiana:"IN",iowa:"IA",kansas:"KS",kentucky:"KY",
  louisiana:"LA",maine:"ME",maryland:"MD",massachusetts:"MA",michigan:"MI",minnesota:"MN",mississippi:"MS",
  missouri:"MO",montana:"MT",nebraska:"NE",nevada:"NV","new hampshire":"NH","new jersey":"NJ","new mexico":"NM",
  "new york":"NY","north carolina":"NC","north dakota":"ND",ohio:"OH",oklahoma:"OK",oregon:"OR",pennsylvania:"PA",
  "rhode island":"RI","south carolina":"SC","south dakota":"SD",tennessee:"TN",texas:"TX",utah:"UT",vermont:"VT",
  virginia:"VA",washington:"WA","west virginia":"WV",wisconsin:"WI",wyoming:"WY","district of columbia":"DC"
};

const norm = v => String(v||"").toLowerCase().replace(/[^a-z0-9$./-]+/g," ").replace(/\s+/g," ").trim();
const words = v => norm(v).split(" ").filter(Boolean);

function explicitAvoid(q,terms) {
  return terms.some(term => new RegExp(`(?:no|without|avoid|don.?t want|do not want)[^.!]{0,24}\\b${term}\\b`,"i").test(q));
}
function indifferent(q,terms) {
  return terms.some(term => new RegExp(`\\b${term}\\b[^.!]{0,20}(?:doesn.?t matter|does not matter|not important)`,"i").test(q));
}
function featureLevel(q, terms) {
  if (indifferent(q,terms)) return "neutral";
  if (explicitAvoid(q,terms)) return "avoid";
  const joined=terms.join("|");
  if (new RegExp(`(?:need|must|require|required|have to|has to)[^.!]{0,28}(?:${joined})|(?:${joined})[^.!]{0,28}(?:must|required|non.?negotiable)`,"i").test(q)) return "must";
  if (new RegExp(`(?:ideally|prefer|would like|want|looking for|with)[^.!]{0,35}(?:${joined})|(?:${joined})`,"i").test(q)) return "prefer";
  return "neutral";
}
function extractMoney(q, context) {
  const snippets=q.split(/[.!?]/).filter(s=>context.test(s));
  for (const s of snippets) {
    const m=s.match(/(?:\$\s*)?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,6})(?:\s*(?:dollars?))?/i);
    if (m) return Number(m[1].replace(/,/g,""));
    const k=s.match(/([0-9]+(?:\.[0-9]+)?)\s*k\b/i);
    if (k) return Math.round(Number(k[1])*1000);
  }
  return null;
}
function extractWaitMonths(q) {
  let m=q.match(/(?:under|within|no more than|max(?:imum)?|up to|less than)?\s*(\d+(?:\.\d+)?)\s*(years?|yrs?)\b/i);
  if (m) return Math.round(Number(m[1])*12);
  m=q.match(/(?:under|within|no more than|max(?:imum)?|up to|less than)?\s*(\d+)\s*(months?|mos?)\b/i);
  if (m) return Number(m[1]);
  if (/one[- ]year/i.test(q)) return 12;
  return null;
}
function stateFromQuery(q) {
  for (const [name,code] of Object.entries(STATE_NAMES)) if (new RegExp(`\\b${name}\\b`,"i").test(q)) return code;
  const upper=String(q).toUpperCase();
  for (const code of Object.values(STATE_NAMES)) if (new RegExp(`(?:,|\\b)${code}\\b`).test(upper)) return code;
  return null;
}
function locationFromQuery(q) {
  const nq=norm(q);
  let best=null;
  for (const guide of CITY_GUIDES) {
    const candidates=[guide.label.toLowerCase(),guide.slug.replace(/-/g," "),...(guide.cities||[])].sort((a,b)=>b.length-a.length);
    const hit=candidates.find(v=>v.length>=4 && nq.includes(norm(v)));
    if (hit && (!best || hit.length>best.hit.length)) best={guide,hit};
  }
  return best;
}

export function parsePreferences(query) {
  const raw=String(query||"").trim();
  const q=raw.toLowerCase();
  const loc=locationFromQuery(raw);
  const inferredState=loc?.guide?.states?.length===1?loc.guide.states[0]:null;
  const explicitState=stateFromQuery(raw);
  const maxWaitMonths=extractWaitMonths(q);
  const maxDues=extractMoney(q,/(dues|per year|yearly|annual|per month|monthly|season|budget|under|less than|no more than|max)/i);
  const maxInitiationFee=extractMoney(q,/(initiation|joining fee|entry fee)/i);
  const duesPeriod=/per\s*month|monthly|\/mo\b/i.test(q)?"monthly":/season|seasonal/i.test(q)?"seasonal":/per\s*year|annual|yearly|\/yr\b/i.test(q)?"annual":"unknown";
  const availableMust=/available now|open now|immediate(?:ly)?|no wait|without a wait/i.test(q);
  const waitMust=maxWaitMonths!=null && /under|within|no more than|max|up to|less than|must|need/i.test(q);
  const budgetMust=maxDues!=null && /under|within|no more than|max|budget|less than|must/i.test(q);

  const clubTypes=[];
  const typeTerms=[
    ["swim_pool",/\bswim(?:ming)? club\b|\bpool club\b/i],["country",/\bcountry club\b/i],["golf",/\bgolf club\b/i],
    ["racquet",/\bracquet club\b|\btennis club\b/i],["yacht",/\byacht club\b/i],["beach",/\bbeach club\b/i],
    ["social",/\bsocial club\b/i],["athletic",/\bathletic club\b/i],["dining",/\bdining club\b/i]
  ];
  for (const [type,re] of typeTerms) if(re.test(raw)) clubTypes.push(type);

  const preferences={
    summary:raw.length>180?raw.slice(0,177)+"…":raw,
    locationTerms:loc?[loc.hit,loc.guide.label]:[],
    stateCode:explicitState||inferredState,
    metroLabel:loc?.guide?.label||null,
    clubTypes:clubTypes.slice(0,4),
    features:{
      pool:featureLevel(raw,["pool","swim","swimming"]),
      racquets:featureLevel(raw,["tennis","racquet","pickleball"]),
      golf:featureLevel(raw,["golf"]),
      family:featureLevel(raw,["family","families","kids","children"]),
      socialMembership:featureLevel(raw,["social membership","social option"]),
      nonResident:featureLevel(raw,["non resident","non-resident","national membership"]),
      youngMembership:featureLevel(raw,["young member","under 40","under-40","junior executive"])
    },
    availabilityPriority:availableMust?"must":/available|open membership|shortest possible wait|short wait/i.test(q)?"prefer":"neutral",
    maxWaitMonths,
    waitPriority:waitMust?"must":maxWaitMonths!=null||/shortest possible wait|short wait|wait time/i.test(q)?"prefer":"neutral",
    maxDues,
    duesPeriod,
    budgetPriority:budgetMust?"must":maxDues!=null?"prefer":"neutral",
    maxInitiationFee,
    initiationPriority:maxInitiationFee!=null&&/under|no more than|max|budget|less than/i.test(q)?"must":maxInitiationFee!=null?"prefer":"neutral",
    avoidSponsor:/no sponsor|without (?:a )?sponsor|avoid sponsor/i.test(q),
    avoidResidencyRestriction:/no residency|without residency|avoid residency/i.test(q),
    avoidEquityBond:/no equity|no bond|without equity|without (?:a )?bond/i.test(q)
  };
  return preferences;
}

function importanceWeight(level,must,prefer,avoid=prefer) {
  if(level==="must") return must;
  if(level==="prefer") return prefer;
  if(level==="avoid") return avoid;
  return 0;
}
function featureSatisfaction(has,level) {
  if(level==="neutral") return null;
  if(level==="avoid") return has?0:1;
  return has?1:.28;
}
function availabilitySatisfaction(status) {
  return ({open:1,limited:.88,inquiry_only:.58,waitlist:.22,closed:.05})[status]??.45;
}
function comparableDues(club,period) {
  const amount=club.duesMax??club.duesMin;
  if(amount==null) return null;
  if(period==="unknown") return amount;
  if(period==="annual"){
    if(club.membershipCycle==="monthly") return amount*12;
    if(["annual","seasonal"].includes(club.membershipCycle)) return amount;
    if(club.membershipCycle==="custom"&&/annual|year|season/i.test(club.pricingSummary||"")) return amount;
    return null;
  }
  if(period==="monthly"){
    if(club.membershipCycle==="monthly") return amount;
    if(club.membershipCycle==="annual") return amount/12;
    if(club.membershipCycle==="custom"&&/monthly|month|\/mo/i.test(club.pricingSummary||"")) return amount;
    return null;
  }
  if(period==="seasonal"){
    if(["seasonal","annual"].includes(club.membershipCycle)) return amount;
    if(club.membershipCycle==="custom"&&/season/i.test(club.pricingSummary||"")) return amount;
  }
  return null;
}
function budgetSatisfaction(value,max) {
  if(max==null) return null;
  if(value==null) return .58;
  if(value<=max) return 1;
  return Math.max(.08,Math.min(.62,(max/value)*.62));
}
function waitSatisfaction(club,max) {
  if(max==null) return null;
  const wait=club.waitEstimateMaxMonths??club.waitEstimateMinMonths;
  if(wait==null) return .58;
  if(wait<=max) return 1;
  return Math.max(.08,Math.min(.55,(max/wait)*.55));
}
function restrictionSatisfaction(value) {
  if(value==null) return .62;
  return value?0:1;
}
function completeness(club) {
  const signals=[
    club.duesMin!=null||club.duesMax!=null,
    club.waitEstimateMinMonths!=null||club.waitEstimateMaxMonths!=null,
    (club.membershipTypes||[]).length>0,
    Boolean(club.membershipSummary),Boolean(club.eligibilitySummary),Boolean(club.tierAccess)
  ];
  return signals.filter(Boolean).length/signals.length;
}
function locationSatisfaction(club,p) {
  if(!p.metroLabel&&!p.stateCode&&!p.locationTerms.length) return null;
  const hay=norm(`${club.city||""} ${club.stateCode||""} ${club.name}`);
  if(p.locationTerms.some(term=>hay.includes(norm(term)))) return 1;
  const guide=guideForClub(club);
  if(p.metroLabel&&guide&&norm(guide.label)===norm(p.metroLabel)) return .82;
  if(p.stateCode&&club.stateCode===p.stateCode) return .58;
  return .04;
}
function scoreClub(club,p) {
  const criteria=[]; const push=(weight,sat)=>{if(weight>0&&sat!=null)criteria.push({weight,sat})};
  push(28,locationSatisfaction(club,p));
  if(p.clubTypes.length) push(9,p.clubTypes.includes(club.clubType)?1:.25);
  [
    [p.features.pool,hasPool(club)],[p.features.racquets,hasRacquets(club)],[p.features.golf,hasGolf(club)],
    [p.features.family,hasFamilyMembership(club)],[p.features.socialMembership,hasSocialMembership(club)],
    [p.features.nonResident,hasNonResidentMembership(club)],[p.features.youngMembership,hasYoungMembership(club)]
  ].forEach(([level,has])=>push(importanceWeight(level,12,7,7),featureSatisfaction(has,level)));
  push(p.availabilityPriority==="must"?16:p.availabilityPriority==="prefer"?11:6,availabilitySatisfaction(club.membershipStatus));
  push(importanceWeight(p.waitPriority,14,8),waitSatisfaction(club,p.maxWaitMonths));
  push(importanceWeight(p.budgetPriority,15,9),budgetSatisfaction(comparableDues(club,p.duesPeriod),p.maxDues));
  push(importanceWeight(p.initiationPriority,8,5),budgetSatisfaction(club.initiationFeeMax??club.initiationFeeMin,p.maxInitiationFee));
  if(p.avoidSponsor)push(5,restrictionSatisfaction(club.sponsorRequired));
  if(p.avoidResidencyRestriction)push(5,restrictionSatisfaction(club.residencyRestricted));
  if(p.avoidEquityBond)push(5,restrictionSatisfaction(club.ownershipRequired));
  push(4,completeness(club));
  const weighted=criteria.reduce((s,x)=>s+x.weight*x.sat,0);
  const total=criteria.reduce((s,x)=>s+x.weight,0)||1;
  return Math.max(35,Math.min(98,Math.round(weighted/total*100)));
}
function buildWhy(club,p) {
  const positives=[],tradeoffs=[],guide=guideForClub(club);
  if(p.locationTerms.some(term=>norm(`${club.city||""} ${club.name}`).includes(norm(term)))) positives.push(`${club.city||p.locationTerms[0]} location`);
  else if(p.metroLabel&&guide&&norm(guide.label)===norm(p.metroLabel)) positives.push(`${guide.label}-area location`);
  else if(p.stateCode&&club.stateCode===p.stateCode) positives.push(`in ${club.stateCode}`);

  const checks=[
    ["pool","pool",hasPool(club)],["racquets","tennis/racquets",hasRacquets(club)],["golf","golf",hasGolf(club)],
    ["family","family membership",hasFamilyMembership(club)],["socialMembership","social membership",hasSocialMembership(club)],
    ["nonResident","non-resident option",hasNonResidentMembership(club)],["youngMembership","young-member option",hasYoungMembership(club)]
  ];
  for(const [key,label,has] of checks){
    const pref=p.features[key];
    if(["must","prefer"].includes(pref)&&has) positives.push(label);
    if(pref==="avoid"&&has) tradeoffs.push(`includes ${label}`);
  }
  if(club.membershipStatus==="open") positives.push("currently presented as open");
  else if(club.membershipStatus==="limited") positives.push("limited availability");
  else if(p.availabilityPriority!=="neutral"&&["waitlist","closed"].includes(club.membershipStatus)) tradeoffs.push(pretty(club.membershipStatus).toLowerCase());

  if(p.maxWaitMonths!=null){
    const wait=club.waitEstimateMaxMonths??club.waitEstimateMinMonths;
    if(wait!=null&&wait<=p.maxWaitMonths) positives.push(`${formatWait(club.waitEstimateMinMonths,club.waitEstimateMaxMonths)} documented wait`);
    else if(wait!=null) tradeoffs.push(`${formatWait(club.waitEstimateMinMonths,club.waitEstimateMaxMonths)} documented wait`);
    else tradeoffs.push("wait time is not publicly documented");
  }
  if(p.maxDues!=null){
    const dues=comparableDues(club,p.duesPeriod);
    if(dues!=null&&dues<=p.maxDues) positives.push("published dues fit your budget");
    else if(dues!=null) tradeoffs.push(`${moneyRange(club.duesMin,club.duesMax)} published dues`);
    else tradeoffs.push("comparable dues are not publicly documented");
  }
  if(p.avoidSponsor&&club.sponsorRequired===true) tradeoffs.push("sponsor required");
  if(p.avoidResidencyRestriction&&club.residencyRestricted===true) tradeoffs.push("residency restricted");
  if(p.avoidEquityBond&&club.ownershipRequired===true) tradeoffs.push("equity/bond requirement");
  const pos=positives.length?`Strong fit for ${positives.slice(0,3).join(", ")}.`:"One of the strongest overall matches in the ClubTaps directory.";
  return pos+(tradeoffs.length?` Tradeoff: ${tradeoffs.slice(0,2).join("; ")}.`:"");
}

export function rankClubMatches(clubs,preferences) {
  let candidates=clubs;
  if(preferences.metroLabel){
    const metro=clubs.filter(c=>norm(guideForClub(c)?.label)===norm(preferences.metroLabel));
    if(metro.length>=3)candidates=metro;
  }
  if(candidates===clubs&&preferences.stateCode){
    const state=clubs.filter(c=>c.stateCode===preferences.stateCode);
    if(state.length>=3)candidates=state;
  }
  const scored=candidates.map(club=>({club,score:scoreClub(club,preferences)})).sort((a,b)=>b.score-a.score||a.club.name.localeCompare(b.club.name));
  if(!scored.length)return [];
  const selected=[{...scored[0],label:"Best match"}];
  if(!["open","limited"].includes(scored[0].club.membershipStatus)){
    const available=scored.find(x=>x.club.id!==scored[0].club.id&&["open","limited"].includes(x.club.membershipStatus));
    if(available)selected.push({...available,label:"Best available now"});
  }
  for(const item of scored){
    if(selected.length>=3)break;
    if(selected.some(x=>x.club.id===item.club.id))continue;
    selected.push({...item,label:selected.length===1?"Strong alternative":"Worth considering"});
  }
  return selected.map(x=>({club:x.club,score:x.score,label:x.label,why:buildWhy(x.club,preferences)}));
}
