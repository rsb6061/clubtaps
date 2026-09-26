ALTER TABLE clubs ADD COLUMN google_place_id TEXT;
ALTER TABLE clubs ADD COLUMN image_provider TEXT;
ALTER TABLE clubs ADD COLUMN image_status TEXT NOT NULL DEFAULT 'missing';
ALTER TABLE clubs ADD COLUMN image_source_url TEXT;
ALTER TABLE clubs ADD COLUMN image_license TEXT;
ALTER TABLE clubs ADD COLUMN image_attribution TEXT;
ALTER TABLE clubs ADD COLUMN image_attribution_url TEXT;
ALTER TABLE clubs ADD COLUMN image_checked_at TEXT;

CREATE INDEX IF NOT EXISTS idx_clubs_google_place_id ON clubs(google_place_id);
CREATE INDEX IF NOT EXISTS idx_clubs_image_status ON clubs(image_status);
