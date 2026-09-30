-- Foreign Key and Data Validation Constraints
ALTER TABLE resources ADD CONSTRAINT chk_region CHECK (region IN ('Antarctic', 'Arctic', 'Himalaya', 'Southern Ocean', 'Multiple'));
ALTER TABLE resources ADD CONSTRAINT chk_resource_type CHECK (resource_type IN ('report', 'publication', 'dataset', 'photo', 'video', 'expedition', 'activity'));
ALTER TABLE resources ADD CONSTRAINT chk_availability CHECK (availability IN ('online', 'offline', 'restricted', 'metadata-only'));
