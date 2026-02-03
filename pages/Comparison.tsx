import React, { useEffect, useMemo, useState } from 'react';
import { Match, RoundEndReason, TeamSide } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Swords, Map, Filter, Sparkles, Crown, Zap } from 'lucide-react';

interface ComparisonProps {
  matches: Match[];
}

type TeamStats = {
  teamName: string;
  matchesPlayed: number;
  roundsPlayed: number;
  roundWins: number;
  matchWins: number;
  matchLosses: number;
  pistolRounds: number;
  pistolWins: number;
  tSideRounds: number;
  ctSideRounds: number;
  plants: number;
  detonations: number;
  defuses: number;
  timeOuts: number;
  totalKills: number;
};

const HALF_LENGTH = 12;

const Comparison: React.FC<ComparisonProps> = ({ matches }) => {
  const [selectedMap, setSelectedMap] = useState<string>('');
  const [teamA, setTeamA] = useState<string>('');
  const [teamB, setTeamB] = useState<string>('');

  const mapOptions = useMemo(() => {
    return Array.from(new Set(matches.map(m => m.mapName))).sort();
  }, [matches]);

  const teamOptions = useMemo(() => {
    const teams = new Set<string>();
    matches.forEach(m => {
      teams.add(m.teamA.name);
      teams.add(m.teamB.name);
    });
    return Array.from(teams).sort();
  }, [matches]);

  const teamLogos = useMemo(() => {
    const logos: Record<string, string> = {};
    matches.forEach(m => {
      if (m.teamA.logo && !logos[m.teamA.name]) logos[m.teamA.name] = m.teamA.logo;
      if (m.teamB.logo && !logos[m.teamB.name]) logos[m.teamB.name] = m.teamB.logo;
    });
    return logos;
  }, [matches]);

  useEffect(() => {
    if (!teamA && teamOptions.length > 0) setTeamA(teamOptions[0]);
    if (!teamB && teamOptions.length > 1) setTeamB(teamOptions[1]);
  }, [teamOptions, teamA, teamB]);

  useEffect(() => {
    if (teamA && teamB && teamA === teamB) {
      const alternative = teamOptions.find(t => t !== teamA);
      if (alternative) setTeamB(alternative);
    }
  }, [teamA, teamB, teamOptions]);

  const filteredMatches = useMemo(() => {
    if (!selectedMap) return matches;
    return matches.filter(m => m.mapName === selectedMap);
  }, [matches, selectedMap]);

  const getTeamSideForRound = (match: Match, teamName: string, roundNumber: number): TeamSide | null => {
    const teamAStartingSide = match.teamA.side;
    const oppositeSide = teamAStartingSide === TeamSide.CT ? TeamSide.T : TeamSide.CT;
    const teamASideForRound = (num: number): TeamSide => {
      if (num <= HALF_LENGTH) return teamAStartingSide;
      if (num <= HALF_LENGTH * 2) return oppositeSide;
      const otIndex = num - (HALF_LENGTH * 2) - 1;
      const offsetInBlock = otIndex % 6;
      const firstThree = offsetInBlock < 3;
      return firstThree ? oppositeSide : teamAStartingSide;
    };

    if (match.teamA.name === teamName) return teamASideForRound(roundNumber);
    if (match.teamB.name === teamName) {
      const aSide = teamASideForRound(roundNumber);
      return aSide === TeamSide.CT ? TeamSide.T : TeamSide.CT;
    }
    return null;
  };

  const computeTeamStats = (teamName: string): TeamStats | null => {
    if (!teamName) return null;
    const stats: TeamStats = {
      teamName,
      matchesPlayed: 0,
      roundsPlayed: 0,
      roundWins: 0,
      matchWins: 0,
      matchLosses: 0,
      pistolRounds: 0,
      pistolWins: 0,
      tSideRounds: 0,
      ctSideRounds: 0,
      plants: 0,
      detonations: 0,
      defuses: 0,
      timeOuts: 0,
      totalKills: 0,
    };

    filteredMatches.forEach(match => {
      const isTeamInMatch = match.teamA.name === teamName || match.teamB.name === teamName;
      if (!isTeamInMatch) return;

      stats.matchesPlayed++;
      let teamRoundWins = 0;

      match.rounds.forEach(round => {
        const teamSide = getTeamSideForRound(match, teamName, round.number);
        if (!teamSide) return;

        stats.roundsPlayed++;
        stats.totalKills += round.totalKills;

        if (teamSide === TeamSide.T) stats.tSideRounds++;
        if (teamSide === TeamSide.CT) stats.ctSideRounds++;

        const didTeamWin = round.winnerSide === teamSide;
        if (didTeamWin) {
          stats.roundWins++;
          teamRoundWins++;
        }

        if (round.number === 1 || round.number === 13) {
          stats.pistolRounds++;
          if (didTeamWin) stats.pistolWins++;
        }

        if (teamSide === TeamSide.T && round.bombPlanted) stats.plants++;
        if (teamSide === TeamSide.T && round.endReason === RoundEndReason.TargetBombed) stats.detonations++;
        if (teamSide === TeamSide.CT && round.endReason === RoundEndReason.BombDefused) stats.defuses++;
        if (round.endReason === RoundEndReason.TargetSaved) stats.timeOuts++;
      });

      const opponentRoundWins = match.rounds.length - teamRoundWins;
      if (teamRoundWins > opponentRoundWins) stats.matchWins++;
      else stats.matchLosses++;
    });

    return stats;
  };

  const teamAStats = useMemo(() => computeTeamStats(teamA), [teamA, filteredMatches]);
  const teamBStats = useMemo(() => computeTeamStats(teamB), [teamB, filteredMatches]);

  const buildMetrics = (stats: TeamStats | null) => {
    if (!stats) {
      return {
        roundWinRate: 0,
        pistolWinRate: 0,
        plantRate: 0,
        detonationRate: 0,
        defuseRate: 0,
        avgKills: 0,
      };
    }
    return {
      roundWinRate: stats.roundsPlayed ? (stats.roundWins / stats.roundsPlayed) * 100 : 0,
      pistolWinRate: stats.pistolRounds ? (stats.pistolWins / stats.pistolRounds) * 100 : 0,
      plantRate: stats.tSideRounds ? (stats.plants / stats.tSideRounds) * 100 : 0,
      detonationRate: stats.tSideRounds ? (stats.detonations / stats.tSideRounds) * 100 : 0,
      defuseRate: stats.ctSideRounds ? (stats.defuses / stats.ctSideRounds) * 100 : 0,
      avgKills: stats.roundsPlayed ? stats.totalKills / stats.roundsPlayed : 0,
    };
  };

  const teamAMetrics = buildMetrics(teamAStats);
  const teamBMetrics = buildMetrics(teamBStats);

  const comparisonData = [
    { metric: 'Win rate (rounds)', [teamA || 'Time A']: teamAMetrics.roundWinRate, [teamB || 'Time B']: teamBMetrics.roundWinRate },
    { metric: 'Pistol win %', [teamA || 'Time A']: teamAMetrics.pistolWinRate, [teamB || 'Time B']: teamBMetrics.pistolWinRate },
    { metric: 'Plant rate (T)', [teamA || 'Time A']: teamAMetrics.plantRate, [teamB || 'Time B']: teamBMetrics.plantRate },
    { metric: 'Detonation rate (T)', [teamA || 'Time A']: teamAMetrics.detonationRate, [teamB || 'Time B']: teamBMetrics.detonationRate },
    { metric: 'Defuse rate (CT)', [teamA || 'Time A']: teamAMetrics.defuseRate, [teamB || 'Time B']: teamBMetrics.defuseRate },
    { metric: 'Kills médios/round', [teamA || 'Time A']: teamAMetrics.avgKills, [teamB || 'Time B']: teamBMetrics.avgKills },
  ];

  const insights = useMemo(() => {
    const pickLeader = (a: number, b: number, metric: string, suffix = '%') => {
      if (!teamA || !teamB) return null;
      if (a === b) return {
        title: `Equilíbrio em ${metric}`,
        detail: `${teamA} e ${teamB} estão empatados (${a.toFixed(1)}${suffix}).`
      };
      const leader = a > b ? teamA : teamB;
      const leadValue = Math.max(a, b);
      return {
        title: `${leader} lidera em ${metric}`,
        detail: `Vantagem de ${leadValue.toFixed(1)}${suffix}.`
      };
    };

    return [
      pickLeader(teamAMetrics.roundWinRate, teamBMetrics.roundWinRate, 'Win Rate (rounds)'),
      pickLeader(teamAMetrics.pistolWinRate, teamBMetrics.pistolWinRate, 'Pistol win'),
      pickLeader(teamAMetrics.plantRate, teamBMetrics.plantRate, 'Plant rate', '%'),
      pickLeader(teamAMetrics.defuseRate, teamBMetrics.defuseRate, 'Defuse rate', '%'),
      pickLeader(teamAMetrics.avgKills, teamBMetrics.avgKills, 'Kills médios', ''),
    ].filter(Boolean) as { title: string; detail: string }[];
  }, [teamA, teamB, teamAMetrics, teamBMetrics]);

  const StatCard = ({ title, value, subtext, color }: { title: string; value: string; subtext: string; color: string }) => (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-xl shadow-[0_6px_16px_rgba(0,0,0,0.2)]">
      <div className={`text-${color}-400 text-xs uppercase tracking-wider mb-2`}>{title}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{subtext}</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Comparação</h1>
            <p className="text-slate-400 text-sm">Comparativo de times por mapa, rounds e objetivos.</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
              <span className="px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700">{filteredMatches.length} partidas</span>
              <span className="px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700">{selectedMap ? `Mapa: ${selectedMap}` : 'Todos os mapas'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-slate-300 text-sm mb-4">
          <Filter size={16} />
          <span>Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm text-slate-400">
            <span className="flex items-center gap-2 mb-2"><Map size={16} />Mapa</span>
            <select
              value={selectedMap}
              onChange={(e) => setSelectedMap(e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos</option>
              {mapOptions.map(map => (
                <option key={map} value={map}>{map}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-400">
            <span className="flex items-center gap-2 mb-2"><Swords size={16} />Time A</span>
            <select
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
            >
              <option value="" disabled>Selecione</option>
              {teamOptions.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-400">
            <span className="flex items-center gap-2 mb-2"><Swords size={16} />Time B</span>
            <select
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
            >
              <option value="" disabled>Selecione</option>
              {teamOptions.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-900/25 to-slate-950 border border-blue-500/30 rounded-2xl p-6 shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
              {teamA && teamLogos[teamA] ? (
                <img src={teamLogos[teamA]} alt={teamA} className="w-full h-full object-contain" />
              ) : (
                <span className="text-blue-300 font-bold">A</span>
              )}
            </div>
            <div>
              <div className="text-blue-100 text-sm uppercase tracking-wider">{teamA || 'Time A'}</div>
              <div className="text-xs text-slate-400">Resumo do time</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Partidas" value={`${teamAStats?.matchesPlayed ?? 0}`} subtext="Jogadas" color="blue" />
            <StatCard title="Rounds" value={`${teamAStats?.roundsPlayed ?? 0}`} subtext="Totais" color="blue" />
            <StatCard title="Win Rate" value={`${teamAMetrics.roundWinRate.toFixed(1)}%`} subtext="Rounds vencidos" color="blue" />
            <StatCard title="Pistol" value={`${teamAMetrics.pistolWinRate.toFixed(1)}%`} subtext="Rounds 1 e 13" color="blue" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/25 to-slate-950 border border-purple-500/30 rounded-2xl p-6 shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
              {teamB && teamLogos[teamB] ? (
                <img src={teamLogos[teamB]} alt={teamB} className="w-full h-full object-contain" />
              ) : (
                <span className="text-purple-300 font-bold">B</span>
              )}
            </div>
            <div>
              <div className="text-purple-100 text-sm uppercase tracking-wider">{teamB || 'Time B'}</div>
              <div className="text-xs text-slate-400">Resumo do time</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Partidas" value={`${teamBStats?.matchesPlayed ?? 0}`} subtext="Jogadas" color="purple" />
            <StatCard title="Rounds" value={`${teamBStats?.roundsPlayed ?? 0}`} subtext="Totais" color="purple" />
            <StatCard title="Win Rate" value={`${teamBMetrics.roundWinRate.toFixed(1)}%`} subtext="Rounds vencidos" color="purple" />
            <StatCard title="Pistol" value={`${teamBMetrics.pistolWinRate.toFixed(1)}%`} subtext="Rounds 1 e 13" color="purple" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Insights automáticos</h3>
            <p className="text-slate-400 text-xs">Destaques com base nos dados filtrados</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                {idx % 3 === 0 ? <Crown size={16} /> : idx % 3 === 1 ? <Zap size={16} /> : <Swords size={16} />}
                <span className="font-semibold">{insight.title}</span>
              </div>
              <p className="text-xs text-slate-400">{insight.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Comparativo de métricas</h3>
            <p className="text-slate-400 text-xs">Indicadores por lado e objetivos</p>
          </div>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                cursor={{ fill: '#334155', opacity: 0.2 }}
              />
              <Legend />
              <Bar dataKey={teamA || 'Time A'} fill="#60a5fa" radius={[4, 4, 0, 0]} />
              <Bar dataKey={teamB || 'Time B'} fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
