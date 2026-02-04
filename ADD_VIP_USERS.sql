-- ============================================
-- ADICIONAR CAMPO VIP NA TABELA DE USUÁRIOS
-- ============================================

-- Adicionar coluna is_vip na tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;

-- Atualizar comentário da tabela
COMMENT ON COLUMN public.users.is_vip IS 'Indica se o usuário tem acesso VIP (Comparação e Apostas)';

-- Exemplo: Tornar um usuário VIP (substitua 'username' pelo nome do usuário)
-- UPDATE public.users SET is_vip = TRUE WHERE username = 'nome_do_usuario';

-- Ver todos os usuários e seus status VIP
-- SELECT id, username, role, is_vip FROM public.users ORDER BY created_at DESC;

-- ============================================
-- SCRIPT CONCLUÍDO
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole e Execute
