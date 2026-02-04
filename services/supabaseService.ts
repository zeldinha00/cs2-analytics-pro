import supabase from './supabase';
import { Match, Round, Team, TeamSide, RoundEndReason, DBMatch, DBTeam, DBRound, Bet, DBBet, CashAccount, DBCashAccount, BettingHouse, BetStatus } from '../types';

// Toggle para logs verbosos; defina VITE_DEBUG_LOGS=true para ver logs no console
const DEBUG = import.meta.env.VITE_DEBUG_LOGS === 'true';
const debugLog = (...args: unknown[]) => {
  if (DEBUG) console.log(...args);
};

/**
 * Service para gerenciar todas as operações com o Supabase
 * Funções para inserir, atualizar, buscar matches, teams e rounds
 */

export const supabaseService = {
  // ========== LOGOS & IMAGENS ==========

  /**
   * Busca logo de um time pelo nome
   */
  getTeamLogo: async (teamName: string): Promise<string | null> => {
    try {
      debugLog(`🔍 Buscando logo de "${teamName}" no Supabase...`);
      const { data, error } = await supabase
        .from('team_logos')
        .select('logo_url')
        .ilike('team_name', teamName)
        .single();

      if (error) {
        console.error(`❌ Erro ao buscar logo de ${teamName}:`, error.message);
        return null;
      }
      
      if (!data) {
        console.warn(`⚠️ Logo de "${teamName}" não encontrada no banco`);
        return null;
      }
      
      debugLog(`✅ Logo de "${teamName}" encontrada: ${data.logo_url}`);
      return data.logo_url;
    } catch (error) {
      console.error(`❌ Erro ao buscar logo de ${teamName}:`, error);
      return null;
    }
  },

  /**
   * Busca imagem de um mapa pelo nome
   */
  getMapImage: async (mapName: string): Promise<string | null> => {
    try {
      debugLog(`🔍 Buscando imagem de mapa "${mapName}" no Supabase...`);
      const { data, error } = await supabase
        .from('map_images')
        .select('image_url')
        .ilike('map_name', mapName)
        .single();

      if (error) {
        console.error(`❌ Erro ao buscar imagem de ${mapName}:`, error.message);
        return null;
      }
      
      if (!data) {
        console.warn(`⚠️ Imagem de "${mapName}" não encontrada no banco`);
        return null;
      }
      
      debugLog(`✅ Imagem de "${mapName}" encontrada: ${data.image_url}`);
      return data.image_url;
    } catch (error) {
      console.error(`❌ Erro ao buscar imagem de ${mapName}:`, error);
      return null;
    }
  },

  // ========== MATCHES ==========
  
  /**
   * Insere um novo match completo (com teams e rounds)
   */
  createMatch: async (match: Match): Promise<string | null> => {
    try {
      const now = new Date().toISOString();

      // 1. Criar o match PRIMEIRO (sem foreign keys)
      // Não incluir team_a_id e team_b_id vazios, pois causam erro UUID
      const dbMatch: any = {
        id: match.id,
        map_name: match.mapName,
        map_image: match.mapImage,
        date: match.date,
        tournament_name: match.tournamentName || null, // Nome do campeonato
        duration: match.duration,
        file_name: 'imported',
        uploaded_at: match.uploadedAt,
        created_at: now
        // team_a_id e team_b_id serão atualizados depois
      };

      const { error: matchError } = await supabase
        .from('matches')
        .insert([dbMatch]);

      if (matchError) {
        console.error('❌ Erro ao criar match:', matchError);
        throw matchError;
      }

      debugLog('✅ Match criado no banco:', match.id);

      // 2. Criar as teams (agora o match existe)
      const teamAId = await supabaseService.createTeam({
        id: match.teamA.id,
        name: match.teamA.name,
        side: match.teamA.side,
        score: match.teamA.score,
        logo: match.teamA.logo,
        match_id: match.id,
        created_at: now
      });

      const teamBId = await supabaseService.createTeam({
        id: match.teamB.id,
        name: match.teamB.name,
        side: match.teamB.side,
        score: match.teamB.score,
        logo: match.teamB.logo,
        match_id: match.id,
        created_at: now
      });

      if (!teamAId || !teamBId) {
        throw new Error('Erro ao criar teams');
      }
      debugLog('✅ Teams criados no banco:', teamAId, teamBId);

      // 2.1 Atualizar o match com os IDs das teams
      const { error: updateMatchError } = await supabase
        .from('matches')
        .update({ team_a_id: teamAId, team_b_id: teamBId })
        .eq('id', match.id);
      if (updateMatchError) {
        console.warn('⚠️ Não foi possível atualizar team_a_id/team_b_id no match:', updateMatchError);
      }

      // 3. Criar os rounds
      const dbRounds: DBRound[] = match.rounds.map(r => ({
        id: `${match.id}-round-${r.number}`,
        match_id: match.id,
        number: r.number,
        winner_side: r.winnerSide,
        end_reason: r.endReason,
        duration: r.duration,
        bomb_planted: r.bombPlanted,
        total_kills: r.totalKills,
        first_kill_side: r.firstKillSide,
        ct_money: r.ctMoney,
        t_money: r.tMoney,
        created_at: now
      }));

      // Inserir em lotes para evitar falhas silenciosas em grandes inserts
      const chunkSize = 50;
      for (let i = 0; i < dbRounds.length; i += chunkSize) {
        const chunk = dbRounds.slice(i, i + chunkSize);
        const { error: chunkError } = await supabase
          .from('rounds')
          .insert(chunk);
        if (chunkError) {
          console.error('❌ Erro ao criar rounds (lote):', chunkError);
          throw chunkError;
        }
      }

      // Verificar integridade: contar rounds inseridos
      const { count, error: countError } = await supabase
        .from('rounds')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', match.id);
      if (countError) {
        console.warn('⚠️ Não foi possível contar rounds inseridos:', countError.message);
      } else {
        debugLog(`✅ Rounds inseridos: ${count}/${dbRounds.length} para match ${match.id}`);
        if ((count || 0) !== dbRounds.length) {
          console.warn(`⚠️ Inconsistência detectada: esperados ${dbRounds.length}, encontrados ${count}`);
        }
      }

      debugLog(`✅ ${dbRounds.length} rounds criados no banco`);
      debugLog(`✅ Match salvo no banco com sucesso: ${match.id}`);
      return match.id;
    } catch (error) {
      console.error('Erro ao criar match:', error);
      return null;
    }
  },

  /**
   * Busca todos os matches do banco
   */
  getAllMatches: async (): Promise<Match[]> => {
    try {
      // Buscar todos os matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id, map_name, map_image, date, tournament_name, team_a_id, team_b_id, duration, uploaded_at, created_at')
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;

  debugLog(`📊 ${matchesData.length} matches carregados do banco`);

      // Buscar todas as teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, match_id, name, side, score, logo');

      if (teamsError) throw teamsError;

      debugLog(`👥 ${teamsData.length} teams carregadas do banco`);
      teamsData.forEach(t => {
        debugLog(`  👤 ${t.name} - score: ${t.score}, side: ${t.side}`);
      });

      // Buscar rounds apenas para os matches carregados (em lotes para evitar limite)
      const matchIds = matchesData.map(m => m.id);
      
      // Buscar todos os rounds em lotes de 1000
      let allRoundsData: DBRound[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: roundsBatch, error: roundsError } = await supabase
          .from('rounds')
          .select('id, match_id, number, winner_side, end_reason, duration, bomb_planted, total_kills, first_kill_side, ct_money, t_money, created_at')
          .in('match_id', matchIds)
          .order('match_id', { ascending: true })
          .order('number', { ascending: true })
          .range(offset, offset + batchSize - 1);

        if (roundsError) throw roundsError;
        
        if (roundsBatch && roundsBatch.length > 0) {
          allRoundsData = [...allRoundsData, ...roundsBatch];
          offset += batchSize;
          hasMore = roundsBatch.length === batchSize; // Se retornou menos que batchSize, acabou
        } else {
          hasMore = false;
        }
      }
      
      debugLog(`📍 ${allRoundsData.length} rounds carregados do banco (em ${Math.ceil(allRoundsData.length / batchSize)} lotes)`);

      // Indexar rounds por match_id para evitar filtros repetidos
      const roundsByMatch = new Map<string, DBRound[]>();
      allRoundsData.forEach(r => {
        const key = String(r.match_id);
        if (!roundsByMatch.has(key)) roundsByMatch.set(key, []);
        roundsByMatch.get(key)!.push(r);
      });

      // Montar os matches com as teams e rounds (com fallback por match_id)
      const matches: Match[] = matchesData.map((dbMatch, idx) => {
        // Tentar encontrar teams pelos IDs salvos
        let teamA = teamsData.find(t => t.id === dbMatch.team_a_id);
        let teamB = teamsData.find(t => t.id === dbMatch.team_b_id);

        if (idx < 3) debugLog(`🔍 Match ${dbMatch.id}: procurando teams ${dbMatch.team_a_id} e ${dbMatch.team_b_id}`);
        if (teamA && idx < 3) debugLog(`  ✅ Team A encontrada: ${teamA.name} (${teamA.score})`);
        if (teamB && idx < 3) debugLog(`  ✅ Team B encontrada: ${teamB.name} (${teamB.score})`);

        // Fallback: buscar pelo match_id quando IDs não existem
        if (!teamA || !teamB) {
          const teamsByMatch = teamsData.filter(t => t.match_id === dbMatch.id);
          if (teamsByMatch.length >= 2) {
            const ctTeam = teamsByMatch.find(t => (t.side as TeamSide) === TeamSide.CT);
            const tTeam = teamsByMatch.find(t => (t.side as TeamSide) === TeamSide.T);
            teamA = ctTeam || teamsByMatch[0];
            teamB = tTeam || teamsByMatch[1];
          }
        }

        // Se ainda não houver times suficientes, pular este match
        if (!teamA || !teamB) {
          return null as any;
        }

        const matchKey = String(dbMatch.id);
        const roundsForThisMatch = roundsByMatch.get(matchKey) || [];
        if (idx < 3) debugLog(`  📍 Rounds encontrados para ${dbMatch.id}: ${roundsForThisMatch.length}`);
        if (idx < 3 && roundsForThisMatch.length > 0) {
          debugLog(`     Primeiros 3: ${roundsForThisMatch.slice(0, 3).map(r => `#${r.number}`).join(', ')}`);
        }

        const rounds = roundsForThisMatch
          .map(r => ({
            number: r.number,
            winnerSide: r.winner_side as TeamSide,
            endReason: r.end_reason as RoundEndReason,
            duration: r.duration,
            bombPlanted: r.bomb_planted,
            totalKills: r.total_kills,
            firstKillSide: r.first_kill_side as TeamSide,
            ctMoney: r.ct_money || 0,
            tMoney: r.t_money || 0
          }))
          .sort((a, b) => a.number - b.number);

        return {
          id: dbMatch.id,
          mapName: dbMatch.map_name,
          mapImage: dbMatch.map_image,
          date: dbMatch.date,
          tournamentName: (dbMatch as any).tournament_name, // Nome do campeonato
          teamA: {
            id: teamA.id,
            name: teamA.name,
            side: teamA.side as TeamSide,
            score: teamA.score,
            logo: teamA.logo
          },
          teamB: {
            id: teamB.id,
            name: teamB.name,
            side: teamB.side as TeamSide,
            score: teamB.score,
            logo: teamB.logo
          },
          rounds,
          duration: dbMatch.duration,
          uploadedAt: dbMatch.uploaded_at
        };
      }).filter(Boolean);

      return matches;
    } catch (error) {
      console.error('Erro ao buscar matches:', error);
      return [];
    }
  },

  /**
   * Contar rounds de um match
   */
  getRoundCount: async (matchId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('rounds')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', matchId);
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Erro ao contar rounds do match:', error);
      return 0;
    }
  },

  /**
   * Listar matches que estão sem rounds
   */
  getMatchesMissingRounds: async (): Promise<string[]> => {
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id');
      if (matchesError) throw matchesError;
      const missing: string[] = [];
      for (const m of matchesData) {
        const { count, error } = await supabase
          .from('rounds')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', m.id);
        if (error) throw error;
        if (!count || count === 0) missing.push(m.id);
      }
      return missing;
    } catch (error) {
      console.error('Erro ao buscar matches sem rounds:', error);
      return [];
    }
  },

  /**
   * Busca os últimos matches com paginação (limita carregamento inicial)
   */
  getLatestMatches: async (limit: number = 20): Promise<Match[]> => {
    try {
      // Buscar últimos matches com limite
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (matchesError) throw matchesError;

      const matchIds = matchesData.map(m => m.id);

      // Buscar teams apenas dos matches selecionados
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .in('match_id', matchIds);

      if (teamsError) throw teamsError;

      // Buscar rounds apenas dos matches selecionados
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .in('match_id', matchIds);

      if (roundsError) throw roundsError;

      const matches: Match[] = matchesData.map(dbMatch => {
        const teamsByMatch = teamsData.filter(t => t.match_id === dbMatch.id);
        if (teamsByMatch.length < 2) return null as any;
        const ctTeam = teamsByMatch.find(t => (t.side as TeamSide) === TeamSide.CT) || teamsByMatch[0];
        const tTeam = teamsByMatch.find(t => (t.side as TeamSide) === TeamSide.T) || teamsByMatch[1];

        const rounds = roundsData
          .filter(r => r.match_id === dbMatch.id)
          .map(r => ({
            number: r.number,
            winnerSide: r.winner_side as TeamSide,
            endReason: r.end_reason as RoundEndReason,
            duration: r.duration,
            bombPlanted: r.bomb_planted,
            totalKills: r.total_kills,
            firstKillSide: r.first_kill_side as TeamSide,
            ctMoney: r.ct_money,
            tMoney: r.t_money
          }))
          .sort((a, b) => a.number - b.number);

        return {
          id: dbMatch.id,
          mapName: dbMatch.map_name,
          mapImage: dbMatch.map_image,
          date: dbMatch.date,
          teamA: {
            id: ctTeam.id,
            name: ctTeam.name,
            side: ctTeam.side as TeamSide,
            score: ctTeam.score,
            logo: ctTeam.logo
          },
          teamB: {
            id: tTeam.id,
            name: tTeam.name,
            side: tTeam.side as TeamSide,
            score: tTeam.score,
            logo: tTeam.logo
          },
          rounds,
          duration: dbMatch.duration,
          uploadedAt: dbMatch.uploaded_at
        };
      }).filter(Boolean);

      return matches;
    } catch (error) {
      console.error('Erro ao buscar últimos matches:', error);
      return [];
    }
  },

  /**
   * Busca um match específico pelo ID
   */
  getMatchById: async (matchId: string): Promise<Match | null> => {
    try {
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      // Buscar teams deste match
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .in('id', [matchData.team_a_id, matchData.team_b_id]);

      if (teamsError) throw teamsError;

      // Buscar rounds deste match
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .eq('match_id', matchId)
        .order('number', { ascending: true });

      if (roundsError) throw roundsError;

      const teamA = teamsData.find(t => t.id === matchData.team_a_id);
      const teamB = teamsData.find(t => t.id === matchData.team_b_id);

      const match: Match = {
        id: matchData.id,
        mapName: matchData.map_name,
        mapImage: matchData.map_image,
        date: matchData.date,
        tournamentName: matchData.tournament_name, // Nome do campeonato
        teamA: {
          id: teamA.id,
          name: teamA.name,
          side: teamA.side as TeamSide,
          score: teamA.score,
          logo: teamA.logo
        },
        teamB: {
          id: teamB.id,
          name: teamB.name,
          side: teamB.side as TeamSide,
          score: teamB.score,
          logo: teamB.logo
        },
        rounds: roundsData.map(r => ({
          number: r.number,
          winnerSide: r.winner_side as TeamSide,
          endReason: r.end_reason as RoundEndReason,
          duration: r.duration,
          bombPlanted: r.bomb_planted,
          totalKills: r.total_kills,
          firstKillSide: r.first_kill_side as TeamSide,
          ctMoney: r.ct_money,
          tMoney: r.t_money
        })),
        duration: matchData.duration,
        uploadedAt: matchData.uploaded_at
      };

      return match;
    } catch (error) {
      console.error('Erro ao buscar match:', error);
      return null;
    }
  },

  // ========== TEAMS ==========

  createTeam: async (team: DBTeam): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([team])
        .select();

      if (error) throw error;
      return team.id;
    } catch (error) {
      console.error('Erro ao criar team:', error);
      return null;
    }
  },

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Deleta um match completo (cascata: match -> rounds -> teams)
   */
  deleteMatch: async (matchId: string): Promise<boolean> => {
    try {
      // Delete rounds primeiro
      const { error: roundsError } = await supabase
        .from('rounds')
        .delete()
        .eq('match_id', matchId);

      if (roundsError) throw roundsError;

      // Delete teams
      const { error: teamsError } = await supabase
        .from('teams')
        .delete()
        .eq('match_id', matchId);

      if (teamsError) throw teamsError;

      // Delete match
      const { error: matchError } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (matchError) throw matchError;

      return true;
    } catch (error) {
      console.error('Erro ao deletar match:', error);
      return false;
    }
  },

  /**
   * Conta total de matches
   */
  getMatchCount: async (): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Erro ao contar matches:', error);
      return 0;
    }
  },

  /**
   * Busca matches por mapa
   */
  getMatchesByMap: async (mapName: string): Promise<Match[]> => {
    try {
      const allMatches = await supabaseService.getAllMatches();
      return allMatches.filter(m => m.mapName.toLowerCase() === mapName.toLowerCase());
    } catch (error) {
      console.error('Erro ao buscar matches por mapa:', error);
      return [];
    }
  },

  /**
   * Busca matches por times
   */
  getMatchesByTeams: async (teamName: string): Promise<Match[]> => {
    try {
      const allMatches = await supabaseService.getAllMatches();
      return allMatches.filter(m => 
        m.teamA.name.toLowerCase().includes(teamName.toLowerCase()) ||
        m.teamB.name.toLowerCase().includes(teamName.toLowerCase())
      );
    } catch (error) {
      console.error('Erro ao buscar matches por times:', error);
      return [];
    }
  },

  /**
   * Atualiza scores e lados de um match (ajuste manual)
   */
  updateMatch: async (matchId: string, updates: {
    teamA_score?: number;
    teamB_score?: number;
    teamA_side?: TeamSide;
    teamB_side?: TeamSide;
  }): Promise<void> => {
    try {
      console.log(`✏️ Atualizando match ${matchId}:`, updates);

      // Buscar o match para pegar os IDs das teams
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('team_a_id, team_b_id')
        .eq('id', matchId)
        .single();

      if (matchError || !matchData) {
        throw new Error('Não foi possível encontrar o match');
      }

      const { team_a_id, team_b_id } = matchData;

      // Atualizar scores das teams
      if (updates.teamA_score !== undefined && team_a_id) {
        const { error } = await supabase
          .from('teams')
          .update({ score: updates.teamA_score })
          .eq('id', team_a_id);
        if (error) throw error;
        console.log(`✅ Score de Team A atualizado para ${updates.teamA_score}`);
      }

      if (updates.teamB_score !== undefined && team_b_id) {
        const { error } = await supabase
          .from('teams')
          .update({ score: updates.teamB_score })
          .eq('id', team_b_id);
        if (error) throw error;
        console.log(`✅ Score de Team B atualizado para ${updates.teamB_score}`);
      }

      // Atualizar lados das teams
      if (updates.teamA_side !== undefined && team_a_id) {
        const { error } = await supabase
          .from('teams')
          .update({ side: updates.teamA_side })
          .eq('id', team_a_id);
        if (error) throw error;
        console.log(`✅ Side de Team A atualizado para ${updates.teamA_side}`);
      }

      if (updates.teamB_side !== undefined && team_b_id) {
        const { error } = await supabase
          .from('teams')
          .update({ side: updates.teamB_side })
          .eq('id', team_b_id);
        if (error) throw error;
        console.log(`✅ Side de Team B atualizado para ${updates.teamB_side}`);
      }

      console.log('✅ Match atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar match:', error);
      throw error;
    }
  },

  /**
   * Atualiza o nome do campeonato de uma partida
   */
  updateMatchTournament: async (matchId: string, tournamentName: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ tournament_name: tournamentName || null })
        .eq('id', matchId);

      if (error) throw error;
      
      console.log(`✅ Nome do campeonato atualizado para: ${tournamentName}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar nome do campeonato:', error);
      return false;
    }
  },

  // ========== BETS & CASH ACCOUNTS ==========

  /**
   * Cria uma nova aposta
   */
  createBet: async (bet: Omit<Bet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bet | null> => {
    try {
      debugLog('📝 Criando nova aposta...', bet);
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('bets')
        .insert({
          user_id: bet.userId,
          match_id: bet.matchId || null,
          betting_house: bet.bettingHouse,
          bet_amount: bet.betAmount,
          odd: bet.odd,
          potential_return: bet.potentialReturn,
          bet_status: bet.betStatus,
          bet_date: bet.betDate,
          result_date: bet.resultDate || null,
          notes: bet.notes || null,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar aposta:', error.message);
        return null;
      }

      const newBet: Bet = {
        id: data.id,
        userId: data.user_id,
        matchId: data.match_id,
        bettingHouse: data.betting_house,
        betAmount: data.bet_amount,
        odd: data.odd,
        potentialReturn: data.potential_return,
        betStatus: data.bet_status,
        betDate: data.bet_date,
        resultDate: data.result_date,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      debugLog('✅ Aposta criada:', newBet);
      return newBet;
    } catch (error) {
      console.error('❌ Erro ao criar aposta:', error);
      return null;
    }
  },

  /**
   * Busca todas as apostas do usuário
   */
  getUserBets: async (userId: string): Promise<Bet[]> => {
    try {
      debugLog('📋 Buscando apostas do usuário:', userId);
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', userId)
        .order('bet_date', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar apostas:', error.message);
        return [];
      }

      const bets: Bet[] = (data || []).map(db => ({
        id: db.id,
        userId: db.user_id,
        matchId: db.match_id,
        bettingHouse: db.betting_house,
        betAmount: db.bet_amount,
        odd: db.odd,
        potentialReturn: db.potential_return,
        betStatus: db.bet_status,
        betDate: db.bet_date,
        resultDate: db.result_date,
        notes: db.notes,
        createdAt: db.created_at,
        updatedAt: db.updated_at
      }));

      debugLog('✅ Apostas carregadas:', bets);
      return bets;
    } catch (error) {
      console.error('❌ Erro ao buscar apostas:', error);
      return [];
    }
  },

  /**
   * Atualiza uma aposta existente
   */
  updateBet: async (betId: string, updates: Partial<Omit<Bet, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Bet | null> => {
    try {
      debugLog('✏️ Atualizando aposta:', betId, updates);
      const now = new Date().toISOString();

      const updateData: Record<string, unknown> = {
        updated_at: now
      };

      if (updates.bettingHouse) updateData.betting_house = updates.bettingHouse;
      if (updates.betAmount !== undefined) updateData.bet_amount = updates.betAmount;
      if (updates.odd !== undefined) updateData.odd = updates.odd;
      if (updates.potentialReturn !== undefined) updateData.potential_return = updates.potentialReturn;
      if (updates.betStatus) updateData.bet_status = updates.betStatus;
      if (updates.betDate) updateData.bet_date = updates.betDate;
      if (updates.resultDate) updateData.result_date = updates.resultDate;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { data, error } = await supabase
        .from('bets')
        .update(updateData)
        .eq('id', betId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar aposta:', error.message);
        return null;
      }

      const updatedBet: Bet = {
        id: data.id,
        userId: data.user_id,
        matchId: data.match_id,
        bettingHouse: data.betting_house,
        betAmount: data.bet_amount,
        odd: data.odd,
        potentialReturn: data.potential_return,
        betStatus: data.bet_status,
        betDate: data.bet_date,
        resultDate: data.result_date,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      debugLog('✅ Aposta atualizada:', updatedBet);
      return updatedBet;
    } catch (error) {
      console.error('❌ Erro ao atualizar aposta:', error);
      return null;
    }
  },

  /**
   * Deleta uma aposta
   */
  deleteBet: async (betId: string): Promise<boolean> => {
    try {
      debugLog('🗑️ Deletando aposta:', betId);
      const { error } = await supabase
        .from('bets')
        .delete()
        .eq('id', betId);

      if (error) {
        console.error('❌ Erro ao deletar aposta:', error.message);
        return false;
      }

      debugLog('✅ Aposta deletada');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar aposta:', error);
      return false;
    }
  },

  /**
   * Cria uma nova conta de caixa
   */
  createCashAccount: async (account: Omit<CashAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<CashAccount | null> => {
    try {
      debugLog('💰 Criando nova conta de caixa...', account);
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('cash_accounts')
        .insert({
          user_id: account.userId,
          betting_house: account.bettingHouse,
          initial_balance: account.initialBalance,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar conta de caixa:', error.message);
        return null;
      }

      const newAccount: CashAccount = {
        id: data.id,
        userId: data.user_id,
        bettingHouse: data.betting_house,
        initialBalance: data.initial_balance,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      debugLog('✅ Conta de caixa criada:', newAccount);
      return newAccount;
    } catch (error) {
      console.error('❌ Erro ao criar conta de caixa:', error);
      return null;
    }
  },

  /**
   * Busca todas as contas de caixa do usuário
   */
  getUserCashAccounts: async (userId: string): Promise<CashAccount[]> => {
    try {
      debugLog('💰 Buscando contas de caixa do usuário:', userId);
      const { data, error } = await supabase
        .from('cash_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar contas de caixa:', error.message);
        return [];
      }

      const accounts: CashAccount[] = (data || []).map(db => ({
        id: db.id,
        userId: db.user_id,
        bettingHouse: db.betting_house,
        initialBalance: db.initial_balance,
        createdAt: db.created_at,
        updatedAt: db.updated_at
      }));

      debugLog('✅ Contas de caixa carregadas:', accounts);
      return accounts;
    } catch (error) {
      console.error('❌ Erro ao buscar contas de caixa:', error);
      return [];
    }
  },

  /**
   * Atualiza saldo inicial de uma conta
   */
  updateCashAccount: async (accountId: string, initialBalance: number): Promise<CashAccount | null> => {
    try {
      debugLog('✏️ Atualizando conta de caixa:', accountId, initialBalance);
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('cash_accounts')
        .update({ initial_balance: initialBalance, updated_at: now })
        .eq('id', accountId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar conta de caixa:', error.message);
        return null;
      }

      const updatedAccount: CashAccount = {
        id: data.id,
        userId: data.user_id,
        bettingHouse: data.betting_house,
        initialBalance: data.initial_balance,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      debugLog('✅ Conta de caixa atualizada:', updatedAccount);
      return updatedAccount;
    } catch (error) {
      console.error('❌ Erro ao atualizar conta de caixa:', error);
      return null;
    }
  },

  /**
   * Deleta uma conta de caixa
   */
  deleteCashAccount: async (accountId: string): Promise<boolean> => {
    try {
      debugLog('🗑️ Deletando conta de caixa:', accountId);
      const { error } = await supabase
        .from('cash_accounts')
        .delete()
        .eq('id', accountId);

      if (error) {
        console.error('❌ Erro ao deletar conta de caixa:', error.message);
        return false;
      }

      debugLog('✅ Conta de caixa deletada');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar conta de caixa:', error);
      return false;
    }
  }
};

export default supabaseService;
