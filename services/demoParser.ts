import { Match, TeamSide } from '../types';
import supabaseService from './supabaseService';

const DEBUG = import.meta.env.VITE_DEBUG_LOGS === 'true';
const debugLog = (...args: unknown[]) => {
  if (DEBUG) console.log(...args);
};

/**
 * Service para processar demos através do backend Python
 */

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';  // Backend Node.js

/**
 * Processa arquivo .dem através do backend parser
 */
export const processDemoFile = async (file: File, id: string): Promise<Match> => {
  debugLog('📤 [PASSO 1] Enviando demo para o backend:', file.name);
  
  try {
    // Criar FormData com o arquivo
    const formData = new FormData();
    formData.append('demo', file);

    // Enviar para o backend
    debugLog('📤 [PASSO 2] Iniciando fetch para backend...');
    const response = await fetch(`${BACKEND_URL}/api/parse-demo`, {
      method: 'POST',
      body: formData
    });

    debugLog('📤 [PASSO 3] Response recebido:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erro do backend:', error);
      
      // Mensagem específica para CS2
      if (error.solution) {
        throw new Error(`${error.error}\n\n${error.solution}\n\nArquivo: ${error.fileType || 'desconhecido'}`);
      }
      
      throw new Error(error.details || 'Erro ao processar demo');
    }

    const result = await response.json();
    debugLog('✅ [PASSO 4] Demo processada com sucesso:', result.parseTime);
    debugLog('📊 [PASSO 5] Dados extraídos:', result.data);

    // Converter dados do backend para o formato Match
    const backendData = result.data;
    
    // Usar ID real da partida se disponível, senão usar o ID gerado
    const matchId = backendData.matchId || id;
    if (backendData.matchId) {
      debugLog('🆔 [PASSO 5.1] Usando Match ID real da demo:', backendData.matchId);
    } else {
      debugLog('🆔 [PASSO 5.1] Match ID não disponível, usando ID gerado:', id);
    }
    
    debugLog('📝 [PASSO 6] Times extraídos:', {
      teamA: backendData.teamA.name,
      teamB: backendData.teamB.name,
      scoreA: backendData.teamA.score,
      scoreB: backendData.teamB.score
    });
    
    // Buscar logos e imagens do banco
    debugLog('🔍 [PASSO 7] Iniciando busca de logos e imagens...');
    debugLog('   Verificando supabaseService:', supabaseService ? '✓ Disponível' : '✗ Não disponível');
    
    try {
      debugLog('🔍 [PASSO 8.1] Buscando logo de Team A:', backendData.teamA.name);
      const teamALogo = await supabaseService.getTeamLogo(backendData.teamA.name);
      debugLog('✅ [PASSO 8.1 RESULTADO]:', teamALogo || '(nenhuma logo encontrada)');
      
      debugLog('🔍 [PASSO 8.2] Buscando logo de Team B:', backendData.teamB.name);
      const teamBLogo = await supabaseService.getTeamLogo(backendData.teamB.name);
      debugLog('✅ [PASSO 8.2 RESULTADO]:', teamBLogo || '(nenhuma logo encontrada)');
      
      debugLog('🔍 [PASSO 8.3] Buscando imagem de mapa:', formatMapName(backendData.mapName));
      const mapImage = await supabaseService.getMapImage(formatMapName(backendData.mapName));
      debugLog('✅ [PASSO 8.3 RESULTADO]:', mapImage || '(nenhuma imagem encontrada)');
      
      debugLog('🎨 [PASSO 9] URLs finais:', {
        teamA: `${backendData.teamA.name} → ${teamALogo || '(sem logo)'}`,
        teamB: `${backendData.teamB.name} → ${teamBLogo || '(sem logo)'}`,
        map: `${formatMapName(backendData.mapName)} → ${mapImage || '(usando fallback)'}`
      });

      const match: Match = {
        id: matchId,
        mapName: formatMapName(backendData.mapName),
        mapImage: mapImage || `https://picsum.photos/seed/cs2-${formatMapName(backendData.mapName).toLowerCase()}/800/400`,
        date: new Date(file.lastModified).toLocaleDateString('pt-BR'),
        teamA: {
          id: crypto.randomUUID(), // UUID válido
          name: backendData.teamA.name,
          side: backendData.teamA.side as TeamSide,
          score: backendData.teamA.score,
          logo: teamALogo || undefined
        },
        teamB: {
          id: crypto.randomUUID(), // UUID válido
          name: backendData.teamB.name,
          side: backendData.teamB.side as TeamSide,
          score: backendData.teamB.score,
          logo: teamBLogo || undefined
        },
        rounds: backendData.rounds.map((r: any) => ({
          number: r.number,
          winnerSide: r.winnerSide as TeamSide,
          endReason: r.endReason,
          duration: r.duration,
          bombPlanted: r.bombPlanted,
          totalKills: r.totalKills,
          firstKillSide: r.firstKillSide as TeamSide,
          ctMoney: 0,
          tMoney: 0
        })),
        duration: backendData.duration,
        uploadedAt: new Date().toISOString()
      };

      debugLog('✅ [PASSO 10] Match criado:', match);
      return match;

    } catch (logoError) {
      console.error('❌ [ERRO NA BUSCA DE LOGOS]:', logoError);
      throw logoError;
    }

  } catch (error: any) {
    console.error('❌ [ERRO GERAL]:', error);
    
    // Se o backend não estiver rodando, mostrar erro claro
    if (error.message.includes('fetch')) {
      throw new Error('Backend não está rodando! Execute: cd backend && npm run dev');
    }
    
    throw error;
  }
};

/**
 * Verifica se o backend está rodando
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    debugLog('✅ Backend status:', data.status);
    return data.status === 'ok';
  } catch (error) {
    console.error('❌ Backend não está respondendo');
    return false;
  }
};

/**
 * Formatar nome do mapa
 */
function formatMapName(rawName: string): string {
  // Remover prefixo 'de_' ou 'cs_'
  const mapName = rawName.replace(/^(de_|cs_)/, '');
  
  // Capitalizar primeira letra
  return mapName.charAt(0).toUpperCase() + mapName.slice(1);
}
