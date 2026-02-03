# 🚀 Guia de Deploy - CS2 Analytics Pro

Este guia te levará do zero ao deploy completo (frontend + backend) **gratuitamente**.

---

## 📋 **Pré-requisitos**

- Conta no GitHub
- Conta no Vercel (login com GitHub)
- Conta no Render (login com GitHub)
- Projeto Supabase funcionando

---

## 🔧 **PASSO 1: Preparar o Git**

### 1.1. Inicializar repositório Git (se ainda não fez)

```bash
git init
git add .
git commit -m "Initial commit - CS2 Analytics Pro"
```

### 1.2. Criar repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Nome: `cs2-analytics-pro`
3. Deixe **privado** (ou público, sua escolha)
4. **NÃO** adicione README, .gitignore ou licença
5. Clique em **Create repository**

### 1.3. Conectar e fazer push

```bash
git remote add origin https://github.com/SEU-USUARIO/cs2-analytics-pro.git
git branch -M main
git push -u origin main
```

✅ **Checkpoint**: Seu código deve estar no GitHub agora!

---

## 🎨 **PASSO 2: Deploy do Frontend (Vercel)**

### 2.1. Criar conta no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **Sign Up**
3. Escolha **Continue with GitHub**
4. Autorize o Vercel

### 2.2. Importar projeto

1. No dashboard do Vercel, clique em **Add New Project**
2. Selecione **Import Git Repository**
3. Encontre `cs2-analytics-pro` e clique em **Import**

### 2.3. Configurar build

O Vercel detecta Vite automaticamente. Confirme:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.4. Adicionar variáveis de ambiente

Clique em **Environment Variables** e adicione:

```
VITE_SUPABASE_URL = https://ygwzooovjfltqdqksgqe.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3pvb292amZsdHFkcWtzZ3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMzIzMzgsImV4cCI6MjA4NDcwODMzOH0.u2Q242QR4DhBCW7BqQtL66oz4eykinkwXf2VbIw-Ats
VITE_API_URL = (deixe em branco por enquanto, vamos preencher depois)
```

### 2.5. Deploy!

1. Clique em **Deploy**
2. Aguarde ~2 minutos
3. Copie a URL (ex: `https://cs2-analytics-pro.vercel.app`)

✅ **Checkpoint**: Frontend no ar! Mas backend ainda não funciona.

---

## ⚙️ **PASSO 3: Deploy do Backend (Render)**

### 3.1. Criar conta no Render

1. Acesse [render.com](https://render.com)
2. Clique em **Get Started**
3. Escolha **Sign in with GitHub**
4. Autorize o Render

### 3.2. Criar Web Service

1. No dashboard, clique em **New +**
2. Escolha **Web Service**
3. Conecte seu repositório `cs2-analytics-pro`
4. Clique em **Connect**

### 3.3. Configurar service

Preencha:

- **Name**: `cs2-analytics-backend`
- **Region**: Oregon (US West) - mais próximo
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**:
  ```
  npm install && pip install -r requirements.txt
  ```
- **Start Command**:
  ```
  node server.js
  ```
- **Instance Type**: **Free**

### 3.4. Adicionar variáveis de ambiente

Role até **Environment Variables** e adicione:

```
NODE_ENV = production
PORT = 3002
SUPABASE_URL = https://ygwzooovjfltqdqksgqe.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3pvb292amZsdHFkcWtzZ3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMzIzMzgsImV4cCI6MjA4NDcwODMzOH0.u2Q242QR4DhBCW7BqQtL66oz4eykinkwXf2VbIw-Ats
CORS_ORIGINS = https://cs2-analytics-pro.vercel.app
```

⚠️ **Importante**: Substitua `CORS_ORIGINS` pela URL do seu frontend no Vercel!

### 3.5. Create Web Service

1. Clique em **Create Web Service**
2. Aguarde ~5-10 minutos (Python + Node demora mais)
3. Copie a URL (ex: `https://cs2-analytics-backend.onrender.com`)

✅ **Checkpoint**: Backend no ar!

---

## 🔗 **PASSO 4: Conectar Frontend ao Backend**

### 4.1. Atualizar variável no Vercel

1. Volte ao [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Edite `VITE_API_URL`:
   ```
   VITE_API_URL = https://cs2-analytics-backend.onrender.com
   ```
5. Clique em **Save**

### 4.2. Redesploy do frontend

1. Vá em **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Escolha **Redeploy**
4. Aguarde ~2 minutos

✅ **PRONTO!** Tudo conectado e funcionando!

---

## 🎯 **URLs Finais**

- 🎨 **Frontend**: https://cs2-analytics-pro.vercel.app
- ⚙️ **Backend**: https://cs2-analytics-backend.onrender.com
- 🗄️ **Database**: Supabase (já configurado)

---

## ⚠️ **Limitações do Plano Gratuito**

### Render (Backend)
- ❌ **Hiberna após 15 minutos sem uso**
- ⏱️ Primeira request após hibernar demora ~30-60 segundos
- ✅ Depois volta ao normal
- ✅ 750 horas/mês grátis

### Vercel (Frontend)
- ✅ Sem hibernação
- ✅ 100GB bandwidth/mês
- ✅ Deploys ilimitados

### Supabase
- ✅ 500MB database
- ✅ 2GB bandwidth/mês
- ✅ Pausa após 7 dias de inatividade (reativa instantaneamente)

---

## 🔄 **Atualizações Futuras**

Sempre que fizer mudanças:

```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

- ✅ Vercel faz **deploy automático**
- ✅ Render faz **deploy automático**
- 🎉 Tudo atualiza sozinho!

---

## 🐛 **Troubleshooting**

### Backend não responde
- Espere 60 segundos (pode estar hibernando)
- Confira logs no Render Dashboard

### CORS Error
- Verifique `CORS_ORIGINS` no backend
- Deve conter a URL exata do Vercel

### Build falhou
- Verifique logs no Vercel/Render
- Confirme que `.env` não está no Git

---

## 📞 **Comandos Úteis**

### Ver logs do backend no Render
1. Render Dashboard → Seu service
2. Clique em **Logs** (canto direito superior)

### Forçar rebuild
- **Vercel**: Deployments → Redeploy
- **Render**: Manual Deploy → Deploy latest commit

---

🎊 **Parabéns! Seu projeto está no ar!**
