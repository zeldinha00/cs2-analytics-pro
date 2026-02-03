import React, { useMemo } from 'react';
import { Match, RoundEndReason, TeamSide } from '../types';
import { 
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Line, ComposedChart
} from 'recharts';
import { Target, Trophy, Clock, Skull, Crosshair, Shield, Zap, Flame, Bomb } from 'lucide-react';

interface DashboardProps {
  matches: Match[];
}

const Dashboard: React.FC<DashboardProps> = ({ matches }) => {
  const [selectedMap, setSelectedMap] = React.useState<string>('');

  // Lista de mapas únicos para filtro
  const mapOptions = useMemo(() => {
    const uniq = Array.from(new Set(matches.map(m => m.mapName))).sort();
    return uniq;
  }, [matches]);

  // Filtrar por mapa quando selecionado
  const filteredMatches = useMemo(() => {
    if (!selectedMap) return matches;
    return matches.filter(m => m.mapName === selectedMap);
  }, [matches, selectedMap]);

  // --- DATA PROCESSING ---

  const stats = useMemo(() => {
    let totalRounds = 0;
    let tWins = 0;
    let ctWins = 0;
    let totalKills = 0;
    let pistolRoundsPlayed = 0;
    let pistolRoundsWonByCT = 0;

    // Bomb metrics
    let totalPlants = 0;
    let totalDetonations = 0;
    let plantsDefused = 0;

    const pistolStats = {
      round1: { count: 0, ctWins: 0, tWins: 0, plants: 0, detonations: 0, defuses: 0 },
      round13: { count: 0, ctWins: 0, tWins: 0, plants: 0, detonations: 0, defuses: 0 }
    };

    // Structure to hold aggregated data per round number (1-30)
    const roundMap: Record<number, {
      kills: number;
      detonations: number;
      defusals: number;
      timeOuts: number;
      plants: number;
      count: number;
    }> = {};

    filteredMatches.forEach(match => {
      match.rounds.forEach(r => {
        totalRounds++;
        totalKills += r.totalKills;
        if (r.winnerSide === TeamSide.T) tWins++;
        else ctWins++;

        // Bomb tracking
        if (r.bombPlanted) totalPlants++;
        if (r.endReason === RoundEndReason.TargetBombed) totalDetonations++;
        if (r.endReason === RoundEndReason.BombDefused) plantsDefused++;

        // Pistol Round Logic (Round 1 and 13 in MR12)
        if (r.number === 1 || r.number === 13) {
          pistolRoundsPlayed++;
          if (r.winnerSide === TeamSide.CT) pistolRoundsWonByCT++;

          const pistolBucket = r.number === 1 ? pistolStats.round1 : pistolStats.round13;
          pistolBucket.count++;
          if (r.winnerSide === TeamSide.CT) pistolBucket.ctWins++;
          if (r.winnerSide === TeamSide.T) pistolBucket.tWins++;
          if (r.bombPlanted) pistolBucket.plants++;
          if (r.endReason === RoundEndReason.TargetBombed) pistolBucket.detonations++;
          if (r.endReason === RoundEndReason.BombDefused) pistolBucket.defuses++;
        }

        // Round Number Aggregation
        if (!roundMap[r.number]) {
          roundMap[r.number] = { kills: 0, detonations: 0, defusals: 0, timeOuts: 0, plants: 0, count: 0 };
        }
        
        roundMap[r.number].count++;
        roundMap[r.number].kills += r.totalKills;

        if (r.endReason === RoundEndReason.TargetBombed) roundMap[r.number].detonations++;
        else if (r.endReason === RoundEndReason.BombDefused) roundMap[r.number].defusals++;
        else if (r.endReason === RoundEndReason.TargetSaved) roundMap[r.number].timeOuts++;

        if (r.bombPlanted) roundMap[r.number].plants++;
      });
    });

    // Convert Map to Array for Charts
    const roundTrendData = Object.keys(roundMap).map(key => {
      const k = parseInt(key);
      const d = roundMap[k];
      return {
        round: `R${k}`,
        roundNum: k,
        avgKills: parseFloat((d.kills / d.count).toFixed(1)),
        detonations: d.detonations,
        defusals: d.defusals,
        timeOuts: d.timeOuts,
        plants: d.plants
      };
    }).sort((a, b) => a.roundNum - b.roundNum);

    // Find "Most X" Rounds
    let maxDetonationRound = { round: 'Nenhum', count: 0 };
    let maxKillRound = { round: 'Nenhum', avg: 0 };
    let maxDefuseRound = { round: 'Nenhum', count: 0 };
    let maxTimeRound = { round: 'Nenhum', count: 0 };

    roundTrendData.forEach(d => {
      if (d.detonations > maxDetonationRound.count) maxDetonationRound = { round: d.round, count: d.detonations };
      if (d.roundNum >= 1 && d.roundNum <= 24 && d.avgKills > maxKillRound.avg) {
        maxKillRound = { round: d.round, avg: d.avgKills };
      }
      if (d.defusals > maxDefuseRound.count) maxDefuseRound = { round: d.round, count: d.defusals };
      if (d.timeOuts > maxTimeRound.count) maxTimeRound = { round: d.round, count: d.timeOuts };
    });

    // Calculate advanced metrics
    const plantToDetonationRate = totalPlants > 0 ? ((totalDetonations / totalPlants) * 100).toFixed(1) : '0';
    const defuseSuccessRate = totalPlants > 0 ? ((plantsDefused / totalPlants) * 100).toFixed(1) : '0';
    const plantRate = totalRounds > 0 ? ((totalPlants / totalRounds) * 100).toFixed(1) : '0';
    const detonationRate = totalRounds > 0 ? ((totalDetonations / totalRounds) * 100).toFixed(1) : '0';
    const defuseRate = totalRounds > 0 ? ((plantsDefused / totalRounds) * 100).toFixed(1) : '0';

    return {
      totalMatches: filteredMatches.length,
      totalRounds,
      ctWinRate: totalRounds > 0 ? ((ctWins / totalRounds) * 100).toFixed(1) : '0',
      tWinRate: totalRounds > 0 ? ((tWins / totalRounds) * 100).toFixed(1) : '0',
      pistolCtWinRate: pistolRoundsPlayed > 0 ? ((pistolRoundsWonByCT / pistolRoundsPlayed) * 100).toFixed(0) : '0',
      avgKillsPerRound: totalRounds > 0 ? (totalKills / totalRounds).toFixed(2) : '0',
      plantToDetonationRate,
      defuseSuccessRate,
      plantRate,
      detonationRate,
      defuseRate,
      totalPlants,
      totalDetonations,
      plantsDefused,
      pistolStats,
      roundTrendData,
      highlights: {
        maxDetonationRound,
        maxKillRound,
        maxDefuseRound,
        maxTimeRound
      }
    };
  }, [filteredMatches]);

  // Top 5 por mapa (agregado em todas as partidas filtradas)
  const topBombStats = useMemo(() => {
    const agg: Record<string, { 
      map: string; 
      detonations: number; 
      defuses: number; 
      plants: number; 
      totalRounds: number;
      plantsConverted: number; // plants que viraram detonações
    }> = {};

    filteredMatches.forEach(m => {
      if (!agg[m.mapName]) {
        agg[m.mapName] = { map: m.mapName, detonations: 0, defuses: 0, plants: 0, totalRounds: 0, plantsConverted: 0 };
      }
      m.rounds.forEach(r => {
        agg[m.mapName].totalRounds++;
        if (r.endReason === RoundEndReason.TargetBombed) {
          agg[m.mapName].detonations++;
          if (r.bombPlanted) agg[m.mapName].plantsConverted++;
        }
        if (r.endReason === RoundEndReason.BombDefused) agg[m.mapName].defuses++;
        if (r.bombPlanted) agg[m.mapName].plants++;
      });
    });

    const values = Object.values(agg).map(v => ({
      ...v,
      detonationRatio: v.totalRounds > 0 ? (v.detonations / v.totalRounds).toFixed(2) : '0.00',
      defuseRatio: v.totalRounds > 0 ? (v.defuses / v.totalRounds).toFixed(2) : '0.00',
      plantRatio: v.totalRounds > 0 ? (v.plants / v.totalRounds).toFixed(2) : '0.00',
      conversionRate: v.plants > 0 ? ((v.plantsConverted / v.plants) * 100).toFixed(1) : '0.0'
    }));

    const topDet = [...values].sort((a, b) => parseFloat(b.detonationRatio) - parseFloat(a.detonationRatio)).slice(0, 5);
    const topDef = [...values].sort((a, b) => parseFloat(b.defuseRatio) - parseFloat(a.defuseRatio)).slice(0, 5);
    const topPlant = [...values].sort((a, b) => parseFloat(b.plantRatio) - parseFloat(a.plantRatio)).slice(0, 5);

    return { topDet, topDef, topPlant };
  }, [filteredMatches]);

  // Top 5 por número de round (agregado em todas as partidas filtradas)
  const topRoundStats = useMemo(() => {
    const roundAgg: Record<number, { detonations: number; defuses: number; plants: number; kills: number; count: number }> = {};

    filteredMatches.forEach(m => {
      m.rounds.forEach(r => {
        if (!roundAgg[r.number]) {
          roundAgg[r.number] = { detonations: 0, defuses: 0, plants: 0, kills: 0, count: 0 };
        }
        const bucket = roundAgg[r.number];
        bucket.count++;
        bucket.kills += r.totalKills;
        if (r.endReason === RoundEndReason.TargetBombed) bucket.detonations++;
        if (r.endReason === RoundEndReason.BombDefused) bucket.defuses++;
        if (r.bombPlanted) bucket.plants++;
      });
    });

    const entries = Object.entries(roundAgg).map(([round, data]) => ({
      round: Number(round),
      detonations: data.detonations,
      defuses: data.defuses,
      plants: data.plants,
      avgKills: data.count ? data.kills / data.count : 0
    }));

    const topDet = [...entries].sort((a, b) => b.detonations - a.detonations).slice(0, 5);
    const topDef = [...entries].sort((a, b) => b.defuses - a.defuses).slice(0, 5);
    const topPlant = [...entries].sort((a, b) => b.plants - a.plants).slice(0, 5);
    const topKills = [...entries]
      .filter(e => e.round >= 1 && e.round <= 24)
      .sort((a, b) => b.avgKills - a.avgKills)
      .slice(0, 5);

    return { topDet, topDef, topPlant, topKills };
  }, [filteredMatches]);

  // --- CHART CONFIG ---
  
  const COLORS = {
    plant: '#f97316',       // Orange
    detonation: '#eab308',  // Yellow
    defuse: '#3b82f6',      // Blue
    time: '#22c55e',        // Green
    kills: '#ef4444'        // Red
  };

  const StatCard = ({ title, value, icon, subtext, color = "blue" }: any) => (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 text-${color}-500`}>
        {React.cloneElement(icon, { size: 64 })}
      </div>
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center text-${color}-400 mb-4`}>
          {icon}
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-xs text-slate-500 mt-2">{subtext}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inteligência de Partidas</h1>
          <p className="text-slate-400 text-sm">Visão estratégica da dinâmica dos rounds e do controle de objetivos.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex gap-4 text-sm text-slate-400 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 px-4 py-2 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Vitórias CT {stats.ctWinRate}%
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Vitórias T {stats.tWinRate}%
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 px-3 py-2 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.25)] text-sm text-slate-200">
            <span className="text-slate-400">Mapa:</span>
            <select
              value={selectedMap}
              onChange={(e) => setSelectedMap(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos</option>
              {mapOptions.map(map => (
                <option key={map} value={map}>{map}</option>
              ))}
            </select>
            {selectedMap && (
              <button
                onClick={() => setSelectedMap('')}
                className="text-blue-400 hover:underline text-xs"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. KEY PERFORMANCE INDICATORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Kills Médios / Round" 
          value={stats.avgKillsPerRound}
          icon={<Crosshair size={24} />}
          subtext="Média global por round"
          color="red"
        />
        <StatCard 
          title="Taxa de Plant" 
          value={`${stats.plantRate}%`}
          icon={<Bomb size={24} />}
          subtext={`${stats.totalPlants} plantas registradas`}
          color="orange"
        />
        <StatCard 
          title="Taxa de Detonação" 
          value={`${stats.detonationRate}%`}
          icon={<Flame size={24} />}
          subtext={`${stats.totalDetonations} explosões confirmadas`}
          color="yellow"
        />
        <StatCard 
          title="Taxa de Defuse" 
          value={`${stats.defuseRate}%`}
          icon={<Shield size={24} />}
          subtext={`${stats.plantsDefused} desarmes realizados`}
          color="blue"
        />
        <StatCard 
          title="Pistol CT Win %" 
          value={`${stats.pistolCtWinRate}%`}
          icon={<Target size={24} />}
          subtext="Rounds 1 & 13"
          color="purple"
        />
      </div>

      {/* NEW: BOMB INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-900/20 to-slate-900 border border-orange-500/30 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Bomb className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Conversão de Plant</h3>
              <p className="text-slate-400 text-xs">Plantas que viram detonação</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-400 mb-2">{stats.plantToDetonationRate}%</div>
          <p className="text-slate-300 text-sm">
            De <span className="text-orange-400 font-semibold">{stats.totalPlants}</span> plantas, 
            {' '}<span className="text-orange-400 font-semibold">{stats.totalDetonations}</span> detonaram.
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/20 to-slate-900 border border-yellow-500/30 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Flame className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Detonação por Round</h3>
              <p className="text-slate-400 text-xs">Frequência média de explosões</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.detonationRate}%</div>
          <p className="text-slate-300 text-sm">
            Em média, <span className="text-yellow-400 font-semibold">{stats.detonationRate}%</span> dos rounds terminam em explosão.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/30 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Defuse por Plant</h3>
              <p className="text-slate-400 text-xs">Eficiência de retomadas CT</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-2">{stats.defuseSuccessRate}%</div>
          <p className="text-slate-300 text-sm">
            <span className="text-blue-400 font-semibold">{stats.plantsDefused}</span> defuses em 
            {' '}<span className="text-blue-400 font-semibold">{stats.totalPlants}</span> plants.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. ROUND OUTCOME TRENDS (Main Chart) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Análise de Resultado do Round</h3>
              <p className="text-slate-400 text-xs">Eventos por número de round específico (Agregado)</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1 text-slate-300"><span className="w-3 h-3 bg-yellow-500 rounded-sm"></span> Detonação</div>
              <div className="flex items-center gap-1 text-slate-300"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Defuse</div>
              <div className="flex items-center gap-1 text-slate-300"><span className="w-3 h-3 bg-orange-500 rounded-sm"></span> Bomba Plantada</div>
              <div className="flex items-center gap-1 text-slate-300"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Kills Média</div>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.roundTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="round" stroke="#94a3b8" tick={{fontSize: 12}} />
                <YAxis yAxisId="left" stroke="#94a3b8" tick={{fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" domain={[0, 10]} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  cursor={{fill: '#334155', opacity: 0.2}}
                />
                
                {/* Outcome Stack */}
                <Bar yAxisId="left" dataKey="detonations" stackId="a" fill={COLORS.detonation} name="Detonações" />
                <Bar yAxisId="left" dataKey="defusals" stackId="a" fill={COLORS.defuse} name="Defuses" />
                <Bar yAxisId="left" dataKey="timeOuts" stackId="a" fill={COLORS.time} name="Tempo Esgotado" />
                <Bar yAxisId="left" dataKey="plants" stackId="a" fill={COLORS.plant} name="Bomba Plantada" radius={[4, 4, 0, 0]} />

                {/* Avg Kills Line Overlay */}
                <Line yAxisId="right" type="monotone" dataKey="avgKills" stroke="#ef4444" strokeWidth={2} dot={{r: 3, fill: '#ef4444'}} name="Média Kills" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 3. ROUND HIGHLIGHTS (Specific Stats) */}
        <div className="space-y-4">
           {/* Highlight Card 1 - Detonations */}
           <div className="bg-gradient-to-br from-yellow-900/40 to-slate-800 border border-yellow-500/30 p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                    <Flame size={20} />
                 </div>
                 <span className="text-yellow-100 font-semibold text-sm uppercase tracking-wider">Bomba Detonada</span>
              </div>
              <div className="flex justify-between items-end">
                 <div>
                    <span className="text-2xl font-bold text-white">{stats.highlights.maxDetonationRound.round}</span>
                    <span className="text-slate-400 text-xs block">Maior taxa de detonação</span>
                 </div>
                 <div className="text-3xl font-black text-yellow-500 opacity-80">{stats.highlights.maxDetonationRound.count}</div>
              </div>
           </div>

           {/* Highlight Card 2 - Defusals */}
           <div className="bg-gradient-to-br from-blue-900/40 to-slate-800 border border-blue-500/30 p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                    <Shield size={20} />
                 </div>
                 <span className="text-blue-100 font-semibold text-sm uppercase tracking-wider">Bomba Defusada</span>
              </div>
              <div className="flex justify-between items-end">
                 <div>
                    <span className="text-2xl font-bold text-white">{stats.highlights.maxDefuseRound.round}</span>
                    <span className="text-slate-400 text-xs block">Mais desarmes ocorreram</span>
                 </div>
                 <div className="text-3xl font-black text-blue-500 opacity-80">{stats.highlights.maxDefuseRound.count}</div>
              </div>
           </div>

           {/* Highlight Card 3 - Time Outs */}
           <div className="bg-gradient-to-br from-green-900/40 to-slate-800 border border-green-500/30 p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                    <Clock size={20} />
                 </div>
                 <span className="text-green-100 font-semibold text-sm uppercase tracking-wider">Finalizado por Tempo</span>
              </div>
              <div className="flex justify-between items-end">
                 <div>
                    <span className="text-2xl font-bold text-white">{stats.highlights.maxTimeRound.round}</span>
                    <span className="text-slate-400 text-xs block">Termina por tempo frequentemente</span>
                 </div>
                 <div className="text-3xl font-black text-green-500 opacity-80">{stats.highlights.maxTimeRound.count}</div>
              </div>
           </div>
        </div>
      </div>

      {/* PISTOL ROUND ANALYSIS */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Análise de Pistol Rounds (R1 e R13)</h3>
          </div>
          <span className="text-sm text-slate-400">Desempenho específico de pistol rounds</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["round1", "round13"] as const).map((key, idx) => {
            const data = stats.pistolStats[key];
            const ctRate = data.count > 0 ? ((data.ctWins / data.count) * 100).toFixed(0) : '0';
            const tRate = data.count > 0 ? ((data.tWins / data.count) * 100).toFixed(0) : '0';
            return (
              <div key={key} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white font-semibold">Pistol Round R{idx === 0 ? 1 : 13}</div>
                  <div className="text-slate-400 text-xs">{data.count} ocorrências</div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-3">
                    <div className="text-blue-300 text-xs">Vitória CT</div>
                    <div className="text-2xl font-bold text-blue-400">{ctRate}%</div>
                    <div className="text-slate-400 text-xs">{data.ctWins} vitórias</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3">
                    <div className="text-yellow-300 text-xs">Vitória T</div>
                    <div className="text-2xl font-bold text-yellow-400">{tRate}%</div>
                    <div className="text-slate-400 text-xs">{data.tWins} vitórias</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
                  <div className="bg-slate-800/80 rounded-md p-2 border border-slate-700">
                    <div className="text-slate-400">Plantas</div>
                    <div className="font-semibold text-white">{data.plants}</div>
                  </div>
                  <div className="bg-slate-800/80 rounded-md p-2 border border-slate-700">
                    <div className="text-slate-400">Detonações</div>
                    <div className="font-semibold text-white">{data.detonations}</div>
                  </div>
                  <div className="bg-slate-800/80 rounded-md p-2 border border-slate-700">
                    <div className="text-slate-400">Defuses</div>
                    <div className="font-semibold text-white">{data.defuses}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. TOP 5 BOMB EVENTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Top 5 Bombas Detonadas</h3>
            </div>
              <span className="text-sm text-slate-400">Explosões por mapa</span>
          </div>
          <div className="space-y-3">
            {topBombStats.topDet.map((item, idx) => (
              <div key={item.map} className="bg-gradient-to-r from-yellow-900/20 to-transparent border border-slate-800 rounded-lg px-4 py-3 hover:border-yellow-500/50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-black text-slate-600">#{idx + 1}</div>
                    <div>
                      <div className="text-white font-semibold">{item.map}</div>
                      <div className="text-slate-400 text-xs">{item.detonations} explosões em {item.totalRounds} rounds</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold text-xl">{item.detonationRatio}</div>
                    <div className="text-slate-400 text-xs">por round</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
                  <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, parseFloat(item.detonationRatio) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-300 font-semibold min-w-[60px] text-right">
                    {(parseFloat(item.detonationRatio) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">Frequência média de detonação</div>
              </div>
            ))}
            {topBombStats.topDet.length === 0 && (
              <div className="text-slate-400 text-sm">Nenhum dado disponível.</div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Top 5 Bombas Defusadas</h3>
            </div>
            <span className="text-sm text-slate-400">Defuses por mapa</span>
          </div>
          <div className="space-y-3">
            {topBombStats.topDef.map((item, idx) => (
              <div key={item.map} className="bg-gradient-to-r from-blue-900/20 to-transparent border border-slate-800 rounded-lg px-4 py-3 hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-black text-slate-600">#{idx + 1}</div>
                    <div>
                      <div className="text-white font-semibold">{item.map}</div>
                      <div className="text-slate-400 text-xs">{item.defuses} defuses em {item.totalRounds} rounds</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-400 font-bold text-xl">{item.defuseRatio}</div>
                    <div className="text-slate-400 text-xs">por round</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
                  <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, parseFloat(item.defuseRatio) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-300 font-semibold min-w-[60px] text-right">
                    {(parseFloat(item.defuseRatio) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">Frequência média de defuse</div>
              </div>
            ))}
            {topBombStats.topDef.length === 0 && (
              <div className="text-slate-400 text-sm">Nenhum dado disponível.</div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bomb className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Top 5 Bombas Plantadas</h3>
            </div>
            <span className="text-sm text-slate-400">Plantas por mapa</span>
          </div>
          <div className="space-y-3">
            {topBombStats.topPlant.map((item, idx) => (
              <div key={item.map} className="bg-gradient-to-r from-orange-900/20 to-transparent border border-slate-800 rounded-lg px-4 py-3 hover:border-orange-500/50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-black text-slate-600">#{idx + 1}</div>
                    <div>
                      <div className="text-white font-semibold">{item.map}</div>
                      <div className="text-slate-400 text-xs">{item.plants} plantas em {item.totalRounds} rounds</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-400 font-bold text-xl">{item.plantRatio}</div>
                    <div className="text-slate-400 text-xs">por round</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
                  <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${item.conversionRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-300 font-semibold min-w-[60px] text-right">
                    {item.conversionRate}% 💥
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">Conversão de planta em detonação</div>
              </div>
            ))}
            {topBombStats.topPlant.length === 0 && (
              <div className="text-slate-400 text-sm">Nenhum dado disponível.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Top 5 por Rodada</h3>
          </div>
          <span className="text-sm text-slate-400">Agregado por número de round</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
                <Flame className="w-4 h-4 text-yellow-400" />
                Detonações
              </div>
              <span className="text-xs text-slate-500">Top 5</span>
            </div>
            <div className="space-y-2">
              {topRoundStats.topDet.map((item, idx) => (
                <div key={`det-${item.round}`} className="flex items-center justify-between bg-gradient-to-r from-slate-800/50 to-slate-900/30 border border-slate-800 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                    <div className="text-white font-semibold">R{item.round}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-semibold">{item.detonations}x</div>
                    <div className="text-slate-400 text-xs">detonações</div>
                  </div>
                </div>
              ))}
              {topRoundStats.topDet.length === 0 && (
                <div className="text-slate-400 text-sm">Nenhum dado.</div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
                <Shield className="w-4 h-4 text-blue-400" />
                Defuses
              </div>
              <span className="text-xs text-slate-500">Top 5</span>
            </div>
            <div className="space-y-2">
              {topRoundStats.topDef.map((item, idx) => (
                <div key={`def-${item.round}`} className="flex items-center justify-between bg-gradient-to-r from-slate-800/50 to-slate-900/30 border border-slate-800 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                    <div className="text-white font-semibold">R{item.round}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-400 font-semibold">{item.defuses}x</div>
                    <div className="text-slate-400 text-xs">defuses</div>
                  </div>
                </div>
              ))}
              {topRoundStats.topDef.length === 0 && (
                <div className="text-slate-400 text-sm">Nenhum dado.</div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
                <Bomb className="w-4 h-4 text-orange-400" />
                Plants
              </div>
              <span className="text-xs text-slate-500">Top 5</span>
            </div>
            <div className="space-y-2">
              {topRoundStats.topPlant.map((item, idx) => (
                <div key={`plant-${item.round}`} className="flex items-center justify-between bg-gradient-to-r from-slate-800/50 to-slate-900/30 border border-slate-800 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                    <div className="text-white font-semibold">R{item.round}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-400 font-semibold">{item.plants}x</div>
                    <div className="text-slate-400 text-xs">plantas</div>
                  </div>
                </div>
              ))}
              {topRoundStats.topPlant.length === 0 && (
                <div className="text-slate-400 text-sm">Nenhum dado.</div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
                <Crosshair className="w-4 h-4 text-red-400" />
                Kills médios (R1-R24)
              </div>
              <span className="text-xs text-slate-500">Top 5</span>
            </div>
            <div className="space-y-2">
              {topRoundStats.topKills.map((item, idx) => (
                <div key={`kill-${item.round}`} className="flex items-center justify-between bg-gradient-to-r from-slate-800/50 to-slate-900/30 border border-slate-800 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                    <div className="text-white font-semibold">R{item.round}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 font-semibold">{item.avgKills.toFixed(1)}</div>
                    <div className="text-slate-400 text-xs">média de kills</div>
                  </div>
                </div>
              ))}
              {topRoundStats.topKills.length === 0 && (
                <div className="text-slate-400 text-sm">Nenhum dado.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
