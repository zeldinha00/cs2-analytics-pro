# 🔍 Verificando se o projeto está pronto para deploy
Write-Host ""
Write-Host "📋 Verificando arquivos de configuração:" -ForegroundColor Cyan

$files = @(
    ".env.example",
    "vercel.json", 
    "backend\.env.example",
    ".gitignore",
    "DEPLOY.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - FALTANDO!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔧 Verificando dependências:" -ForegroundColor Cyan

if (Test-Path "package.json") {
    Write-Host "✅ Frontend package.json" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend package.json - FALTANDO!" -ForegroundColor Red
}

if (Test-Path "backend\package.json") {
    Write-Host "✅ Backend package.json" -ForegroundColor Green
} else {
    Write-Host "❌ Backend package.json - FALTANDO!" -ForegroundColor Red
}

if (Test-Path "backend\requirements.txt") {
    Write-Host "✅ Backend requirements.txt (Python)" -ForegroundColor Green
} else {
    Write-Host "❌ Backend requirements.txt - FALTANDO!" -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. git init (se ainda não fez)"
Write-Host "2. git add ."
Write-Host "3. git commit -m 'Prepare for deployment'"
Write-Host "4. Criar repo no GitHub"
Write-Host "5. git push"
Write-Host "6. Seguir o guia DEPLOY.md"
Write-Host ""
Write-Host "📖 Leia o arquivo DEPLOY.md para instruções completas!" -ForegroundColor Cyan
