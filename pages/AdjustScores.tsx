import React, { useState, useEffect } from 'react';
import { Match, TeamSide } from '../types';
import { Save, RotateCcw, AlertCircle, Trash2 } from 'lucide-react';
import supabaseService from '../services/supabaseService';

interface AdjustScoresProps {
  matches: Match[];
  onUpdate: (matchId: string, updates: any) => Promise<void>;
}

const AdjustScores: React.FC<AdjustScoresProps> = ({ matches, onUpdate }) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [missingRounds, setMissingRounds] = useState<string[] | null>(null);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  // Filtrar matches pela busca
  const filteredMatches = matches.filter(match => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      match.teamA.name.toLowerCase().includes(query) ||
      match.teamB.name.toLowerCase().includes(query) ||
      match.mapName.toLowerCase().includes(query)
    );
  });

  // Atualizar formData quando o selectedMatch muda (após reload dos dados)
  useEffect(() => {
    if (selectedMatch && selectedMatchId) {
      console.log('🔄 Atualizando formData com dados recarregados:', selectedMatch);
      setFormData({
        teamA_name: selectedMatch.teamA.name,
        teamA_score: selectedMatch.teamA.score,
        teamA_side: selectedMatch.teamA.side,
        teamB_name: selectedMatch.teamB.name,
        teamB_score: selectedMatch.teamB.score,
        teamB_side: selectedMatch.teamB.side,
      });
    }
  }, [selectedMatch, selectedMatchId]);

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setMessage(null);
  };

  const handleSwapSides = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      teamA_side: formData.teamA_side === TeamSide.T ? TeamSide.CT : TeamSide.T,
      teamB_side: formData.teamB_side === TeamSide.T ? TeamSide.CT : TeamSide.T,
    });
  };

  const handleSwapScores = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      teamA_score: formData.teamB_score,
      teamB_score: formData.teamA_score,
    });
  };

  const handleReset = () => {
    if (selectedMatch) {
      setFormData({
        teamA_name: selectedMatch.teamA.name,
        teamA_score: selectedMatch.teamA.score,
        teamA_side: selectedMatch.teamA.side,
        teamB_name: selectedMatch.teamB.name,
        teamB_score: selectedMatch.teamB.score,
        teamB_side: selectedMatch.teamB.side,
      });
    }
  };

  const handleSave = async () => {
    if (!selectedMatchId || !formData) return;
    
    try {
      setLoading(true);
      console.log('💾 Salvando mudanças:', selectedMatchId, formData);
      
      await supabaseService.updateMatch(selectedMatchId, formData);
      
      console.log('✅ Atualizado no banco de dados');
      setMessage({ type: 'success', text: 'Match atualizado com sucesso!' });
      
      // Chamar callback do pai para recarregar todos os matches
      await onUpdate(selectedMatchId, formData);
      
      // Aguardar a recarga ser completa
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('❌ Erro:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar match: ' + (error as any).message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMatchId) return;''

    try {
      setLoading(true);
      console.log('🗑️ Deletando match:', selectedMatchId);
      
      await supabaseService.deleteMatch(selectedMatchId);
      
      console.log('✅ Match deletado com sucesso');
      setMessage({ type: 'success', text: 'Match deletado com sucesso!' });
      setShowDeleteConfirm(false);
      setSelectedMatchId(null);
      setFormData(null);
      
      // Recarregar matches sem tentar atualizar o match deletado
      // Apenas recarrega a lista chamando onUpdate sem matchId
      await new Promise(resolve => setTimeout(resolve, 500));
      await onUpdate('', {});
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('❌ Erro ao deletar:', error);
      setMessage({ type: 'error', text: 'Erro ao deletar match: ' + (error as any).message });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIntegrity = async () => {
    try {
      setCheckingIntegrity(true);
      const missing = await supabaseService.getMatchesMissingRounds();
      setMissingRounds(missing);
    } catch (e) {
      console.error('Erro ao verificar integridade:', e);
      setMissingRounds([]);
    } finally {
      setCheckingIntegrity(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-amber-900/20 border border-amber-700/50 rounded-2xl">
        <AlertCircle className="text-amber-500 flex-shrink-0" size={24} />
        <div>
          <p className="font-semibold text-amber-400">Painel de Ajustes Manual</p>
          <p className="text-amber-300/80 text-sm">Aqui você pode corrigir lados e placares de matches que ficaram errados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Matches */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Matches</h2>
              <button
                onClick={handleCheckIntegrity}
                disabled={checkingIntegrity}
                className="px-3 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-600 text-white rounded-lg border border-amber-500/40 disabled:opacity-50"
                title="Verificar partidas sem rounds"
              >
                {checkingIntegrity ? 'Verificando...' : 'Verificar Rounds'}
              </button>
            </div>
            
            {/* Campo de Busca */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar times ou mapa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/70 border border-slate-700 text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 text-sm placeholder-slate-500"
              />
              {searchQuery && (
                <div className="text-xs text-slate-400 mt-2">
                  {filteredMatches.length} resultado{filteredMatches.length !== 1 ? 's' : ''} encontrado{filteredMatches.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {missingRounds && (
                <div className="mb-3 p-3 rounded-lg bg-amber-900/20 border border-amber-700/40 text-amber-300 text-xs">
                  <div className="font-bold mb-1">Partidas sem rounds ({missingRounds.length}):</div>
                  {missingRounds.length === 0 ? (
                    <div>Nenhuma partida sem rounds encontrada.</div>
                  ) : (
                    <ul className="list-disc pl-5 space-y-1">
                      {missingRounds.map(id => (
                        <li key={id} className="font-mono text-amber-200">{id}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {filteredMatches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => handleSelectMatch(match.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    selectedMatchId === match.id
                      ? 'bg-blue-600/20 text-white border-blue-500/30'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="font-semibold text-sm truncate">
                    {match.teamA.name} vs {match.teamB.name}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {match.mapName} • {match.teamA.score}x{match.teamB.score}
                  </div>
                </button>
              ))}
              {filteredMatches.length === 0 && (
                <div className="text-center text-slate-500 py-8 text-sm">
                  Nenhuma partida encontrada
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {selectedMatch && formData ? (
            <div className="space-y-4">
              {/* Status Message */}
              {message && (
                <div className={`p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-900/30 border border-green-700/50 text-green-400'
                    : 'bg-red-900/30 border border-red-700/50 text-red-400'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Match Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-bold text-white">
                  {selectedMatch.mapName} • {selectedMatch.date}
                </h2>

                {/* Score Editor */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-300">Placar</h3>
                  
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Team A */}
                    <div className="space-y-2">
                      <label className="block text-sm text-slate-400">{formData.teamA_name}</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.teamA_score}
                        onChange={(e) => setFormData({ ...formData, teamA_score: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 text-center text-2xl font-bold"
                      />
                    </div>

                    {/* Vs */}
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-slate-500 text-sm">vs</span>
                      <button
                        onClick={handleSwapScores}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-semibold transition-colors"
                        title="Trocar placares"
                      >
                        ⇄
                      </button>
                    </div>

                    {/* Team B */}
                    <div className="space-y-2">
                      <label className="block text-sm text-slate-400">{formData.teamB_name}</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.teamB_score}
                        onChange={(e) => setFormData({ ...formData, teamB_score: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 text-center text-2xl font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Sides Editor */}
                <div className="space-y-4 border-t border-slate-700 pt-4">
                  <h3 className="font-semibold text-slate-300">Lados Iniciais</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Team A Side */}
                    <div className="space-y-2">
                      <label className="block text-sm text-slate-400">{formData.teamA_name} começou como</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFormData({ ...formData, teamA_side: TeamSide.T })}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                            formData.teamA_side === TeamSide.T
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          T
                        </button>
                        <button
                          onClick={() => setFormData({ ...formData, teamA_side: TeamSide.CT })}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                            formData.teamA_side === TeamSide.CT
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          CT
                        </button>
                      </div>
                    </div>

                    {/* Team B Side */}
                    <div className="space-y-2">
                      <label className="block text-sm text-slate-400">{formData.teamB_name} começou como</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFormData({ ...formData, teamB_side: TeamSide.T })}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                            formData.teamB_side === TeamSide.T
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          T
                        </button>
                        <button
                          onClick={() => setFormData({ ...formData, teamB_side: TeamSide.CT })}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                            formData.teamB_side === TeamSide.CT
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          CT
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <button
                    onClick={handleSwapSides}
                    className="w-full mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm font-semibold"
                  >
                    🔄 Trocar todos os lados
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t border-slate-700 pt-4">
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors font-semibold disabled:opacity-50"
                  >
                    <RotateCcw size={18} />
                    Resetar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                  >
                    <Save size={18} />
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-900 hover:bg-red-800 text-red-200 rounded-lg transition-colors font-semibold disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    Deletar
                  </button>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-red-700/50 rounded-2xl p-6 max-w-sm w-full space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-900/30 rounded-lg">
                          <AlertCircle className="text-red-500" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Deletar Match?</h3>
                      </div>
                      
                      <p className="text-slate-300">
                        Tem certeza que deseja deletar <span className="font-semibold">{selectedMatch?.teamA.name} vs {selectedMatch?.teamB.name}</span>?
                      </p>
                      
                      <p className="text-sm text-red-400 font-semibold">
                        ⚠️ Esta ação é irreversível e removerá o match e todas as suas rodadas do banco de dados.
                      </p>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors font-semibold disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                        >
                          {loading ? 'Deletando...' : 'Deletar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <p>Selecione um match para editar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdjustScores;
