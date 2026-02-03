# 🚀 GUIA RÁPIDO - Primeiros Passos com Supabase

## ⏱️ Tempo Total: ~15 minutos

---

## PASSO 1: Criar as Tabelas no Supabase (5 min)

### 1.1 Acesse o Supabase
```
https://supabase.com/dashboard
```

### 1.2 Selecione seu projeto
```
Clique em: ygwzooovjfltqdqksgqe
```

### 1.3 Abra o SQL Editor
```
Sidebar esquerdo → SQL Editor
```

### 1.4 Execute o Schema
```
1. Clique em "New Query" (+ botão vermelho)
2. Copie TODO o conteúdo do arquivo: supabase_schema.sql
3. Cole no editor
4. Clique em "RUN" (ou Ctrl+Enter)
5. Aguarde a execução
```

### 1.5 Verifique se funcionou
```
Vá para: Database → Tables
Você deve ver 4 tabelas:
  ✅ matches
  ✅ teams  
  ✅ rounds
  ✅ users
```

**✅ PASSO 1 CONCLUÍDO!**

---

## PASSO 2: Testar no Aplicativo (10 min)

### 2.1 Abra a aplicação
```bash
# No terminal do seu projeto
npm run dev

# Deve abrir em: http://localhost:5173
```

### 2.2 Login
```
Username: admin
Password: admin123

Clique em: "ENTRAR"
```

### 2.3 Vá para "Importar Demos"
```
Sidebar esquerdo → Importar Demos

Ou clique no ícone de Upload
```

### 2.4 Upload de um arquivo .dem
```
1. Você pode usar qualquer arquivo .dem (ou criar um dummy)
2. Clique na área ou arraste o arquivo
3. Exemplo: imperial-vs-shinden-m1-nuke-p1.dem

Sistema vai:
  - Ler o arquivo
  - Processar dados
  - Salvar no Supabase
  - Mostrar progresso
```

### 2.5 Aguarde completar
```
Status deve mudar para: ✅ CONCLUÍDO

Tempo estimado: 2-3 segundos
```

### 2.6 Volte ao Dashboard
```
Clique em: Dashboard (sidebar)

Ou clique no logo no topo

Seu novo match deve aparecer! 🎉
```

**✅ PASSO 2 CONCLUÍDO!**

---

## PASSO 3: Confirmar no Supabase (Opcional, 5 min)

### 3.1 Abra SQL Editor
```
Supabase Dashboard → SQL Editor → New Query
```

### 3.2 Execute esta query
```sql
SELECT * FROM matches;
```

### 3.3 Você deve ver:
```
1 row (ou mais se uploadeou vários)

id, map_name, date, duration, etc
```

### 3.4 Verifique as teams
```sql
SELECT * FROM teams;
```

Deve mostrar 2 teams por match (CT e T)

### 3.5 Verifique os rounds
```sql
SELECT * FROM rounds;
```

Deve mostrar 13-30 rounds por match

**✅ PASSO 3 CONCLUÍDO!**

---

## 🎯 Resumo do Que Aconteceu

```
Arquivo .dem foi lido
        ↓
Dados foram processados (times, mapa, rounds)
        ↓
Sistema criou objeto Match estruturado
        ↓
supabaseService.createMatch() foi chamado
        ↓
Dados foram INSERT no Supabase:
  - 2 teams foram criadas
  - 1 match foi criado
  - 13-30 rounds foram criadas
        ↓
Dashboard carregou dados do banco
        ↓
Novo match apareceu na UI ✅
```

---

## 🔍 Se Algo Deu Errado...

### ❌ "Tabelas não encontradas"
**Solução:** Execute o arquivo `supabase_schema.sql` completo no SQL Editor

### ❌ "Erro ao conectar Supabase"
**Solução:** Verifique as credenciais em `services/supabase.ts`
```typescript
const SUPABASE_URL = 'https://ygwzooovjfltqdqksgqe.supabase.co';
// Deve ser igual acima
```

### ❌ "Match não aparece no Dashboard"
**Solução:**
1. Abra DevTools (F12)
2. Vá para Console
3. Execute:
```javascript
const matches = await supabaseService.getAllMatches();
console.log(matches);
```
4. Se ver dados, problema é na UI
5. Se vazio, problema é no banco

### ❌ "Auth.signUp não é função"
**Solução:** Ignore este erro! Fallback para localStorage funcionará normalmente

### ❌ "Arquivo não foi processado"
**Solução:** Verifique console para erros específicos

---

## 📊 Verificar Dados Inseridos

### Via Supabase Dashboard

**Matches:**
```
Supabase → Database → Tables → matches
Clique em "matches"
Veja os dados inseridos
```

**Teams:**
```
Database → Tables → teams
Deve ter 2 registros (Team A e Team B) por match
```

**Rounds:**
```
Database → Tables → rounds
Deve ter 13-30 registros por match
```

### Via SQL

**Contar matches:**
```sql
SELECT COUNT(*) FROM matches;
```

**Contar times:**
```sql
SELECT COUNT(*) FROM teams;
```

**Contar rounds:**
```sql
SELECT COUNT(*) FROM rounds;
```

**Ver estrutura completa:**
```sql
SELECT 
  m.id,
  m.map_name,
  m.date,
  COUNT(DISTINCT t.id) as teams,
  COUNT(r.id) as rounds
FROM matches m
LEFT JOIN teams t ON t.match_id = m.id
LEFT JOIN rounds r ON r.match_id = m.id
GROUP BY m.id;
```

---

## 🎓 Entendendo os Dados

### Structure de um Match no Banco

```json
{
  "matches": {
    "id": "match-123",
    "map_name": "Nuke",
    "map_image": "https://...",
    "date": "23/01/2026",
    "team_a_id": "team-a-123",
    "team_b_id": "team-b-123",
    "duration": "1h 12m",
    "file_name": "imperial-vs-shinden-m1-nuke.dem",
    "uploaded_at": "2026-01-23T10:30:00Z"
  },
  "teams": [
    {
      "id": "team-a-123",
      "match_id": "match-123",
      "name": "Imperial",
      "side": "CT",
      "score": 16,
      "logo": null
    },
    {
      "id": "team-b-123",
      "match_id": "match-123",
      "name": "Shinden",
      "side": "T",
      "score": 14,
      "logo": null
    }
  ],
  "rounds": [
    {
      "id": "match-123-round-1",
      "match_id": "match-123",
      "number": 1,
      "winner_side": "CT",
      "end_reason": "Terroristas Eliminados",
      "duration": "1:45",
      "bomb_planted": false,
      "total_kills": 5,
      "first_kill_side": "CT",
      "ct_money": 2400,
      "t_money": 1900
    }
    // ... até 30 rounds
  ]
}
```

---

## ✅ Checklist Final

- [ ] Schema SQL executado no Supabase
- [ ] 4 tabelas visíveis em Database → Tables
- [ ] Aplicação aberta em http://localhost:5173
- [ ] Login realizado (admin/admin123)
- [ ] Arquivo .dem foi uploaded
- [ ] Status mostrou "CONCLUÍDO" ✅
- [ ] Dashboard está mostrando o novo match
- [ ] SQL Query mostra dados no banco
- [ ] Tudo funcionando! 🎉

---

## 🚀 Agora Você Pode...

✅ **Upload de Demos** - Todos os arquivos são salvos no banco
✅ **Visualizar Histórico** - Todos os matches aparecem no Dashboard
✅ **Análises Persistidas** - Dados não são perdidos ao fechar app
✅ **Escalabilidade** - Banco pode armazenar ilimitados de matches
✅ **Compartilhar Dados** - Todos os usuários veem os mesmos matches

---

## 💡 Dicas

1. **Desenvolver Localmente** - App funciona offline (localStorage fallback)
2. **Testar Queries SQL** - Use SQL Editor para explorar dados
3. **Monitorar Performance** - Supabase tem dashboard de métricas
4. **Backup de Dados** - Supabase faz backup automático
5. **Escalar** - Quando precisar, adicione mais índices ou partições

---

## 📞 Precisa de Ajuda?

1. **Verificar Documentação** - `SUPABASE_SETUP.md`
2. **Ver Exemplos** - `EXAMPLES_SUPABASE.ts`
3. **Supabase Docs** - https://supabase.com/docs
4. **Console do Navegador** - F12 para ver logs

---

## 🎉 Pronto!

Você agora tem seu sistema CS2 Analytics integrado com Supabase!

**Status:** ✅ Tudo Configurado e Funcionando

Aproveite! 🚀
