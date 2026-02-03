# Debug: Ativar logs verbosos e verificar rounds

## 1. Ativar Debug Logs no navegador
Abra o arquivo `.env.local` (ou crie um) na raiz do projeto:

```
VITE_DEBUG_LOGS=true
```

Recarregue a página (`F5`). Abra o console (`F12`) e procure por:
- `📊 X matches carregados`
- `📍 Y rounds carregados`
- `🔍 Match XXX: procurando teams`
- `📍 Rounds encontrados para XXX: N`

Isso mostrará se os rounds estão sendo buscados do banco e quantos foram encontrados.

## 2. Rodar script de debug (opcional)
Se quiser verificar diretamente do Supabase (requer Node.js):

```bash
npx ts-node debug_rounds.ts
```

Isso vai:
- Contar total de matches e rounds no banco
- Listar os primeiros 5 matches e quantos rounds cada um tem
- Mostrar quais matches estão sem rounds

## 3. O que pode estar errado:
- **Rounds com match_id diferente**: A coluna `match_id` nos rounds não corresponde ao `id` dos matches
- **Rounds não foram salvos**: `createMatch()` falhou silenciosamente ao inserir rounds
- **Match ID mismatch**: Um match foi salvo com um ID mas os rounds com outro

Recarregue com DEBUG_LOGS=true e copie aqui a saída do console do navegador que começa com "📊" e "📍".
