# 🔐 Configuração do Sistema de Usuários - CS2 Analytics

## ⚠️ Problema Identificado

Erro `422 (Unprocessable Content)` ao criar usuário via Supabase Auth.

**Causa**: O domínio `@cs2analytics.local` não é aceito pelo Supabase Auth (domínio inválido).

**Solução**: Alterado para `@cs2analytics.app` (domínio válido).

---

## 📋 Checklist de Configuração do Supabase

### 1️⃣ Verificar se a tabela `users` existe

No **Supabase Dashboard** → **Table Editor**:

- [ ] Confirme que a tabela `users` existe
- [ ] Verifique as colunas: `id (UUID)`, `username`, `role`, `created_at`, `updated_at`

Se não existir, execute o SQL em `supabase_schema.sql` (linhas 6-12).

---

### 2️⃣ Aplicar Políticas RLS na tabela `users`

No **Supabase Dashboard** → **SQL Editor**, execute o arquivo:

```sql
-- users_policies.sql
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
```

---

### 3️⃣ Configurar Supabase Auth

No **Supabase Dashboard** → **Authentication** → **Providers**:

#### ✅ Email Provider (OBRIGATÓRIO)

1. Clique em **Email**
2. **Enable Email provider**: ✅ **Marcar** (OBRIGATÓRIO)
3. **Confirm email**: ❌ **Desmarcar** (para desenvolvimento)
   - **IMPORTANTE**: Se deixar marcado, usuários precisarão confirmar email antes de logar
4. Clicar em **Save**

**Sem este passo, você receberá erro: "Email signups are disabled"**

#### ✅ Senha Fraca (Desenvolvimento)

- [ ] **Minimum Password Length**: `6` (padrão é 6)
- [ ] Aceite senhas simples como `123456` ou `senha123`

#### ✅ Site URL (opcional)

- [ ] **Site URL**: `http://localhost:5173` (URL do frontend Vite)

---

### 4️⃣ Testar Criação de Usuário

1. **Iniciar Frontend**:
   ```powershell
   npm run dev
   ```

2. **Login como Admin**:
   - Usuário: `admin`
   - Senha: `admin123`

3. **Ir para Usuários**:
   - Menu lateral → **Usuários**

4. **Verificar Status Supabase**:
   - Deve aparecer **"Supabase: Online"** no canto superior direito

5. **Criar Usuário de Teste**:
   - Usuário: `teste`
   - Senha: `teste123`
   - Função: `USER` (Usuário - Leitura)
   - Clicar em **Salvar**

6. **Verificar Sucesso**:
   - ✅ **Console**: deve aparecer `✅ Usuário criado no Supabase: teste`
   - ✅ **Supabase Dashboard** → **Authentication** → **Users**: deve aparecer `teste@cs2analytics.app`
   - ✅ **Supabase Dashboard** → **Table Editor** → **users**: deve aparecer o registro do usuário
   - ✅ **Listagem de Usuários**: deve aparecer o usuário `teste` na tabela

---

## 🔍 Validação e Troubleshooting

### ✅ Como verificar se está usando Supabase ou localStorage?

**No Console do Navegador (F12)**:

- Se aparecer `✅ Supabase Auth - Usuário logado:` → Usando Supabase ✅
- Se aparecer `✅ Local Auth - Usuário logado:` → Usando localStorage (fallback) ⚠️

**Na criação de usuário**:

- Se aparecer `✅ Usuário criado no Supabase: <nome>` → Sucesso ✅
- Se aparecer `⚠️ Supabase user creation failed, using local fallback:` → Erro, usando localStorage ⚠️

---

### 🐛 Erros Comuns

#### ❌ Erro 400: Email signups are disabled

**Causa**: Cadastro de novos usuários via email está desativado no Supabase.

**Solução**:
1. **Supabase Dashboard** → **Authentication** → **Providers**
2. Clique em **Email**
3. **Enable Email provider**: ✅ **Marcar**
4. **Confirm email**: ❌ **Desmarcar** (para desenvolvimento)
5. Clicar em **Save**

**Screenshot do que procurar**:
```
Authentication > Providers
├── Email ← CLICAR AQUI
│   ├── [✓] Enable Email provider ← ATIVAR
│   ├── [ ] Confirm email ← DESATIVAR
│   └── [Save]
```

---

#### ❌ Erro 422: Unprocessable Content

**Causa**: Domínio de email inválido (`.local` não é aceito).

**Solução**: Código já corrigido para usar `@cs2analytics.app`.

---

#### ❌ Erro: "new row violates row-level security policy"

**Causa**: Políticas RLS bloqueando inserção na tabela `users`.

**Solução**: Execute `users_policies.sql` no SQL Editor do Supabase.

---

#### ❌ Erro: "Email confirmations are required"

**Causa**: Confirmação de email está ativada.

**Solução**:
1. **Supabase Dashboard** → **Authentication** → **Settings**
2. **Email Auth Provider** → **Confirm email** → ❌ **Desativar**

---

#### ❌ Indicador mostra "Supabase: Offline"

**Causa**: Sem conectividade ou políticas RLS bloqueando `SELECT`.

**Solução**:
1. Verificar URL e chave do Supabase em `services/supabase.ts`
2. Executar `users_policies.sql` para permitir leitura
3. Verificar se a tabela `users` existe

---

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Autenticação Híbrido

- **Primário**: Supabase Auth + Tabela `users`
- **Fallback**: localStorage (se Supabase estiver offline ou dar erro)

### ✅ Proteção de Rotas

- **Usuários comuns (USER)**: Acesso apenas a Dashboard, Partidas e Análise de Partidas
- **Administradores (ADMIN)**: Acesso total (Importar Demo, Ajustar Scores, Usuários)

### ✅ Indicadores de Status

- **Backend**: Mostra se o backend de parsing está online (porta 3002)
- **Supabase**: Mostra se o Supabase está acessível (na página Usuários)

### ✅ Alerta de Acesso Negado

- Banner vermelho aparece quando usuário comum tenta acessar área de admin
- Auto-dismiss após 3 segundos

---

## 📝 Próximos Passos (Opcional)

1. **Proteger Backend** (`/api/parse-demo`):
   - Adicionar middleware de autenticação
   - Aceitar apenas requisições com token de admin

2. **Email Real** (Produção):
   - Configurar SMTP no Supabase
   - Ativar confirmação de email
   - Templates de email customizados

3. **Políticas RLS mais Restritivas**:
   - Permitir apenas admins criarem/editarem usuários
   - Usuários comuns apenas leem seus próprios dados

---

## 🚀 Comandos Úteis

```powershell
# Frontend (Vite)
npm run dev

# Backend (Parser de Demos)
cd backend
npm run dev

# Ver logs do Supabase
# Supabase Dashboard → Logs & Analytics
```

---

## 📞 Suporte

Se ainda houver problemas:

1. Abra o **Console do Navegador (F12)** e copie os erros
2. Verifique o **Supabase Dashboard** → **Logs** para ver erros do servidor
3. Confirme que todas as políticas RLS foram aplicadas
4. Verifique se a confirmação de email está **desativada**
