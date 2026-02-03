# 📍 PRÓXIMOS PASSOS - GitHub e Deploy

## ✅ Status Atual
- ✅ Git inicializado localmente
- ✅ Arquivo commitado
- 🔄 Próximo: Criar repositório no GitHub

---

## 📝 PASSO 1: Criar Repositório no GitHub

### 1.1. Acesse GitHub
Abra: https://github.com/new

### 1.2. Preencha os dados
- **Repository name**: `cs2-analytics-pro`
- **Description**: `CS2 Analytics Pro - Demo Parser com React + Node.js`
- **Visibility**: Private (ou Public, sua escolha)
- **Initialize this repository with**: 
  - ❌ Desmarque "Add a README file"
  - ❌ Desmarque ".gitignore"
  - ❌ Desmarque "License"

### 1.3. Clique em "Create repository"

---

## 🔗 PASSO 2: Conectar e Fazer Push

Depois de criar o repositório, você verá uma página com os comandos. **Execute no PowerShell**:

```powershell
# Adicionar o remote
$env:Path += ";C:\Program Files\Git\cmd"
git remote add origin https://github.com/SEU_USUARIO/cs2-analytics-pro.git

# Renomear branch para main
git branch -M main

# Fazer push
git push -u origin main
```

**Substitua `SEU_USUARIO` pelo seu username do GitHub!**

---

## 🚀 PASSO 3: Frontend no Vercel

### 3.1. Acesse https://vercel.com
- Clique em **Sign Up**
- Escolha **Continue with GitHub**
- Autorize o Vercel

### 3.2. Import Project
1. Clique em **Add New Project**
2. Selecione **Import Git Repository**
3. Procure `cs2-analytics-pro`
4. Clique em **Import**

### 3.3. Configure o Build
Vercel detecta Vite automaticamente. Confirme:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3.4. Environment Variables
Clique em **Environment Variables** e adicione:

```
VITE_SUPABASE_URL = https://ygwzooovjfltqdqksgqe.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3pvb292amZsdHFkcWtzZ3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMzIzMzgsImV4cCI6MjA4NDcwODMzOH0.u2Q242QR4DhBCW7BqQtL66oz4eykinkwXf2VbIw-Ats
VITE_API_URL = (deixaremos vazio por enquanto)
```

### 3.5. Deploy!
Clique em **Deploy**

**Aguarde 2-3 minutos** e copie a URL gerada (ex: `https://cs2-analytics-pro.vercel.app`)

---

## ⚙️ PASSO 4: Backend no Render

### 4.1. Acesse https://render.com
- Clique em **Get Started**
- Escolha **Sign in with GitHub**
- Autorize o Render

### 4.2. Criar Web Service
1. Clique em **New +**
2. Escolha **Web Service**
3. Conecte seu repositório `cs2-analytics-pro`
4. Clique em **Connect**

### 4.3. Configure o Service

Preencha com os seguintes valores:

| Campo | Valor |
|-------|-------|
| **Name** | `cs2-analytics-backend` |
| **Region** | `Oregon (US West)` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && pip install -r requirements.txt` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

### 4.4. Environment Variables

Adicione:

```
NODE_ENV = production
PORT = 3002
SUPABASE_URL = https://ygwzooovjfltqdqksgqe.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3pvb292amZsdHFkcWtzZ3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMzIzMzgsImV4cCI6MjA4NDcwODMzOH0.u2Q242QR4DhBCW7BqQtL66oz4eykinkwXf2VbIw-Ats
CORS_ORIGINS = https://cs2-analytics-pro.vercel.app
```

### 4.5. Criar Service
Clique em **Create Web Service**

**Aguarde 5-10 minutos** (Python demora mais que Node)

Copie a URL gerada (ex: `https://cs2-analytics-backend.onrender.com`)

---

## 🔗 PASSO 5: Conectar Frontend ao Backend

### 5.1. Voltar ao Vercel
1. https://vercel.com/dashboard
2. Selecione seu projeto
3. Clique em **Settings** → **Environment Variables**
4. Edite `VITE_API_URL`:
   ```
   https://cs2-analytics-backend.onrender.com
   ```
5. Clique em **Save**

### 5.2. Redeploy
1. Clique em **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Escolha **Redeploy**

**Aguarde 2 minutos...**

---

## 🎊 PRONTO!

Suas URLs finais:
- 🎨 **Frontend**: https://cs2-analytics-pro.vercel.app
- ⚙️ **Backend**: https://cs2-analytics-backend.onrender.com
- 🗄️ **Database**: Supabase (já configurado)

---

## 📌 Comandos Rápidos do Git

```powershell
# Adicionar PATH do git
$env:Path += ";C:\Program Files\Git\cmd"

# Fazer alterações
git add .
git commit -m "Descrição das mudanças"
git push

# Verificar status
git status
git log

# Ver branches
git branch -a
```

---

## ⚠️ Limitações Gratuitas

| Serviço | Limite |
|---------|--------|
| **Render** | 750 horas/mês + hiberna após 15min |
| **Vercel** | 100GB bandwidth/mês |
| **Supabase** | 500MB database |

---

**Qualquer dúvida, verifique o arquivo `DEPLOY.md` para mais detalhes!**
