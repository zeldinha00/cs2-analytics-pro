import React, { useEffect, useMemo, useState } from 'react';
import { Match, TeamSide } from '../types';
import { Search, Filter, Calendar } from 'lucide-react';

interface MatchesProps {
  matches: Match[];
  onViewDetails: (matchId: string) => void;
}

const Matches: React.FC<MatchesProps> = ({ matches, onViewDetails }) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    const handler = setTimeout(() => setSearchTerm(searchInput), 250);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredMatches = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return matches.filter(m => 
      m.mapName.toLowerCase().includes(term) ||
      m.teamA.name.toLowerCase().includes(term) ||
      m.teamB.name.toLowerCase().includes(term)
    );
  }, [matches, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / perPage));
  const pageData = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredMatches.slice(start, start + perPage);
  }, [filteredMatches, page]);

  // Helper para calcular score baseado em rounds (mesma lógica do MatchDetail)
  const calculateScores = (match: Match) => {
    const HALF_LENGTH = 12;
    const teamAStartingSide = match.teamA.side;
    const oppositeSide = teamAStartingSide === TeamSide.CT ? TeamSide.T : TeamSide.CT;
    const teamASideForRound = (roundNumber: number): TeamSide => {
      if (roundNumber <= HALF_LENGTH) return teamAStartingSide;
      if (roundNumber <= HALF_LENGTH * 2) return oppositeSide;
      // OT: mantém os lados do 2º tempo (oppositeSide) nos rounds 25-27, depois troca
      const otIndex = roundNumber - (HALF_LENGTH * 2) - 1; // zero-based
      const offsetInBlock = otIndex % 6; // blocos de 6 (3+3)
      const firstThree = offsetInBlock < 3;
      return firstThree ? oppositeSide : teamAStartingSide;
    };
    const teamAWins = match.rounds.filter(r => r.winnerSide === teamASideForRound(r.number)).length;
    const teamBWins = match.rounds.length - teamAWins;

    // Se o score ajustado existir no banco, priorizar; caso contrário, usar o calculado
    const displayTeamA = match.teamA?.score ?? teamAWins;
    const displayTeamB = match.teamB?.score ?? teamBWins;

    return { teamAWins, teamBWins, displayTeamA, displayTeamB };
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Histórico de Partidas</h1>
            <p className="text-slate-400 text-sm">Arquivo completo de demos processadas e resultados consolidados.</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
              <span className="px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700">{filteredMatches.length} partidas</span>
              <span className="px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700">Página {page} de {totalPages}</span>
            </div>
          </div>
          
          <div className="flex gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar mapa ou time..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-900/70 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 placeholder-slate-500 transition-colors"
              />
            </div>
            <button className="px-4 py-2.5 bg-slate-900/70 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2">
              <Filter size={18} />
              <span className="hidden sm:inline">Filtrar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pageData.map((match) => (
          <div 
            key={match.id} 
            className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all duration-300 group shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          >
            <div className="flex flex-col md:flex-row">
              {/* Map Image Section */}
              <div className="relative w-full md:w-72 h-36 md:h-auto overflow-hidden">
                <img 
                  src={match.mapImage} 
                  alt={match.mapName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/30 to-transparent flex items-end p-4">
                  <div>
                    <span className="font-bold text-xl text-white drop-shadow-md">{match.mapName}</span>
                    <div className="text-xs text-slate-300 mt-1">Mapa selecionado</div>
                  </div>
                </div>
              </div>

              {/* Match Content */}
              <div className="flex-1 p-6 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono uppercase tracking-wider">
                    <Calendar size={12} />
                    <span>{match.date}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                    <span>{match.duration}</span>
                  </div>
                  <div className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    COMPETITIVO
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6">
                  {/* Team A */}
                  <div className="flex-1 flex items-center gap-3 justify-end text-right">
                    <div className="hidden sm:block">
                      <div className="font-bold text-white text-lg">{match.teamA.name}</div>
                      <div className="text-xs text-slate-400">Time A</div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center overflow-hidden">
                      {match.teamA.logo ? (
                        <img src={match.teamA.logo} alt={match.teamA.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-blue-500 font-bold">A</span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center px-4">
                    <div className="text-3xl font-black text-white tracking-widest font-mono">
                      {(() => {
                        const { displayTeamA, displayTeamB } = calculateScores(match);
                        return (
                          <>
                            <span className={displayTeamA > displayTeamB ? "text-green-400" : ""}>{displayTeamA}</span>
                            <span className="text-slate-600 mx-2">:</span>
                            <span className={displayTeamB > displayTeamA ? "text-green-400" : ""}>{displayTeamB}</span>
                          </>
                        );
                      })()}
                    </div>
                    {match.rounds.length > 0 && (
                      <div className="text-xs text-slate-500 mt-1">{match.rounds.length} rounds disputados</div>
                    )}
                  </div>

                  {/* Team B */}
                  <div className="flex-1 flex items-center gap-3 justify-start text-left">
                    <div className="w-11 h-11 rounded-xl bg-yellow-600/20 border border-yellow-500/30 flex items-center justify-center overflow-hidden">
                      {match.teamB.logo ? (
                        <img src={match.teamB.logo} alt={match.teamB.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-yellow-500 font-bold">B</span>
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <div className="font-bold text-white text-lg">{match.teamB.name}</div>
                      <div className="text-xs text-slate-400">Time B</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 flex items-center border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/40 md:w-36 justify-center">
                <button 
                  onClick={() => onViewDetails(match.id)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all w-full md:w-auto"
                >
                  Analisar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <div>{filteredMatches.length} partidas encontradas</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border border-slate-700 disabled:opacity-40 hover:bg-slate-800"
          >
            Anterior
          </button>
          <span className="text-slate-500">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded border border-slate-700 disabled:opacity-40 hover:bg-slate-800"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Matches;
