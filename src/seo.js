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
  let title=`${c.name} Membership, Dues & Fees | ClubTaps`;
  if(title.length>68) title=`${c.name} Membership & Dues | ClubTaps`;
  if(title.length>72) title=`${c.name} Membership | ClubTaps`;

  const facts=[];
  if(c.membership_status) facts.push(c.membership_status==="inquiry_only"?"contact the club for current membership availability":`membership is listed as ${pretty(c.membership_status).toLowerCase()}`);
  if(c.dues_min!=null||c.dues_max!=null) facts.push(`public dues ${moneyRange(c.dues_min,c.dues_max)}`);
  if(c.initiation_fee_min!=null||c.initiation_fee_max!=null) facts.push(`initiation fee ${moneyRange(c.initiation_fee_min,c.initiation_fee_max)}`);
  const wait=formatWait(c.wait_estimate_min_months,c.wait_estimate_max_months);
  if(wait) facts.push(`documented wait ${wait}`);
  if(c.guest_access===true) facts.push("guest access documented");
  if(c.lap_swim===true) facts.push("lap swimming documented");

  let description=`${c.name}${location?` in ${location}`:""} membership: ${facts.length?facts.slice(0,3).join("; "):"see source-backed dues, fees, availability, joining requirements, access and amenities where public"}.`;
  if(description.length<125) description+=" ClubTaps does not estimate missing private-club data.";
  return {title,description};
}

export function cityMeta(guide,clubs,open,priced) {
  const count=clubs.length;
  let title=`${guide.label} Private Clubs: Membership & Dues | ClubTaps`;
  if(title.length>68) title=`${guide.label} Private Clubs | ClubTaps`;
  const description=`Compare ${count} private and swim clubs in ${guide.label}: membership availability, public dues, wait information, pools, guest access, amenities and source-backed joining details.`;
  return {title,description};
}

export function citySummary(guide,clubs,open,priced) {
  const types=[...new Set(clubs.map(c=>c.clubType).filter(Boolean))].map(pretty).slice(0,6);
  const openNames=clubs.filter(c=>["open","limited"].includes(c.membershipStatus)).slice(0,6);
  const pricedNames=clubs.filter(c=>c.duesMin!=null||c.duesMax!=null).slice(0,6);
  return {types,openNames,pricedNames};
}
