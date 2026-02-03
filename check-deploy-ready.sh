#!/bin/bash

echo "🔍 Verificando se o projeto está pronto para deploy..."
echo ""

# Verificar arquivos necessários
echo "📋 Verificando arquivos de configuração:"

files=(".env.example" "vercel.json" "backend/.env.example" ".gitignore" "DEPLOY.md")

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file - FALTANDO!"
  fi
done

echo ""
echo "🔧 Verificando dependências:"

# Verificar package.json
if [ -f "package.json" ]; then
  echo "✅ Frontend package.json"
else
  echo "❌ Frontend package.json - FALTANDO!"
fi

if [ -f "backend/package.json" ]; then
  echo "✅ Backend package.json"
else
  echo "❌ Backend package.json - FALTANDO!"
fi

if [ -f "backend/requirements.txt" ]; then
  echo "✅ Backend requirements.txt (Python)"
else
  echo "❌ Backend requirements.txt - FALTANDO!"
fi

echo ""
echo "📝 Próximos passos:"
echo "1. git init (se ainda não fez)"
echo "2. git add ."
echo "3. git commit -m 'Prepare for deployment'"
echo "4. Criar repo no GitHub"
echo "5. git push"
echo "6. Seguir o guia DEPLOY.md"
echo ""
echo "📖 Leia o arquivo DEPLOY.md para instruções completas!"
