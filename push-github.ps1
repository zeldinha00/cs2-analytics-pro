# Script para fazer push ao GitHub
# Execute: .\push-github.ps1

# Adicionar Git ao PATH
$env:Path += ";C:\Program Files\Git\cmd"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📝 GitHub Push Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar username do GitHub
$username = Read-Host "Digite seu username do GitHub"

if ($username -eq "") {
    Write-Host "❌ Username não pode estar vazio!" -ForegroundColor Red
    exit 1
}

# Confirmar o comando
$repoUrl = "https://github.com/$username/cs2-analytics-pro.git"
Write-Host ""
Write-Host "URL do repositório: $repoUrl" -ForegroundColor Yellow
Write-Host ""

# Executar comandos git
Write-Host "🔄 Conectando ao repositório remoto..." -ForegroundColor Green
git remote add origin $repoUrl

Write-Host "🔄 Renomeando branch para 'main'..." -ForegroundColor Green
git branch -M main

Write-Host "🔄 Fazendo push..." -ForegroundColor Green
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
    Write-Host "📎 Seu repositório: https://github.com/$username/cs2-analytics-pro" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Ir para https://vercel.com"
    Write-Host "2. Importar este repositório"
    Write-Host "3. Depois configurar no Render"
    Write-Host ""
} else {
    Write-Host "❌ Erro ao fazer push!" -ForegroundColor Red
    Write-Host "Verifique se o repositório já existe no GitHub" -ForegroundColor Red
}
