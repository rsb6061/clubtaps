export const API_VERSION = "2026-09-15";
export const BASE_URL = "https://clubtaps.com";

export const BOOL_FIELDS = [
  "is_claimed","is_published","sponsor_required","residency_restricted","ownership_required",
  "day_pass_available","guest_access","trial_access","lap_swim","kids_pool","diving",
  "food_service","parking","lessons","camps"
];
export const JSON_FIELDS = ["gallery_images","membership_types","amenities","tier_access","operating_hours"];

export function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

export function normalizeClub(row) {
  if (!row) return null;
  const out = { ...row };
  for (const key of BOOL_FIELDS) out[key] = out[key] == null ? null : Boolean(out[key]);
  for (const key of JSON_FIELDS) {
    out[key] = parseJson(out[key], key === "tier_access" || key === "operating_hours" ? null : []);
  }
  out.gallery_images = Array.isArray(out.gallery_images) ? out.gallery_images.filter(v => typeof v === "string") : [];
  out.membership_types = Array.isArray(out.membership_types) ? out.membership_types.filter(v => typeof v === "string") : [];
  out.amenities = Array.isArray(out.amenities) ? out.amenities.filter(v => typeof v === "string") : [];
  return out;
}

export function pretty(value="") {
  return String(value).replace(/_/g," ").replace(/\b\w/g,m=>m.toUpperCase());
}

export function moneyRange(min,max,fallback="Not publicly listed") {
  if (min == null && max == null) return fallback;
  const fmt = v => "$" + Number(v).toLocaleString("en-US",{maximumFractionDigits:0});
  if (min != null && max != null && Number(min) !== Number(max)) return fmt(min) + "–" + fmt(max);
  return fmt(min ?? max);
}

export function formatWait(min,max) {
  if (min == null && max == null) return null;
  const unit = n => n === 1 ? "month" : "months";
  if (min != null && max != null && Number(min) !== Number(max)) return `${min}–${max} months`;
  const n = Number(min ?? max);
  return `${n} ${unit(n)}`;
}

function inferredFlag(explicit, amenities, patterns) {
  if (explicit != null) return explicit;
  const haystack = (amenities || []).join(" | ").toLowerCase();
  return patterns.some(pattern => pattern.test(haystack)) ? true : null;
}

export function publicClubRecord(row) {
  const c = normalizeClub(row);
  if (!c) return null;
  const amenities = c.amenities;
  const membershipTypes = c.membership_types;
  const tierAccess = c.tier_access && typeof c.tier_access === "object" && !Array.isArray(c.tier_access)
    ? Object.fromEntries(Object.entries(c.tier_access).map(([k,v]) => [k,Array.isArray(v) ? v.filter(x=>typeof x==="string") : []]))
    : null;
  const dateOnly = v => v ? String(v).slice(0,10) : null;

  return {
    apiVersion: API_VERSION,
    id: String(c.id),
    name: c.name,
    slug: c.canonical_slug,
    canonicalUrl: `${BASE_URL}/clubs/${c.canonical_slug}`,
    location: {
      city: c.city,
      state: c.state_code,
      zipCode: c.zip_code,
      neighborhood: c.neighborhood,
      address: c.address
    },
    clubType: c.club_type,
    description: c.description,
    membership: {
      status: c.membership_status,
      cycle: c.membership_cycle,
      types: membershipTypes,
      sponsorRequired: c.sponsor_required,
      residencyRestricted: c.residency_restricted,
      ownershipRequired: c.ownership_required,
      waitMonths: { min:c.wait_estimate_min_months, max:c.wait_estimate_max_months },
      eligibility: c.eligibility_summary,
      tierAccess,
      summary: c.membership_summary
    },
    pricing: {
      dues: { min:c.dues_min, max:c.dues_max },
      initiationFee: { min:c.initiation_fee_min, max:c.initiation_fee_max },
      summary: c.pricing_summary
    },
    access: {
      dayPass: c.day_pass_available,
      dayPassPrice: c.day_pass_price,
      guestAccess: c.guest_access,
      guestFee: c.guest_fee,
      trialAccess: c.trial_access,
      notes: c.access_notes,
      bookingUrl: c.booking_url
    },
    pool: {
      lapSwim: inferredFlag(c.lap_swim,amenities,[/lap/]),
      kidsPool: inferredFlag(c.kids_pool,amenities,[/baby pool/,/kiddie pool/,/wading pool/,/children.?s pool/,/zero.entry/]),
      diving: inferredFlag(c.diving,amenities,[/diving/,/dive /,/diving board/,/diving well/]),
      lessons: inferredFlag(c.lessons,amenities,[/swim lesson/])
    },
    amenities: {
      all: amenities,
      foodService: inferredFlag(c.food_service,amenities,[/snack/,/dining/,/food/,/cafe/,/grill/]),
      parking: inferredFlag(c.parking,amenities,[/parking/]),
      camps: inferredFlag(c.camps,amenities,[/camp/])
    },
    season: {
      opens: dateOnly(c.season_open_date),
      closes: dateOnly(c.season_close_date),
      details: c.season_details,
      hours: c.operating_hours
    },
    contact: {
      website: c.website,
      membershipUrl: c.membership_url,
      phone: c.phone
    },
    provenance: {
      sourceUrl: c.source_url,
      sourceCheckedAt: c.source_checked_at ? new Date(c.source_checked_at).toISOString() : null,
      dataConfidence: c.data_confidence,
      updatedAt: c.updated_at ? new Date(c.updated_at).toISOString() : null
    }
  };
}

export function listItem(row) {
  const c = normalizeClub(row);
  return {
    id:String(c.id), name:c.name, canonicalSlug:c.canonical_slug, city:c.city, stateCode:c.state_code,
    zipCode:c.zip_code, clubType:c.club_type, membershipStatus:c.membership_status, membershipCycle:c.membership_cycle,
    duesMin:c.dues_min, duesMax:c.dues_max, initiationFeeMin:c.initiation_fee_min, initiationFeeMax:c.initiation_fee_max,
    description:c.description, amenities:c.amenities, website:c.website, membershipUrl:c.membership_url,
    coverImageUrl:c.cover_image_url, updatedAt:c.updated_at, membershipTypes:c.membership_types,
    sponsorRequired:c.sponsor_required, residencyRestricted:c.residency_restricted, ownershipRequired:c.ownership_required,
    waitEstimateMinMonths:c.wait_estimate_min_months, waitEstimateMaxMonths:c.wait_estimate_max_months,
    eligibilitySummary:c.eligibility_summary, tierAccess:c.tier_access, pricingSummary:c.pricing_summary,
    membershipSummary:c.membership_summary, dayPassAvailable:c.day_pass_available, dayPassPrice:c.day_pass_price,
    guestAccess:c.guest_access, guestFee:c.guest_fee, trialAccess:c.trial_access, lapSwim:c.lap_swim,
    kidsPool:c.kids_pool, diving:c.diving, foodService:c.food_service, parking:c.parking, lessons:c.lessons,
    camps:c.camps, bookingUrl:c.booking_url, accessNotes:c.access_notes, operatingHours:c.operating_hours,
    seasonOpenDate:c.season_open_date, seasonCloseDate:c.season_close_date
  };
}

const textOf = club => [
  club.name,club.description,club.membershipSummary,club.eligibilitySummary,
  ...(club.amenities||[]),...(club.membershipTypes||[]),
  ...Object.entries(club.tierAccess||{}).flatMap(([k,v])=>[k,...(Array.isArray(v)?v:[])])
].filter(Boolean).join(" | ").toLowerCase();

export const hasPool = c => Boolean(c.lapSwim || c.kidsPool || /pool|swim/.test(textOf(c)));
export const hasRacquets = c => /tennis|racquet|pickleball|squash/.test(textOf(c));
export const hasGolf = c => c.clubType === "golf" || c.clubType === "country" || /\bgolf\b/.test(textOf(c));
export const hasFamilyMembership = c => /family|spouse|dependent|household/.test(textOf(c));
export const hasSocialMembership = c => /social membership|social member|social category/.test(textOf(c));
export const hasNonResidentMembership = c => /non.?resident|national membership|out.?of.?town/.test(textOf(c));
export const hasYoungMembership = c => /young|under.?40|junior executive|junior member/.test(textOf(c));

export function decisionFacts(c) {
  const rows=[];
  if (c.membershipStatus) rows.push(["Membership",c.membershipStatus==="inquiry_only"?"Contact club":pretty(c.membershipStatus)]);
  const wait=formatWait(c.waitEstimateMinMonths,c.waitEstimateMaxMonths); if(wait) rows.push(["Estimated wait",wait]);
  if (c.sponsorRequired != null) rows.push(["Sponsor required",c.sponsorRequired?"Yes":"No"]);
  if (c.residencyRestricted != null) rows.push(["Residency restricted",c.residencyRestricted?"Yes":"No"]);
  if (c.ownershipRequired != null) rows.push(["Equity / bond",c.ownershipRequired?"Required":"Not required"]);
  return rows;
}
