-- Production PostgreSQL Schema for SIH26063 Polar Portal
CREATE TABLE IF NOT EXISTS stations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    region VARCHAR(32) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    elevation_m DOUBLE PRECISION,
    status VARCHAR(64) NOT NULL,
    inaugurated_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS expeditions (
    id VARCHAR(64) PRIMARY KEY,
    expedition_number INT NOT NULL,
    program VARCHAR(64) NOT NULL,
    season VARCHAR(32) NOT NULL,
    leader VARCHAR(128) NOT NULL,
    vessel VARCHAR(128),
    status VARCHAR(32) DEFAULT 'Completed',
    data JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    resource_type VARCHAR(32) NOT NULL,
    region VARCHAR(32) NOT NULL,
    station VARCHAR(64),
    source_owner VARCHAR(200) NOT NULL,
    source_url TEXT NOT NULL,
    publication_date VARCHAR(32),
    description TEXT,
    licence VARCHAR(300) NOT NULL,
    availability VARCHAR(32) DEFAULT 'metadata-only',
    topics JSONB DEFAULT '[]'::jsonb,
    verification VARCHAR(32) DEFAULT 'pending-review',
    sha256 VARCHAR(64),
    filename VARCHAR(128),
    mime_type VARCHAR(64),
    byte_size BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    chunks JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS entity_relationships (
    id SERIAL PRIMARY KEY,
    from_type VARCHAR(32) NOT NULL,
    from_id VARCHAR(64) NOT NULL,
    relation VARCHAR(64) NOT NULL,
    to_type VARCHAR(32) NOT NULL,
    to_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
