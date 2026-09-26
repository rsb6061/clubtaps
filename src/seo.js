import { BASE_URL, moneyRange, formatWait, pretty } from "./club.js";

export const SITE_NAME = "ClubTaps";
export const ORG_ID = BASE_URL + "/#organization";
export const WEBSITE_ID = BASE_URL + "/#website";

export function baseSchema() {
  return [
    {
      "@type":"Organization",
      "@id":ORG_ID,
      name:"ClubTaps",
      url:BASE_URL+"/",
      logo:{
        "@type":"ImageObject",
        url:BASE_URL+"/favicon.png",
        width:256,
        height:256
      },
      description:"ClubTaps is an independent directory for comparing private-club membership, public dues, availability, access rules, amenities and joining requirements."
    },
    {
      "@type":"WebSite",
      "@id":WEBSITE_ID,
      url:BASE_URL+"/",
      name:"ClubTaps",
      publisher:{"@id":ORG_ID},
      description:"Source-backed private-club membership, pricing, availability and access research.",
      potentialAction:{
        "@type":"SearchAction",
        target:BASE_URL+"/?q={search_term_string}",
        "query-input":"required name=search_term_string"
      }
    }
  ];
}

export function combineSchema(pageSchema) {
  const base=baseSchema();
  if(!pageSchema) return {"@context":"https://schema.org","@graph":base};
  if(pageSchema["@graph"]) {
    return {"@context":"https://schema.org","@graph":[...base,...pageSchema["@graph"].map(x=>({...x}))]};
  }
  const copy={...pageSchema};
  delete copy["@context"];
  return {"@context":"https://schema.org","@graph":[...base,copy]};
}

export function clubMeta(c) {
  const location=[c.city,c.state_code].filter(Boolean).join(", ");
  const title=c.seo_title || `${c.name} Membership, Dues & Availability | ClubTaps`;
  const facts=[];
  if(c.membership_status) facts.push(c.membership_status==="inquiry_only"?"membership availability requires contacting the club":`membership is listed as ${pretty(c.membership_status).toLowerCase()}`);
  if(c.dues_min!=null||c.dues_max!=null) facts.push(`published dues are ${moneyRange(c.dues_min,c.dues_max)}`);
  if(c.initiation_fee_min!=null||c.initiation_fee_max!=null) facts.push(`initiation fees are ${moneyRange(c.initiation_fee_min,c.initiation_fee_max)}`);
  const wait=formatWait(c.wait_estimate_min_months,c.wait_estimate_max_months);
  if(wait) facts.push(`documented wait is ${wait}`);
  if(c.guest_access===true) facts.push("guest access is documented");
  if(c.lap_swim===true) facts.push("lap swimming is documented");
  const lead=`See ${c.name}${location?` in ${location}`:""} membership details`;
  const description=c.seo_description || `${lead}: ${facts.length?facts.slice(0,3).join("; "):"dues, joining requirements, access and amenities where publicly sourced"}. ClubTaps does not estimate missing private-club data.`;
  return {title,description};
}

export function cityMeta(guide,clubs,open,priced) {
  const count=clubs.length;
  const title=`Private & Swim Clubs in ${guide.label}: Membership & Dues | ClubTaps`;
  const description=`Compare ${count} private and swim clubs in ${guide.label}. See membership status, public dues, wait information, pools, guest access and source-backed joining details; ${open} are listed as open or limited and ${priced} publish dues.`;
  return {title,description};
}

export function citySummary(guide,clubs,open,priced) {
  const types=[...new Set(clubs.map(c=>c.clubType).filter(Boolean))].map(pretty).slice(0,6);
  const openNames=clubs.filter(c=>["open","limited"].includes(c.membershipStatus)).slice(0,6);
  const pricedNames=clubs.filter(c=>c.duesMin!=null||c.duesMax!=null).slice(0,6);
  return {types,openNames,pricedNames};
}
