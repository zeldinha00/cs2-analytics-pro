import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// CORS Origins - suporta múltiplas origens separadas por vírgula
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

// Configurar CORS para permitir requests do frontend
app.use(cors({
  origin: allowedOrigins,
  methods: ['POST', 'GET', 'PUT', 'PATCH'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CS2 Analytics Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Configurar multer para upload de arquivos
const upload = multer({
  dest: 'uploads/',
  limits: { 
    fileSize: 1000 * 1024 * 1024, // 1GB max (demos podem ser grandes)
    files: 1
  }
});

// Criar pasta uploads se não existir
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

/**
 * Endpoint para fazer parsing de arquivo .dem usando script Python
 */
app.post('/api/parse-demo', upload.single('demo'), async (req, res) => {
  const startTime = Date.now();
  
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  console.log('📂 Recebido arquivo:', req.file.originalname);
  console.log('📦 Tamanho:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');

  try {
    const demoPath = req.file.path;
    const originalFilename = req.file.originalname;
    
    // Executar script Python para processar a demo
    console.log('🐍 Executando script Python...');
    
    const { spawn } = await import('child_process');
    const pythonScript = path.join(__dirname, 'parse_demo.py');
    
    // Executar: python parse_demo.py <arquivo.dem> <nome_original.dem>
    // Passar o nome original para que o Python possa extrair os nomes dos times
    const pythonProcess = spawn('python', [pythonScript, demoPath, originalFilename]);
    
    let dataString = '';
    let errorString = '';
    
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
      console.error('Python stderr:', data.toString());
    });
    
    pythonProcess.on('close', (code) => {
      // Limpar arquivo temporário
      if (fs.existsSync(demoPath)) {
        fs.unlinkSync(demoPath);
      }
      
      if (code !== 0) {
        console.error('❌ Python script falhou:', errorString);
        return res.status(500).json({ 
          error: 'Erro ao processar demo com Python',
          details: errorString
        });
      }
      
      try {
        // Parse do JSON retornado pelo Python
        const matchData = JSON.parse(dataString);
        
        const parseTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Parsing completo em ${parseTime}s`);
        console.log(`📊 Total de rounds: ${matchData.rounds?.length || 0}`);
        
        res.json({
          success: true,
          data: matchData,
          parseTime: parseTime + 's'
        });
        
      } catch (parseError) {
        console.error('❌ Erro ao parsear JSON do Python:', parseError);
        res.status(500).json({ 
          error: 'Erro ao parsear resultado do Python',
          details: parseError.message,
          output: dataString
        });
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    
    // Limpar arquivo temporário
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: 'Erro ao processar arquivo',
      details: error.message 
    });
  }
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CS2 Analytics Backend is running',
    version: '1.0.0'
  });
});

// Endpoint para atualizar scores/lados de um match (ajuste manual)
// Este endpoint apenas faz ACK, a atualização real é feita pelo frontend no Supabase
app.put('/api/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { teamA_score, teamB_score, teamA_side, teamB_side } = req.body;

    console.log(`✏️  Match update request:`, id);
    console.log(`   Team A: ${teamA_score} (${teamA_side})`);
    console.log(`   Team B: ${teamB_score} (${teamB_side})`);

    // Retornar sucesso (a atualização real será feita pelo frontend)
    res.json({ 
      status: 'ok',
      message: 'Requisição de atualização recebida',
      matchId: id
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ 
      error: 'Erro ao processar requisição',
      details: error.message 
    });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log('🎮 CS2 Analytics Backend - Demo Parser');
  console.log('🚀 ========================================');
  console.log('');
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`📡 Endpoint: POST /api/parse-demo`);
  console.log(`💚 Health: GET /api/health`);
  console.log(`🌐 CORS: ${allowedOrigins.join(', ')}`);
  console.log('');
  console.log('🔥 Pronto para receber demos!');
  console.log('');
});
