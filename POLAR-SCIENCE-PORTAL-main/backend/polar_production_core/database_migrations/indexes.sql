-- Search and High-Performance B-Tree / GIN Indexes
CREATE INDEX IF NOT EXISTS idx_resources_region ON resources(region);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_station ON resources(station);
CREATE INDEX IF NOT EXISTS idx_resources_verification ON resources(verification);
CREATE INDEX IF NOT EXISTS idx_resources_topics ON resources USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_resources_fts ON resources USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_relationships_from ON entity_relationships(from_type, from_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON entity_relationships(to_type, to_id);
