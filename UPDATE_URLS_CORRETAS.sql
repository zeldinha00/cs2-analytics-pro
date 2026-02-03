-- ========================================
-- ATUALIZAR URLs CORRETAS NO BANCO
-- ========================================

-- Execute este SQL no Supabase SQL Editor
-- EDITE com as URLs REAIS dos logos e mapas

-- Atualizar logos dos times da demo (Liquid vs Falcons)
UPDATE team_logos SET logo_url = 'https://liquipedia.net/commons/images/c/c8/Liquid_Thistle_Vertical.png' WHERE team_name = 'Liquid';
UPDATE team_logos SET logo_url = 'https://liquipedia.net/commons/images/1/1b/FalconsW_Logo.png' WHERE team_name = 'Falcons';

-- Atualizar imagens dos mapas
UPDATE map_images SET image_url = 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/overpass.jpg' WHERE map_name = 'Overpass';
UPDATE map_images SET image_url = 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/nuke.jpg' WHERE map_name = 'Nuke';
UPDATE map_images SET image_url = 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/dust2.jpg' WHERE map_name = 'Dust2';

-- Verificar se as URLs foram atualizadas
SELECT team_name, logo_url FROM team_logos;
SELECT map_name, image_url FROM map_images;

-- ========================================
-- OU APAGAR E RECRIAR TUDO DO ZERO
-- ========================================

-- Limpar tabelas
DELETE FROM team_logos;
DELETE FROM map_images;

-- Inserir apenas os times e mapas que você usa
INSERT INTO team_logos (team_name, logo_url) VALUES
  ('Liquid', 'https://liquipedia.net/commons/images/c/c8/Liquid_Thistle_Vertical.png'),
  ('Falcons', 'https://liquipedia.net/commons/images/1/1b/FalconsW_Logo.png');

INSERT INTO map_images (map_name, image_url) VALUES
  ('Overpass', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/overpass.jpg'),
  ('Nuke', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/nuke.jpg'),
  ('Dust2', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/dust2.jpg'),
  ('Mirage', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/mirage.jpg'),
  ('Inferno', 'https://raw.githubusercontent.com/andrewda/csgo-map-images/main/inferno.jpg');
