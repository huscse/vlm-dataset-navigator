CREATE SCHEMA IF NOT EXISTS navis;

-- Datasets table
CREATE TABLE IF NOT EXISTS navis.datasets (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    media_base_uri TEXT
);

-- Sequences table
CREATE TABLE IF NOT EXISTS navis.sequences (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES navis.datasets(id),
    scene_token TEXT,
    sensor TEXT,
    UNIQUE(dataset_id, scene_token, sensor)
);

-- Frames table
CREATE TABLE IF NOT EXISTS navis.frames (
    id SERIAL PRIMARY KEY,
    sequence_id INTEGER REFERENCES navis.sequences(id),
    sample_token TEXT,
    media_key TEXT NOT NULL,
    UNIQUE(sequence_id, sample_token)
);

-- Models table
CREATE TABLE IF NOT EXISTS navis.models (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    dims INTEGER NOT NULL
);

-- Embeddings table
CREATE TABLE IF NOT EXISTS navis.embeddings (
    id SERIAL PRIMARY KEY,
    frame_id INTEGER REFERENCES navis.frames(id),
    model_id INTEGER REFERENCES navis.models(id),
    emb JSON NOT NULL,
    UNIQUE(frame_id, model_id)
);

-- Frame objects table
CREATE TABLE IF NOT EXISTS navis.frame_objects (
    id SERIAL PRIMARY KEY,
    frame_id INTEGER REFERENCES navis.frames(id),
    object_type TEXT NOT NULL,
    confidence FLOAT,
    x1 FLOAT,
    y1 FLOAT,
    x2 FLOAT,
    y2 FLOAT
);

-- Frames staging table
CREATE TABLE IF NOT EXISTS navis.frames_staging (
    id SERIAL PRIMARY KEY,
    dataset_slug TEXT,
    scene_token TEXT,
    sensor TEXT,
    sample_token TEXT,
    media_key TEXT NOT NULL
);