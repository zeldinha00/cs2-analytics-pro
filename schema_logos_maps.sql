-- ========================================
-- TABELAS DE LOGOS E IMAGENS
-- ========================================

-- Tabela: Team Logos
CREATE TABLE IF NOT EXISTS team_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name VARCHAR(255) NOT NULL UNIQUE,
  logo_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: Map Images
CREATE TABLE IF NOT EXISTS map_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_name VARCHAR(255) NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- INSERTS DE EXEMPLO (EDITE COM AS URLs REAIS)
-- ========================================

INSERT INTO team_logos (team_name, logo_url) VALUES
  ('Liquid', 'https://example.com/liquid-logo.png'),
  ('Falcons', 'https://example.com/falcons-logo.png'),
  ('Imperial', 'https://example.com/imperial-logo.png'),
  ('Shinden', 'https://example.com/shinden-logo.png')
ON CONFLICT (team_name) DO NOTHING;

INSERT INTO map_images (map_name, image_url) VALUES
  ('Nuke', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/nuke.jpg'),
  ('Dust2', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/dust2.jpg'),
  ('Mirage', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/mirage.jpg'),
  ('Inferno', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/inferno.jpg'),
  ('Ancient', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/ancient.jpg'),
  ('Anubis', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/anubis.jpg'),
  ('Vertigo', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/vertigo.jpg'),
  ('Overpass', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/overpass.jpg')
ON CONFLICT (map_name) DO NOTHING;

-- ========================================
-- INSTRUÇÕES PARA POPULAR MANUALMENTE
-- ========================================
/*
1. Acesse o Supabase Dashboard: https://app.supabase.com
2. Vá até SQL Editor e execute o script acima
3. Depois, atualize as URLs no dashboard:
   - Vá para a tabela "team_logos" e edite cada linha com a URL real do logo
   - Vá para a tabela "map_images" e edite com a URL real da imagem

Ou use este formato para INSERT/UPDATE:

UPDATE team_logos SET logo_url = 'https://novo-url.png' WHERE team_name = 'Liquid';
UPDATE map_images SET image_url = 'https://novo-url.jpg' WHERE map_name = 'Nuke';
*/
