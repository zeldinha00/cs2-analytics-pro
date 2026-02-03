-- CS2 Analytics Pro - Database Schema for Supabase
-- Execute this SQL in your Supabase SQL Editor to set up the database
-- ORDEM CORRIGIDA: matches -> teams -> rounds

-- Create Users table (for Auth integration)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'USER')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Matches table (PRIMEIRO - sem foreign keys)
CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(255) PRIMARY KEY,
  map_name VARCHAR(255) NOT NULL,
  map_image TEXT,
  date VARCHAR(100) NOT NULL,
  tournament_name VARCHAR(255),
  duration VARCHAR(50),
  file_name VARCHAR(255),
  uploaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Teams table (SEGUNDO - referencia matches)
CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(255) PRIMARY KEY,
  match_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  side VARCHAR(50) NOT NULL CHECK (side IN ('CT', 'T')),
  score INT NOT NULL,
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- Create Rounds table (TERCEIRO - referencia matches)
CREATE TABLE IF NOT EXISTS rounds (
  id VARCHAR(255) PRIMARY KEY,
  match_id VARCHAR(255) NOT NULL,
  number INT NOT NULL,
  winner_side VARCHAR(50) NOT NULL CHECK (winner_side IN ('CT', 'T')),
  end_reason VARCHAR(255) NOT NULL,
  duration VARCHAR(50),
  bomb_planted BOOLEAN DEFAULT FALSE,
  total_kills INT DEFAULT 0,
  first_kill_side VARCHAR(50) CHECK (first_kill_side IN ('CT', 'T')),
  ct_money INT DEFAULT 0,
  t_money INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_map_name ON matches(map_name);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_name ON matches(tournament_name);
CREATE INDEX idx_rounds_match_id ON rounds(match_id);
CREATE INDEX idx_rounds_number ON rounds(number);
CREATE INDEX idx_teams_match_id ON teams(match_id);

-- Enable Row Level Security (RLS) - PERMITIR ACESSO SEM AUTENTICAÇÃO
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas - permitir acesso anônimo para desenvolvimento
CREATE POLICY "Allow all to read matches"
  ON matches FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert matches"
  ON matches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update matches"
  ON matches FOR UPDATE
  USING (true);

CREATE POLICY "Allow all to delete matches"
  ON matches FOR DELETE
  USING (true);

CREATE POLICY "Allow all to read teams"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert teams"
  ON teams FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update teams"
  ON teams FOR UPDATE
  USING (true);

CREATE POLICY "Allow all to delete teams"
  ON teams FOR DELETE
  USING (true);

CREATE POLICY "Allow all to read rounds"
  ON rounds FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert rounds"
  ON rounds FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update rounds"
  ON rounds FOR UPDATE
  USING (true);

CREATE POLICY "Allow all to delete rounds"
  ON rounds FOR DELETE
  USING (true);
