# 🎮 CS2 Analytics Backend - Demo Parser

Backend Node.js para fazer parsing de arquivos `.dem` do Counter-Strike 2 e extrair todos os dados reais das partidas.

## 📦 Tecnologias

- **Express** - Framework web
- **demofile** - Biblioteca para parsing de demos do CS
- **multer** - Upload de arquivos
- **cors** - Permitir requests do frontend

## 🚀 Instalação

```bash
cd backend
npm install
```

## ▶️ Executar

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

Servidor iniciará em: **http://localhost:3001**

## 📡 Endpoints

### POST /api/parse-demo

Upload e parse de arquivo .dem

**Request:**
```bash
curl -X POST http://localhost:3001/api/parse-demo \
  -F "demo=@path/to/match.dem"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mapName": "de_mirage",
    "teamA": {
      "name": "FaZe Clan",
      "score": 13,
      "side": "CT"
    },
    "teamB": {
      "name": "Natus Vincere",
      "score": 11,
      "side": "T"
    },
    "rounds": [
      {
        "number": 1,
        "winnerSide": "CT",
        "endReason": "Terroristas Eliminados",
        "duration": "1:32",
        "bombPlanted": false,
        "totalKills": 9,
        "firstKillSide": "CT"
      }
    ],
    "players": [...],
    "duration": "42m",
    "tickrate": 64
  },
  "parseTime": "3.45s"
}
```

### GET /api/health

Health check do servidor

**Response:**
```json
{
  "status": "ok",
  "message": "CS2 Analytics Backend is running",
  "version": "1.0.0"
}
```

## 📊 Dados Extraídos

### Match
- ✅ Nome do mapa
- ✅ Nomes dos times
- ✅ Scores finais
- ✅ Duração total
- ✅ Tickrate

### Rounds
- ✅ Número do round
- ✅ Time vencedor (CT/T)
- ✅ Razão de fim (bomba, eliminação, tempo)
- ✅ Duração do round
- ✅ Bomba plantada/desarmada
- ✅ Total de kills
- ✅ Primeiro kill do round

### Players
- ✅ Nome
- ✅ Steam ID
- ✅ Time

### Events
- ✅ Kills (attacker, victim, weapon, headshot)
- ✅ Bomb planted
- ✅ Bomb defused
- ✅ Round start/end

## 🔧 Configuração

O servidor roda na porta **3001** por padrão. Para mudar:

```javascript
const PORT = process.env.PORT || 3001;
```

## 📝 Logs

O servidor exibe logs detalhados:

```
📂 Recebido arquivo: liquid-vs-falcons.dem
📦 Tamanho: 145.23 MB
🎮 Iniciando parsing...
🔵 Round 1 iniciado
💣 Bomba plantada no round 3
✅ Round 1 finalizado - Winner: CT
✅ Parsing completo em 3.45s
📊 Total de rounds: 24
🎯 Score final: Team Liquid 13 x 11 Falcons
```

## 🐛 Troubleshooting

**Erro: "Cannot find module 'demofile'"**
```bash
npm install demofile
```

**Erro: "Port 3001 already in use"**
- Pare o processo usando a porta ou mude no server.js

**Demo não processa:**
- Verifique se o arquivo é um .dem válido do CS2/CSGO
- Tamanho máximo: 500MB

## 🔗 Integração com Frontend

O frontend (React) deve chamar este endpoint:

```typescript
const formData = new FormData();
formData.append('demo', file);

const response = await fetch('http://localhost:3001/api/parse-demo', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

## 📚 Recursos

- [demofile documentation](https://github.com/saul/demofile)
- [Express documentation](https://expressjs.com/)
- [CS2 Demo Format](https://developer.valvesoftware.com/wiki/DEM_Format)
