-- Políticas RLS para tabela users
-- Execute este SQL no Supabase SQL Editor após executar supabase_schema.sql

-- Permitir acesso anônimo para desenvolvimento
CREATE POLICY "Allow all to read users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update users"
  ON users FOR UPDATE
  USING (true);

CREATE POLICY "Allow all to delete users"
  ON users FOR DELETE
  USING (true);
