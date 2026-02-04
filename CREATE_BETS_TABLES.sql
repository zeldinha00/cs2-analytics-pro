-- ============================================
-- CRIAR TABELAS PARA SISTEMA DE APOSTAS
-- ============================================

-- Tabela de Contas de Caixa por Casa de Apostas
CREATE TABLE IF NOT EXISTS public.cash_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    betting_house TEXT NOT NULL,
    initial_balance DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para garantir uma conta por usuário por casa
    UNIQUE(user_id, betting_house)
);

-- Tabela de Apostas
CREATE TABLE IF NOT EXISTS public.bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    match_id UUID,
    betting_house TEXT NOT NULL,
    bet_amount DECIMAL(10, 2) NOT NULL,
    odd DECIMAL(10, 2) NOT NULL,
    potential_return DECIMAL(10, 2) NOT NULL,
    bet_status TEXT NOT NULL DEFAULT 'PENDING',
    bet_date TIMESTAMPTZ NOT NULL,
    result_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Check constraints para validação
    CHECK (bet_amount > 0),
    CHECK (odd > 0),
    CHECK (potential_return > 0),
    CHECK (bet_status IN ('PENDING', 'WON', 'LOST', 'CANCELLED'))
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON public.bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_betting_house ON public.bets(betting_house);
CREATE INDEX IF NOT EXISTS idx_bets_status ON public.bets(bet_status);
CREATE INDEX IF NOT EXISTS idx_bets_date ON public.bets(bet_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_accounts_user_id ON public.cash_accounts(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;

-- Policies para BETS
-- Usuários podem ver apenas suas próprias apostas
CREATE POLICY "Users can view their own bets"
    ON public.bets
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Usuários podem criar suas próprias apostas
CREATE POLICY "Users can create their own bets"
    ON public.bets
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Usuários podem atualizar suas próprias apostas
CREATE POLICY "Users can update their own bets"
    ON public.bets
    FOR UPDATE
    USING (auth.uid()::text = user_id::text);

-- Usuários podem deletar suas próprias apostas
CREATE POLICY "Users can delete their own bets"
    ON public.bets
    FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Policies para CASH_ACCOUNTS
-- Usuários podem ver apenas suas próprias contas
CREATE POLICY "Users can view their own cash accounts"
    ON public.cash_accounts
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Usuários podem criar suas próprias contas
CREATE POLICY "Users can create their own cash accounts"
    ON public.cash_accounts
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Usuários podem atualizar suas próprias contas
CREATE POLICY "Users can update their own cash accounts"
    ON public.cash_accounts
    FOR UPDATE
    USING (auth.uid()::text = user_id::text);

-- Usuários podem deletar suas próprias contas
CREATE POLICY "Users can delete their own cash accounts"
    ON public.cash_accounts
    FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Comentários nas tabelas
COMMENT ON TABLE public.bets IS 'Tabela para armazenar apostas dos usuários';
COMMENT ON TABLE public.cash_accounts IS 'Tabela para armazenar contas de caixa por casa de apostas';

-- ============================================
-- SCRIPT CONCLUÍDO
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole e Execute
