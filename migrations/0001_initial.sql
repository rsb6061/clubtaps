PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  canonical_slug TEXT NOT NULL UNIQUE,
  city TEXT,
  state_code TEXT,
  neighborhood TEXT,
  address TEXT,
  lat REAL,
  lng REAL,
  cover_image_url TEXT,
  gallery_images TEXT NOT NULL DEFAULT '[]',
  club_type TEXT NOT NULL DEFAULT 'other',
  membership_types TEXT NOT NULL DEFAULT '[]',
  membership_status TEXT NOT NULL DEFAULT 'inquiry_only',
  membership_cycle TEXT NOT NULL DEFAULT 'custom',
  dues_min INTEGER,
  dues_max INTEGER,
  initiation_fee_min INTEGER,
  initiation_fee_max INTEGER,
  pricing_summary TEXT,
  description TEXT,
  amenities TEXT NOT NULL DEFAULT '[]',
  season_details TEXT,
  website TEXT,
  phone TEXT,
  membership_url TEXT,
  source_url TEXT,
  source_checked_at TEXT,
  is_claimed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  zip_code TEXT,
  country_code TEXT NOT NULL DEFAULT 'US',
  membership_summary TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_published INTEGER NOT NULL DEFAULT 1,
  data_confidence TEXT NOT NULL DEFAULT 'seeded',
  sponsor_required INTEGER,
  residency_restricted INTEGER,
  ownership_required INTEGER,
  wait_estimate_min_months INTEGER,
  wait_estimate_max_months INTEGER,
  eligibility_summary TEXT,
  tier_access TEXT,
  day_pass_available INTEGER,
  day_pass_price INTEGER,
  guest_access INTEGER,
  guest_fee INTEGER,
  trial_access INTEGER,
  lap_swim INTEGER,
  kids_pool INTEGER,
  diving INTEGER,
  food_service INTEGER,
  parking INTEGER,
  lessons INTEGER,
  camps INTEGER,
  booking_url TEXT,
  access_notes TEXT,
  operating_hours TEXT,
  season_open_date TEXT,
  season_close_date TEXT
);

CREATE INDEX IF NOT EXISTS idx_clubs_published ON clubs(is_published);
CREATE INDEX IF NOT EXISTS idx_clubs_city_state ON clubs(city, state_code);
CREATE INDEX IF NOT EXISTS idx_clubs_state ON clubs(state_code);
CREATE INDEX IF NOT EXISTS idx_clubs_slug ON clubs(canonical_slug);

CREATE TABLE IF NOT EXISTS club_sources (
  id INTEGER PRIMARY KEY,
  club_id INTEGER NOT NULL,
  source_url TEXT NOT NULL,
  source_name TEXT,
  source_type TEXT NOT NULL DEFAULT 'official_website',
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_club_sources_club ON club_sources(club_id);

CREATE TABLE IF NOT EXISTS membership_options (
  id INTEGER PRIMARY KEY,
  club_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  audience TEXT,
  dues_min INTEGER,
  dues_max INTEGER,
  initiation_fee_min INTEGER,
  initiation_fee_max INTEGER,
  billing_cycle TEXT,
  availability TEXT,
  notes TEXT,
  source_url TEXT,
  checked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_membership_options_club ON membership_options(club_id);

CREATE TABLE IF NOT EXISTS club_candidate_regions (
  source_name TEXT NOT NULL DEFAULT 'SwimStandards',
  region_code TEXT NOT NULL,
  region_name TEXT NOT NULL,
  zone TEXT,
  source_total_clubs INTEGER,
  source_total_members INTEGER,
  ingested_candidates INTEGER NOT NULL DEFAULT 0,
  reviewed_candidates INTEGER NOT NULL DEFAULT 0,
  qualified_candidates INTEGER NOT NULL DEFAULT 0,
  rejected_candidates INTEGER NOT NULL DEFAULT 0,
  source_url TEXT NOT NULL,
  source_last_updated TEXT,
  ingestion_status TEXT NOT NULL DEFAULT 'pending',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (source_name, region_code)
);

CREATE TABLE IF NOT EXISTS club_candidates (
  id INTEGER PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_region TEXT,
  source_region_name TEXT,
  candidate_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_members_total INTEGER,
  source_members_girls INTEGER,
  source_members_boys INTEGER,
  classification TEXT NOT NULL DEFAULT 'unreviewed',
  review_status TEXT NOT NULL DEFAULT 'pending',
  matched_club_id INTEGER,
  notes TEXT,
  discovered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (matched_club_id) REFERENCES clubs(id)
);
CREATE INDEX IF NOT EXISTS idx_club_candidates_region ON club_candidates(source_region);
CREATE INDEX IF NOT EXISTS idx_club_candidates_match ON club_candidates(matched_club_id);

CREATE TABLE IF NOT EXISTS club_claims (
  id INTEGER PRIMARY KEY,
  club_id INTEGER NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS membership_inquiries (
  id INTEGER PRIMARY KEY,
  club_id INTEGER,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  membership_type TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_membership_inquiries_club ON membership_inquiries(club_id);
