import React, { useEffect, useState } from 'react';
import { Match, TeamSide, RoundEndReason, Round } from '../types';
import { ArrowLeft, Clock, Bomb, Skull, Wrench, Shield, Zap, Target, Trophy, Edit2, Check, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import supabaseService from '../services/supabaseService';

interface MatchDetailProps {
  match: Match;
  onBack: () => void;
  userRole?: string;
}

const MatchDetail: React.FC<MatchDetailProps> = ({ match, onBack, userRole }) => {
  const isAdmin = userRole === 'ADMIN';
  // Carregar dados completos do match (incluindo rounds) caso venham vazios
  const [loadedMatch, setLoadedMatch] = useState<Match | null>(null);
  const [isEditingTournament, setIsEditingTournament] = useState(false);
  const [tournamentNameInput, setTournamentNameInput] = useState('');
  const [isSavingTournament, setIsSavingTournament] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchFullMatch = async () => {
      try {
        if (!match.rounds || match.rounds.length === 0) {
          const m = await supabaseService.getMatchById(match.id);
          if (!cancelled && m) setLoadedMatch(m);
        } else {
          // Garantir que limpamos qualquer estado anterior
          setLoadedMatch(null);
        }
      } catch (e) {
        // Em caso de erro, manter dados existentes
        setLoadedMatch(null);
      }
    };
    fetchFullMatch();
    return () => { cancelled = true; };
  }, [match.id]);

  const current = loadedMatch || match;
  const rounds = current.rounds || [];
  const noRounds = !rounds || rounds.length === 0;
  const [tablePage, setTablePage] = useState(1);
  const tablePerPage = 20;
  const totalTablePages = Math.max(1, Math.ceil(rounds.length / tablePerPage));
  const tableRounds = rounds.slice((tablePage - 1) * tablePerPage, tablePage * tablePerPage);

  useEffect(() => {
    setTablePage(1);
  }, [current.id, rounds.length]);
  
  // Função para iniciar edição do campeonato
  const startEditTournament = () => {
    setTournamentNameInput(current.tournamentName || '');
    setIsEditingTournament(true);
  };

  // Função para salvar o nome do campeonato
  const saveTournament = async () => {
    setIsSavingTournament(true);
    const success = await supabaseService.updateMatchTournament(current.id, tournamentNameInput.trim());
    
    if (success) {
      // Atualizar o estado local
      if (loadedMatch) {
        setLoadedMatch({ ...loadedMatch, tournamentName: tournamentNameInput.trim() });
      } else {
        match.tournamentName = tournamentNameInput.trim();
      }
      setIsEditingTournament(false);
    } else {
      alert('Erro ao salvar o nome do campeonato. Tente novamente.');
    }
    setIsSavingTournament(false);
  };

  // Função para cancelar edição
  const cancelEditTournament = () => {
    setIsEditingTournament(false);
    setTournamentNameInput('');
  };

  // Helpers
  const getRoundIcon = (reason: RoundEndReason) => {
    switch(reason) {
      case RoundEndReason.TargetBombed: return <Bomb size={14} className="text-yellow-400" />;
      case RoundEndReason.BombDefused: return <Wrench size={14} className="text-blue-400" />;
      case RoundEndReason.TerroristsEliminated: return <Skull size={14} />;
      case RoundEndReason.CTsEliminated: return <Skull size={14} />;
      case RoundEndReason.TargetSaved: return <Clock size={14} />;
      default: return <Target size={14} />;
    }
  };

  const getReasonColor = (reason: RoundEndReason) => {
    switch(reason) {
      case RoundEndReason.TargetBombed: return 'text-yellow-500';
      case RoundEndReason.BombDefused: return 'text-blue-500';
      case RoundEndReason.TerroristsEliminated: return 'text-red-400';
      case RoundEndReason.CTsEliminated: return 'text-orange-400';
      case RoundEndReason.TargetSaved: return 'text-green-500';
      default: return 'text-slate-400';
    }
  };

  // Stats Calculations
  const tWins = rounds.filter(r => r.winnerSide === TeamSide.T).length;
  const ctWins = rounds.filter(r => r.winnerSide === TeamSide.CT).length;
  const bombPlants = rounds.filter(r => r.bombPlanted).length;
  const totalKills = rounds.reduce((sum, round) => sum + round.totalKills, 0);
  const totalRounds = rounds.length;
  
  const winTypeData = [
    { name: 'Eliminação', value: rounds.filter(r => (r.endReason as any)?.includes?.('Eliminados')).length },
    { name: 'Bomba/Defuse', value: rounds.filter(r => (r.endReason as any)?.includes?.('Bomba') || (r.endReason as any)?.includes?.('Detonada')).length },
    { name: 'Tempo', value: rounds.filter(r => r.endReason === RoundEndReason.TargetSaved).length },
  ];

  const WIN_COLORS = ['#ef4444', '#f59e0b', '#3b82f6'];

  // MR12 halves: 12 rounds each; OT in blocos de 6 (3+3), trocando lado a cada 3 rounds no OT.
  const HALF_LENGTH = 12;
  const firstHalfRounds = rounds.filter(r => r.number <= HALF_LENGTH);
  const secondHalfRounds = rounds.filter(r => r.number > HALF_LENGTH && r.number <= HALF_LENGTH * 2);
  const otRounds = rounds.filter(r => r.number > HALF_LENGTH * 2);

  const teamAStartingSide = current.teamA.side;
  const oppositeSide = teamAStartingSide === TeamSide.CT ? TeamSide.T : TeamSide.CT;

  const teamASideForRound = (roundNumber: number): TeamSide => {
    if (roundNumber <= HALF_LENGTH) return teamAStartingSide;
    if (roundNumber <= HALF_LENGTH * 2) return oppositeSide;
    // OT: mantém os lados do 2º tempo (oppositeSide) nos rounds 25-27, depois troca
    const otIndex = roundNumber - (HALF_LENGTH * 2) - 1; // zero-based OT index
    const offsetInBlock = otIndex % 6; // 0..5
    const firstThree = offsetInBlock < 3;
    // No primeiro bloco do OT (25-27) mantém oppositeSide, depois alterna
    return firstThree ? oppositeSide : teamAStartingSide;
  };

  const didTeamAWin = (round: Round) => round.winnerSide === teamASideForRound(round.number);

  const teamAFirstHalfWins = firstHalfRounds.filter(didTeamAWin).length;
  const teamBFirstHalfWins = firstHalfRounds.length - teamAFirstHalfWins;
  const teamASecondHalfWins = secondHalfRounds.filter(didTeamAWin).length;
  const teamBSecondHalfWins = secondHalfRounds.length - teamASecondHalfWins;

  // Scores recalculados a partir dos rounds (evita dados antigos do backend/DB)
  const teamAWinsTotal = rounds.filter(didTeamAWin).length;
  const teamBWinsTotal = rounds.length - teamAWinsTotal;

  // Se houver ajuste manual, priorizar os scores armazenados; senão usar cálculo
  const displayTeamAScore = current.teamA?.score ?? teamAWinsTotal;
  const displayTeamBScore = current.teamB?.score ?? teamBWinsTotal;
  const teamARealOtWins = teamAWinsTotal - (teamAFirstHalfWins + teamASecondHalfWins);
  const teamBRealOtWins = teamBWinsTotal - (teamBFirstHalfWins + teamBSecondHalfWins);

  const breakdownString = `(${teamAFirstHalfWins}:${teamBFirstHalfWins}) (${teamASecondHalfWins}:${teamBSecondHalfWins}) ${otRounds.length > 0 ? `(${teamARealOtWins}:${teamBRealOtWins})` : ''}`;

  // Helper para renderizar ícone de cada round
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        <span>Voltar para Partidas</span>
      </button>

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl">
        <div className="absolute inset-0 z-0">
          {console.log('🖼️ Map Image:', current.mapImage)}
          <img src={current.mapImage} alt={current.mapName} className="w-full h-full object-cover opacity-30 blur-sm" onError={(e) => console.log('❌ Erro ao carregar imagem do mapa')} />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900"></div>
        </div>

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col gap-6">
            
            {/* Header: Date & Map */}
            <div className="flex justify-between items-start border-b border-slate-700/50 pb-4">
               <div className="flex-1">
                  {isEditingTournament ? (
                    <div className="flex items-center gap-2">
                      <Trophy size={18} className="text-yellow-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={tournamentNameInput}
                        onChange={(e) => setTournamentNameInput(e.target.value)}
                        placeholder="Nome do Campeonato"
                        className="flex-1 bg-slate-800 border border-slate-600 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 text-base font-bold"
                        autoFocus
                      />
                      <button
                        onClick={saveTournament}
                        disabled={isSavingTournament}
                        className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Salvar"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEditTournament}
                        disabled={isSavingTournament}
                        className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      {current.tournamentName ? (
                        <>
                          <h2 className="text-white font-bold text-lg flex items-center gap-2">
                            <Trophy size={18} className="text-yellow-500" />
                            {current.tournamentName}
                          </h2>
                          {isAdmin && (
                            <button
                              onClick={startEditTournament}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-all"
                              title="Editar campeonato (Admin)"
                            >
                              <Edit2 size={14} className="text-slate-400" />
                            </button>
                          )}
                        </>
                      ) : (
                        isAdmin && (
                          <button
                            onClick={startEditTournament}
                            className="text-slate-500 hover:text-white text-sm flex items-center gap-2 transition-colors"
                          >
                            <Trophy size={16} />
                            <span>+ Adicionar Campeonato</span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                  <div className="text-slate-400 text-sm mt-1 flex gap-3">
                     <span>{current.date}</span>
                     <span>•</span>
                     <span>Mapa: {current.mapName}</span>
                  </div>
               </div>
               <div className="px-3 py-1 bg-slate-800 rounded text-slate-300 text-xs font-mono">
                 ID: {match.id.slice(0, 8)}
               </div>
            </div>

            {/* Score Main */}
            <div className="flex justify-between items-center px-4 md:px-12">
               {/* Team A */}
               <div className="text-center">
                  {console.log('🎨 Team A Logo:', current.teamA.logo)}
                  <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-2 border-2 border-blue-500/30 overflow-hidden">
                     {current.teamA.logo ? (
                       <img src={current.teamA.logo} alt={current.teamA.name} className="w-full h-full object-cover rounded-full" onError={(e) => { console.log('❌ Erro ao carregar logo Team A'); e.currentTarget.style.display = 'none'; }} />
                     ) : (
                       <span className="text-2xl font-bold text-blue-500">A</span>
                     )}
                  </div>
                  <h1 className="text-2xl font-bold text-white">{current.teamA.name}</h1>
                  <span className="text-4xl font-bold text-red-500 block mt-2">{displayTeamAScore}</span>
               </div>

               {/* VS / Map */}
               <div className="flex flex-col items-center">
                  <span className="text-slate-500 text-sm uppercase tracking-widest mb-2">Mapa</span>
                  <span className="text-xl font-bold text-slate-200 mb-4">{current.mapName}</span>
                  <div className="text-5xl text-slate-600 font-thin">:</div>
               </div>

               {/* Team B */}
               <div className="text-center">
                  {console.log('🎨 Team B Logo:', current.teamB.logo)}
                  <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-2 border-2 border-green-500/30 overflow-hidden">
                    {current.teamB.logo ? (
                      <img src={current.teamB.logo} alt={current.teamB.name} className="w-full h-full object-cover rounded-full" onError={(e) => { console.log('❌ Erro ao carregar logo Team B'); e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <span className="text-2xl font-bold text-green-500">B</span>
                      )}
                  </div>
                  <h1 className="text-2xl font-bold text-white">{current.teamB.name}</h1>
                  <span className="text-4xl font-bold text-green-500 block mt-2">{displayTeamBScore}</span>
               </div>
            </div>

            {/* Breakdown Bar */}
            <div className="bg-slate-800/50 rounded-lg p-3 flex justify-between items-center text-sm border border-slate-700/50">
               <span className="text-slate-400 font-medium">Parciais</span>
               <div className="flex items-center gap-4">
                  <div className="font-mono text-slate-200">
                     <span className="text-red-400">{displayTeamAScore}</span>
                     <span className="text-slate-500 mx-1">:</span>
                     <span className="text-green-400">{displayTeamBScore}</span>
                     <span className="ml-3 text-slate-400">{breakdownString}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded border border-red-500/30">
                     <Skull size={14} className="text-red-400" />
                     <span className="text-red-400 font-semibold">Total de Kills: {totalKills}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/15 rounded border border-blue-500/30">
                    <Target size={14} className="text-blue-300" />
                    <span className="text-blue-300 font-semibold">Total de Rounds: {totalRounds}</span>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* Round History Timeline - HLTV Style (Team A top, Team B bottom) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-6">
         <h3 className="font-bold text-white mb-6">Histórico de Rounds</h3>
         {noRounds && (
           <div className="p-3 mb-4 rounded-lg bg-amber-900/20 border border-amber-700/40 text-amber-300 text-sm">
             Nenhum round cadastrado para esta partida. Reimporte a demo ou verifique integridade em Ajustes.
           </div>
         )}
         
         {!noRounds && (
           <div className="space-y-1">
             {/* Team A Row */}
             <div className="flex items-center gap-2">
               <div className="flex items-center gap-2 flex-shrink-0">
                 {current.teamA.logo && (
                   <img src={current.teamA.logo} alt={current.teamA.name} className="w-5 h-5 rounded object-cover" />
                 )}
                 <span className="text-xs font-bold text-white truncate w-24">{current.teamA.name}</span>
               </div>
               <div className="overflow-x-auto flex-1">
                 <div className="flex justify-start items-center gap-0 pb-0">
                   {rounds.map((round) => {
                     const teamAWon = didTeamAWin(round);
                     const teamASide = teamASideForRound(round.number);
                     
                     return (
                       <React.Fragment key={`teamA-round-${round.number}`}>
                         {/* Divisor antes de round 13 */}
                         {round.number === 13 && (
                           <div className="h-6 w-px bg-red-600/80 border-l border-red-500 mx-0"></div>
                         )}
                         
                         {/* Divisor antes de round 25 (OT) */}
                         {otRounds.length > 0 && round.number === 25 && (
                           <div className="h-6 w-px bg-yellow-600/80 border-l border-yellow-500 mx-0"></div>
                         )}
                         
                         {/* Divisores a cada 3 rounds no OT */}
                         {otRounds.length > 0 && round.number > 25 && (round.number - 25) % 3 === 0 && (
                           <div className="h-6 w-px bg-purple-600/60 border-l border-purple-500 mx-0"></div>
                         )}
                         
                         {/* Round Icon - só mostra se Team A ganhou */}
                         {teamAWon && (
                           <div className="relative w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors group cursor-help flex-shrink-0 border border-slate-600/50">
                             {(() => {
                               const { iconType, colorClass } = (() => {
                                 if (round.endReason === RoundEndReason.TargetBombed) {
                                   return { iconType: 'bomb', colorClass: 'text-yellow-500' };
                                 } else if (round.endReason === RoundEndReason.BombDefused) {
                                   return { iconType: 'defuse', colorClass: 'text-blue-500' };
                                 } else if (round.endReason === RoundEndReason.TargetSaved) {
                                   return { iconType: 'time', colorClass: 'text-green-500' };
                                 } else {
                                   return { iconType: 'skull', colorClass: teamASide === TeamSide.CT ? 'text-blue-400' : 'text-yellow-400' };
                                 }
                               })();
                               
                               return (
                                 <>
                                   {iconType === 'skull' && <Skull size={11} className={colorClass} />}
                                   {iconType === 'bomb' && <Bomb size={11} className={colorClass} />}
                                   {iconType === 'defuse' && <Wrench size={11} className={colorClass} />}
                                   {iconType === 'time' && <Clock size={11} className={colorClass} />}
                                 </>
                               );
                             })()}
                             <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-xs px-2 py-1 rounded whitespace-nowrap z-50 border border-slate-700">
                               R{round.number}: {current.teamA.name} - {round.endReason}
                             </div>
                           </div>
                         )}
                         
                         {/* Empty space if Team B won */}
                         {!teamAWon && (
                           <div className="w-6 h-6 flex-shrink-0"></div>
                         )}
                       </React.Fragment>
                     );
                   })}
                 </div>
               </div>
             </div>
             
             {/* Team B Row */}
             <div className="flex items-center gap-2">
               <div className="flex items-center gap-2 flex-shrink-0">
                 {current.teamB.logo && (
                   <img src={current.teamB.logo} alt={current.teamB.name} className="w-5 h-5 rounded object-cover" />
                 )}
                 <span className="text-xs font-bold text-white truncate w-24">{current.teamB.name}</span>
               </div>
               <div className="overflow-x-auto flex-1">
                 <div className="flex justify-start items-center gap-0 pb-0">
                   {rounds.map((round) => {
                     const teamAWon = didTeamAWin(round);
                     const teamBSide = teamASideForRound(round.number) === TeamSide.CT ? TeamSide.T : TeamSide.CT;
                     
                     return (
                       <React.Fragment key={`teamB-round-${round.number}`}>
                         {/* Divisor antes de round 13 */}
                         {round.number === 13 && (
                           <div className="h-6 w-px bg-red-600/80 border-l border-red-500 mx-0"></div>
                         )}
                         
                         {/* Divisor antes de round 25 (OT) */}
                         {otRounds.length > 0 && round.number === 25 && (
                           <div className="h-6 w-px bg-yellow-600/80 border-l border-yellow-500 mx-0"></div>
                         )}
                         
                         {/* Divisores a cada 3 rounds no OT */}
                         {otRounds.length > 0 && round.number > 25 && (round.number - 25) % 3 === 0 && (
                           <div className="h-6 w-px bg-purple-600/60 border-l border-purple-500 mx-0"></div>
                         )}
                         
                         {/* Round Icon - só mostra se Team B ganhou */}
                         {!teamAWon && (
                           <div className="relative w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors group cursor-help flex-shrink-0 border border-slate-600/50">
                             {(() => {
                               const { iconType, colorClass } = (() => {
                                 if (round.endReason === RoundEndReason.TargetBombed) {
                                   return { iconType: 'bomb', colorClass: 'text-yellow-500' };
                                 } else if (round.endReason === RoundEndReason.BombDefused) {
                                   return { iconType: 'defuse', colorClass: 'text-blue-500' };
                                 } else if (round.endReason === RoundEndReason.TargetSaved) {
                                   return { iconType: 'time', colorClass: 'text-green-500' };
                                 } else {
                                   return { iconType: 'skull', colorClass: teamBSide === TeamSide.CT ? 'text-blue-400' : 'text-yellow-400' };
                                 }
                               })();
                               
                               return (
                                 <>
                                   {iconType === 'skull' && <Skull size={11} className={colorClass} />}
                                   {iconType === 'bomb' && <Bomb size={11} className={colorClass} />}
                                   {iconType === 'defuse' && <Wrench size={11} className={colorClass} />}
                                   {iconType === 'time' && <Clock size={11} className={colorClass} />}
                                 </>
                               );
                             })()}
                             <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-xs px-2 py-1 rounded whitespace-nowrap z-50 border border-slate-700">
                               R{round.number}: {current.teamB.name} - {round.endReason}
                             </div>
                           </div>
                         )}
                         
                         {/* Empty space if Team A won */}
                         {teamAWon && (
                           <div className="w-6 h-6 flex-shrink-0"></div>
                         )}
                       </React.Fragment>
                     );
                   })}
                 </div>
               </div>
             </div>
           </div>
         )}
         
         {/* Legend */}
         <div className="flex gap-6 mt-6 text-xs text-slate-400 justify-center flex-wrap">
            <div className="flex items-center gap-2"><Skull size={14} className="text-slate-200"/> Eliminação</div>
            <div className="flex items-center gap-2"><Bomb size={14} className="text-yellow-500"/> Bomba Explodiu</div>
            <div className="flex items-center gap-2"><Wrench size={14} className="text-blue-500"/> Defuse</div>
            <div className="flex items-center gap-2"><Clock size={14} className="text-green-500"/> Tempo</div>
         </div>
      </div>

      {/* Detailed Rounds Table */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <h3 className="font-bold text-lg text-white">Tabela de Rounds</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={() => setTablePage(p => Math.max(1, p - 1))}
              disabled={tablePage === 1}
              className="px-2 py-1 rounded border border-slate-700 disabled:opacity-40 hover:bg-slate-800"
            >
              Anterior
            </button>
            <span>{tablePage} / {totalTablePages}</span>
            <button
              onClick={() => setTablePage(p => Math.min(totalTablePages, p + 1))}
              disabled={tablePage === totalTablePages}
              className="px-2 py-1 rounded border border-slate-700 disabled:opacity-40 hover:bg-slate-800"
            >
              Próximo
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-700/50 bg-slate-800/20">
                <th className="py-3 px-4 text-center w-16">#</th>
                <th className="py-3 px-4">Vencedor</th>
                <th className="py-3 px-4">Motivo</th>
                <th className="py-3 px-4 text-center">Plantou?</th>
                <th className="py-3 px-4 text-center">Kills</th>
                <th className="py-3 px-4 text-right">Duração</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {tableRounds.map((round) => {
                const teamAWon = didTeamAWin(round);
                const winnerName = teamAWon ? current.teamA.name : current.teamB.name;
                const winnerSide = round.winnerSide;
                return (
                <tr key={round.number} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-slate-500">{round.number}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded font-bold text-xs ${winnerSide === TeamSide.CT ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {winnerSide === TeamSide.CT ? <Shield size={12}/> : <Target size={12}/>} 
                      {winnerName} ({winnerSide})
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded font-medium text-xs ${getReasonColor(round.endReason)} bg-slate-800/50 border border-slate-700`}>
                      {getRoundIcon(round.endReason)}
                      <span>{round.endReason}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {round.bombPlanted ? (
                       <div className="inline-flex items-center justify-center gap-1 text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-xs font-bold border border-red-400/20 mx-auto w-fit">
                         <Bomb size={12} /> SIM
                       </div>
                    ) : (
                       <div className="inline-flex items-center justify-center gap-1 text-slate-300 bg-slate-500/10 px-2 py-0.5 rounded text-xs font-bold border border-slate-500/20 mx-auto w-fit">
                         <Bomb size={12} className="text-slate-400" /> NÃO
                       </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-slate-400 font-medium text-sm flex items-center justify-center gap-1.5">
                       <span className="text-slate-500">☠️</span> {round.totalKills} kills
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">{round.duration}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MatchDetail;