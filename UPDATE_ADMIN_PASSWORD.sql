-- ============================================
-- Atualizar Senha do Admin
-- ============================================
-- Usuário: admin
-- Nova Senha: ZeldinhaDev
-- ============================================

-- IMPORTANTE: Execute este SQL no Supabase Dashboard → SQL Editor

-- Opção 1: Se o usuário admin@cs2analytics.app existe no Supabase Auth
-- Atualize a senha diretamente através do painel:
-- 1. Supabase Dashboard → Authentication → Users
-- 2. Encontre admin@cs2analytics.app
-- 3. Clique nos 3 pontinhos → Reset Password
-- 4. Defina a nova senha: ZeldinhaDev

-- OU execute via SQL (mais direto):

-- Primeiro, encontre o UUID do admin
SELECT id, email FROM auth.users WHERE email = 'admin@cs2analytics.app';

-- Depois, atualize a senha (substitua o UUID abaixo pelo UUID retornado)
-- NOTA: Você precisa fazer isso através da UI do Supabase ou via Admin API
-- Não é possível atualizar senhas diretamente via SQL por segurança

-- ============================================
-- ALTERNATIVA: Deletar e recriar o admin
-- ============================================

-- 1. Deletar o admin existente (se existir)
DELETE FROM auth.users WHERE email = 'admin@cs2analytics.app';
DELETE FROM users WHERE username = 'admin';

-- 2. Criar novo admin via interface
-- Vá para: Supabase Dashboard → Authentication → Users
-- Clique em: Add User → Via email
-- Email: admin@cs2analytics.app
-- Password: ZeldinhaDev
-- Auto Confirm User: ✓ (marcar)

-- 3. Inserir na tabela users (o trigger faz isso automaticamente, mas se necessário):
-- INSERT INTO users (id, username, role)
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'admin@cs2analytics.app'),
--   'admin',
--   'ADMIN'
-- );

-- ============================================
-- INSTRUÇÕES PRÁTICAS
-- ============================================

-- Para atualizar a senha do admin:

-- 1. Abra Supabase Dashboard
-- 2. Vá em Authentication → Users
-- 3. Encontre admin@cs2analytics.app
-- 4. Clique nos 3 pontinhos (⋮) ao lado do usuário
-- 5. Selecione "Send password recovery"
-- 6. OU selecione "Edit user" e defina nova senha manualmente:
--    Nova senha: ZeldinhaDev
-- 7. Salve as alterações

-- ============================================
-- VERIFICAR LOGIN
-- ============================================

-- Após atualizar, teste o login na aplicação:
-- Usuário: admin
-- Senha: ZeldinhaDev
