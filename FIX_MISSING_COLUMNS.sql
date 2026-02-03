-- ========================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA MATCHES
-- ========================================

-- Execute este SQL no Supabase SQL Editor para corrigir o problema

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS team_a_id UUID,
ADD COLUMN IF NOT EXISTS team_b_id UUID;

-- Adicionar constraints de chave estrangeira (opcional, mas recomendado)
ALTER TABLE matches
ADD CONSTRAINT fk_team_a FOREIGN KEY (team_a_id) REFERENCES teams(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_team_b FOREIGN KEY (team_b_id) REFERENCES teams(id) ON DELETE SET NULL;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'matches';
