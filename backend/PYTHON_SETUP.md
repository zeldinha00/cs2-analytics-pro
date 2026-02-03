# 🐍 Instalação Python - CS2 Demo Parser

## ✅ Script Completo Criado!

O script `parse_demo.py` está pronto e usa:
- **demoparser2** - Parser moderno para CS2
- **pandas** - Manipulação de dados
- **JSON** - Comunicação com Node.js

---

## 📦 PASSO 1: Instalar Python

### Windows

**Verificar se já tem Python:**
```powershell
python --version
```

**Se não tiver, baixar:**
1. Vá em https://www.python.org/downloads/
2. Baixe Python 3.10 ou superior
3. **IMPORTANTE:** Marque "Add Python to PATH"
4. Instale

---

## 📚 PASSO 2: Instalar Bibliotecas

```powershell
cd backend
pip install -r requirements.txt
```

Isso instala:
- `demoparser2` - Parser de CS2
- `pandas` - Análise de dados

**Alternativa (instalação manual):**
```powershell
pip install demoparser2 pandas
```

---

## 🧪 PASSO 3: Testar Script Python

```powershell
# Testar com sua demo
python parse_demo.py "C:\caminho\para\liquid-vs-falcons-m1-nuke.dem"
```

**Output esperado:**
```json
{
  "mapName": "Nuke",
  "teamA": {
    "name": "Liquid",
    "score": 13,
    "side": "CT"
  },
  "teamB": {
    "name": "Falcons",
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
    },
    ...
  ],
  "duration": "48m",
  "tickrate": 64
}
```

---

## 🚀 PASSO 4: Iniciar Backend

```powershell
# Backend vai chamar o Python automaticamente
npm run dev
```

Você verá:
```
🚀 CS2 Analytics Backend - Demo Parser
✅ Servidor rodando em http://localhost:3001
🔥 Pronto para receber demos!
```

---

## 🎮 PASSO 5: Testar Upload

1. Abra http://localhost:3000
2. Login: `admin` / `admin123`
3. Clique "Importar Demos"
4. Arraste sua demo de CS2

**Logs do backend:**
```
📂 Recebido arquivo: liquid-vs-falcons-m1-nuke.dem
📦 Tamanho: 690.90 MB
🐍 Executando script Python...
🎮 Carregando demo...
📊 Extraindo header...
🔄 Extraindo rounds...
💀 Extraindo kills...
💣 Extraindo eventos de bomba...
✅ Parsing completo: 24 rounds
📊 Score: Liquid 13 x 11 Falcons
✅ Parsing completo em 12.34s
```

---

## 🔧 Troubleshooting

### Erro: "python não encontrado"

```powershell
# Verificar instalação
where python

# Adicionar ao PATH manualmente
# Windows: Variáveis de Ambiente > Path > Adicionar C:\Python310
```

### Erro: "demoparser2 not found"

```powershell
pip install demoparser2
```

### Erro: "ModuleNotFoundError: No module named 'pandas'"

```powershell
pip install pandas
```

### Demo não processa

**Verificar se é CS2:**
- Demos de CS:GO não funcionarão
- Demos muito antigas podem ter problemas
- Arquivo corrompido

**Testar manualmente:**
```powershell
python parse_demo.py "sua-demo.dem"
```

Ver erros detalhados no terminal.

### Backend não chama Python

**Verificar Node.js:**
```javascript
// server.js deve ter:
const { spawn } = await import('child_process');
```

**Verificar path do script:**
```javascript
const pythonScript = path.join(__dirname, 'parse_demo.py');
```

---

## 📊 Dados Extraídos

### ✅ Informações Completas
- Mapa
- Times (do filename)
- Score final (calculado dos rounds)
- Todos os rounds
- Vencedor de cada round
- Razão de fim (eliminação, bomba, etc)
- Kills por round
- Bombas plantadas/desarmadas
- Primeiro kill de cada round
- Duração estimada

### ⚠️ Limitações
- Nomes dos times vêm do filename (não do arquivo)
- Jogadores individuais não extraídos (pode adicionar depois)
- Dinheiro por round não incluído (pode adicionar)

---

## 🎯 Status

✅ Script Python completo  
✅ Integração Node.js pronta  
✅ Suporte a CS2  
✅ Pandas para análise  
✅ JSON output  
⏳ Aguardando instalação de dependências  

---

**Instale as bibliotecas e teste! 🚀**

```powershell
cd backend
pip install -r requirements.txt
python parse_demo.py "C:\Users\Roger\Desktop\liquid-vs-falcons-m1-nuke.dem"
```
