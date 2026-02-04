import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Edit2, Save, X, Plus, TrendingUp, TrendingDown, DollarSign, Target, BarChart3, PieChart, ChevronLeft, ChevronRight } from 'lucide-react';
import supabaseService from '../services/supabaseService';
import { Bet, BetStatus, CashAccount } from '../types';

interface BetsProps {
  userId: string;
}

export default function Bets({ userId }: BetsProps) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [showNewBetForm, setShowNewBetForm] = useState(false);
  const [showNewCashForm, setShowNewCashForm] = useState(false);
  const [editingBetId, setEditingBetId] = useState<string | null>(null);
  const [editingCashId, setEditingCashId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Carrossel ref
  const carouselRef = useRef<HTMLDivElement>(null);

  // Form states
  const [newBet, setNewBet] = useState({
    bettingHouse: '',
    betAmount: '',
    odd: '',
    betStatus: BetStatus.PENDING,
    notes: ''
  });

  const [newCash, setNewCash] = useState({
    bettingHouse: '',
    initialBalance: ''
  });

  const [editBetData, setEditBetData] = useState<Partial<Bet>>({});
  const [editCashData, setEditCashData] = useState<{ initialBalance: number }>({ initialBalance: 0 });

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    const [betsData, cashData] = await Promise.all([
      supabaseService.getUserBets(userId),
      supabaseService.getUserCashAccounts(userId)
    ]);
    setBets(betsData);
    setCashAccounts(cashData);
    setLoading(false);
  };

  const handleAddBet = async () => {
    if (!newBet.betAmount || !newBet.odd || !newBet.bettingHouse.trim()) {
      alert('Preencha todos os campos obrigatórios (Casa de Apostas, Valor e Odd)');
      return;
    }

    const betAmount = parseFloat(newBet.betAmount);
    const odd = parseFloat(newBet.odd);
    const potentialReturn = betAmount * odd;

    const createdBet = await supabaseService.createBet({
      userId,
      bettingHouse: newBet.bettingHouse.trim().toUpperCase(),
      betAmount,
      odd,
      potentialReturn,
      betStatus: newBet.betStatus,
      betDate: new Date().toISOString(),
      notes: newBet.notes || undefined
    });

    if (createdBet) {
      setBets([createdBet, ...bets]);
      setNewBet({
        bettingHouse: '',
        betAmount: '',
        odd: '',
        betStatus: BetStatus.PENDING,
        notes: ''
      });
      setShowNewBetForm(false);
    }
  };

  const handleUpdateBet = async (betId: string) => {
    if (!editBetData.betAmount || !editBetData.odd || !editBetData.bettingHouse?.trim()) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const potentialReturn = editBetData.betAmount * editBetData.odd;

    const updated = await supabaseService.updateBet(betId, {
      ...editBetData,
      potentialReturn
    } as Partial<Bet>);

    if (updated) {
      setBets(bets.map(b => b.id === betId ? updated : b));
      setEditingBetId(null);
    }
  };

  const handleDeleteBet = async (betId: string) => {
    if (confirm('Tem certeza que deseja deletar esta aposta?')) {
      const success = await supabaseService.deleteBet(betId);
      if (success) {
        setBets(bets.filter(b => b.id !== betId));
      }
    }
  };

  const handleAddCashAccount = async () => {
    if (!newCash.initialBalance || !newCash.bettingHouse.trim()) {
      alert('Informe a casa de apostas e o saldo inicial');
      return;
    }

    // Verificar se já existe conta para esta casa
    const normalizedHouse = newCash.bettingHouse.trim().toUpperCase();
    const existing = cashAccounts.find(c => c.bettingHouse.toUpperCase() === normalizedHouse);
    if (existing) {
      alert('Você já tem uma conta registrada para esta casa de apostas');
      return;
    }

    const created = await supabaseService.createCashAccount({
      userId,
      bettingHouse: normalizedHouse,
      initialBalance: parseFloat(newCash.initialBalance)
    });

    if (created) {
      setCashAccounts([created, ...cashAccounts]);
      setNewCash({
        bettingHouse: '',
        initialBalance: ''
      });
      setShowNewCashForm(false);
    }
  };

  const handleUpdateCash = async (cashId: string) => {
    const updated = await supabaseService.updateCashAccount(cashId, editCashData.initialBalance);
    if (updated) {
      setCashAccounts(cashAccounts.map(c => c.id === cashId ? updated : c));
      setEditingCashId(null);
    }
  };

  const handleDeleteCash = async (cashId: string) => {
    if (confirm('Tem certeza que deseja remover esta conta? As apostas não serão deletadas.')) {
      const success = await supabaseService.deleteCashAccount(cashId);
      if (success) {
        setCashAccounts(cashAccounts.filter(c => c.id !== cashId));
      }
    }
  };

  // Funções de navegação do carrossel
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 416; // 384px (width) + 32px (gap)
      if (direction === 'left') {
        carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const calculateMetrics = (houseFilter?: string) => {
    const filtered = houseFilter ? bets.filter(b => b.bettingHouse === houseFilter) : bets;

    const totalBets = filtered.length;
    const wonBets = filtered.filter(b => b.betStatus === BetStatus.WON).length;
    const lostBets = filtered.filter(b => b.betStatus === BetStatus.LOST).length;
    const totalStaked = filtered.reduce((sum, b) => sum + b.betAmount, 0);
    const totalWon = filtered
      .filter(b => b.betStatus === BetStatus.WON)
      .reduce((sum, b) => sum + b.potentialReturn, 0);
    const totalLost = filtered
      .filter(b => b.betStatus === BetStatus.LOST)
      .reduce((sum, b) => sum + b.betAmount, 0);

    const profit = totalWon - totalStaked;
    const roi = totalStaked > 0 ? ((profit / totalStaked) * 100).toFixed(2) : '0.00';
    const hitRate = totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(2) : '0.00';
    const averageOdd = totalBets > 0 ? (filtered.reduce((sum, b) => sum + b.odd, 0) / totalBets).toFixed(2) : '0.00';

    return {
      totalBets,
      wonBets,
      lostBets,
      totalStaked: totalStaked.toFixed(2),
      profit: profit.toFixed(2),
      roi,
      hitRate,
      averageOdd
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-lg text-white">Carregando...</div>
      </div>
    );
  }

  const globalMetrics = calculateMetrics();
  const totalInitialBalance = cashAccounts.reduce((sum, acc) => sum + acc.initialBalance, 0);
  const totalProfit = parseFloat(globalMetrics.profit);
  const totalFinalBalance = totalInitialBalance + totalProfit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={28} className="text-white" />
              </div>
              Gerenciador de Apostas
            </h1>
            <p className="text-slate-400 mt-2">Acompanhe seus investimentos e resultados em tempo real</p>
          </div>
        </div>

        {/* PAINEL RESUMO GERAL */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <PieChart size={24} className="text-blue-400" />
              Resumo Geral de Todas as Casas
            </h2>
            <p className="text-slate-400 text-sm mt-1">Consolidado de todos os seus investimentos</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6">
            {/* Total Investido */}
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 hover:border-blue-500 transition">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="text-blue-400" />
                <span className="text-xs text-slate-400 uppercase font-semibold">Capital Inicial</span>
              </div>
              <p className="font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis text-white">R$ {totalInitialBalance.toFixed(2)}</p>
            </div>

            {/* Total Apostado */}
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 hover:border-purple-500 transition">
              <div className="flex items-center gap-2 mb-2">
                <Target size={18} className="text-purple-400" />
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Apostado</span>
              </div>
              <p className="font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis text-white">R$ {globalMetrics.totalStaked}</p>
            </div>

            {/* Lucro/Prejuízo */}
            <div className={`bg-slate-700/50 rounded-xl p-4 border ${totalProfit >= 0 ? 'border-green-500/50 hover:border-green-500' : 'border-red-500/50 hover:border-red-500'} transition`}>
              <div className="flex items-center gap-2 mb-2">
                {totalProfit >= 0 ? <TrendingUp size={18} className="text-green-400" /> : <TrendingDown size={18} className="text-red-400" />}
                <span className="text-xs text-slate-400 uppercase font-semibold">Lucro/Prejuízo</span>
              </div>
              <p className={`font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalProfit >= 0 ? '+' : ''}R$ {globalMetrics.profit}
              </p>
            </div>

            {/* Saldo Final */}
            <div className={`bg-gradient-to-br ${totalProfit >= 0 ? 'from-green-600/20 to-emerald-600/20 border-green-500' : 'from-red-600/20 to-rose-600/20 border-red-500'} rounded-xl p-4 border-2 shadow-lg`}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className={totalProfit >= 0 ? 'text-green-400' : 'text-red-400'} />
                  <span className="text-xs text-slate-300 uppercase font-bold">💰 Saldo Final</span>
                </div>
                <p className={`font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis ${totalProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  R$ {totalFinalBalance.toFixed(2)}
                </p>
                <p className="text-xs text-slate-400">
                  {totalProfit >= 0 ? '↗' : '↘'} {((totalProfit / totalInitialBalance) * 100).toFixed(1)}% do inicial
                </p>
              </div>
            </div>

            {/* ROI */}
            <div className={`bg-slate-700/50 rounded-xl p-4 border ${parseFloat(globalMetrics.roi) >= 0 ? 'border-green-500/50 hover:border-green-500' : 'border-red-500/50 hover:border-red-500'} transition`}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={18} className={parseFloat(globalMetrics.roi) >= 0 ? 'text-green-400' : 'text-red-400'} />
                <span className="text-xs text-slate-400 uppercase font-semibold">ROI</span>
              </div>
              <p className={`font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis ${parseFloat(globalMetrics.roi) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(globalMetrics.roi) >= 0 ? '+' : ''}{globalMetrics.roi}%
              </p>
            </div>

            {/* Taxa de Acerto */}
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 hover:border-yellow-500 transition">
              <div className="flex items-center gap-2 mb-2">
                <Target size={18} className="text-yellow-400" />
                <span className="text-xs text-slate-400 uppercase font-semibold">Taxa Acerto</span>
              </div>
              <p className="font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis text-yellow-400">{globalMetrics.hitRate}%</p>
              <p className="text-xs text-slate-400 mt-1">
                {globalMetrics.wonBets}V / {globalMetrics.lostBets}D
              </p>
            </div>
          </div>

          {/* Estatísticas Extras */}
          <div className="px-6 pb-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <span className="text-slate-400">Total de Apostas:</span>
              <span className="text-white font-bold ml-2">{globalMetrics.totalBets}</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <span className="text-slate-400">Odd Média:</span>
              <span className="text-white font-bold ml-2">{globalMetrics.averageOdd}</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <span className="text-slate-400">Casas Ativas:</span>
              <span className="text-white font-bold ml-2">{cashAccounts.length}</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <span className="text-slate-400">Apostas Pendentes:</span>
              <span className="text-yellow-400 font-bold ml-2">{bets.filter(b => b.betStatus === BetStatus.PENDING).length}</span>
            </div>
          </div>
        </div>

        {/* Dashboard - Contas de Caixa */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <DollarSign size={24} className="text-green-400" />
                Contas por Casa de Apostas
              </h2>
              <p className="text-slate-400 text-sm mt-1">Detalhamento individual de cada plataforma</p>
            </div>
            <button
              onClick={() => setShowNewCashForm(!showNewCashForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-lg transition shadow-lg hover:shadow-xl"
            >
              <Plus size={20} /> Nova Conta
            </button>
          </div>

          {/* Novo Formulário de Caixa */}
          {showNewCashForm && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 mb-6 border border-slate-700 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus size={20} className="text-blue-400" />
                Registrar Nova Conta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase font-semibold">Casa de Apostas</label>
                  <input
                    type="text"
                    placeholder="Ex: BET365, BETANO, PINNACLE..."
                    value={newCash.bettingHouse}
                    onChange={(e) => setNewCash({ ...newCash, bettingHouse: e.target.value })}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase font-semibold">Saldo Inicial (R$)</label>
                  <input
                    type="number"
                    placeholder="1000.00"
                    value={newCash.initialBalance}
                    onChange={(e) => setNewCash({ ...newCash, initialBalance: e.target.value })}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddCashAccount}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-5 py-2.5 rounded-lg transition shadow-lg"
                >
                  <Save size={18} /> Salvar Conta
                </button>
                <button
                  onClick={() => setShowNewCashForm(false)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg transition border border-slate-600"
                >
                  <X size={18} /> Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Cards de Contas - Carrossel */}
          {cashAccounts.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-12 text-center border-2 border-dashed border-slate-700">
              <DollarSign size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg font-semibold mb-2">Nenhuma conta registrada</p>
              <p className="text-slate-500 text-sm">Crie sua primeira conta para começar a rastrear apostas!</p>
            </div>
          ) : (
            <div className="relative">
              {/* Botões de Navegação */}
              <button
                onClick={() => scrollCarousel('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white p-2.5 rounded-full transition shadow-lg hover:shadow-xl hidden md:flex items-center justify-center"
                title="Anterior"
              >
                <ChevronLeft size={24} />
              </button>

              <div 
                ref={carouselRef}
                className="overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(55, 65, 81) rgb(30, 41, 59)' }}
              >
                <div className="flex gap-6 w-max px-6">
                  {cashAccounts.map(account => {
                const metrics = calculateMetrics(account.bettingHouse);
                const profit = parseFloat(metrics.profit);
                const roi = parseFloat(metrics.roi);
                const finalBalance = account.initialBalance + profit;

                return (
                  <div key={account.id} className="flex-shrink-0 w-96 snap-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition shadow-xl hover:shadow-2xl">
                    {editingCashId === account.id ? (
                      <div>
                        <label className="block text-xs text-slate-400 mb-2 uppercase font-semibold">Saldo Inicial</label>
                        <input
                          type="number"
                          value={editCashData.initialBalance}
                          onChange={(e) => setEditCashData({ initialBalance: parseFloat(e.target.value) })}
                          className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none mb-4"
                          step="0.01"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateCash(account.id)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 py-2.5 rounded-lg transition shadow-lg"
                          >
                            <Save size={16} /> Salvar
                          </button>
                          <button
                            onClick={() => setEditingCashId(null)}
                            className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg transition border border-slate-600"
                          >
                            <X size={16} /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-1">{account.bettingHouse}</h3>
                            <p className="text-sm text-slate-400 flex items-center gap-1">
                              <Target size={14} />
                              {metrics.totalBets} apostas registradas
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingCashId(account.id);
                                setEditCashData({ initialBalance: account.initialBalance });
                              }}
                              className="p-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition border border-blue-600/30"
                              title="Editar saldo inicial"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCash(account.id)}
                              className="p-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition border border-red-600/30"
                              title="Deletar conta"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 mb-5">
                          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="text-slate-400">Saldo Inicial:</span>
                              <span className="text-white font-bold">R$ {account.initialBalance.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="text-slate-400">Total Apostado:</span>
                              <span className="text-purple-400 font-bold">R$ {metrics.totalStaked}</span>
                            </div>
                          </div>

                          <div className={`rounded-lg p-3 border ${profit >= 0 ? 'bg-green-600/10 border-green-600/30' : 'bg-red-600/10 border-red-600/30'}`}>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className={profit >= 0 ? 'text-green-300' : 'text-red-300'}>Lucro/Prejuízo:</span>
                              <span className={`font-bold text-lg ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {profit >= 0 ? '+' : ''}R$ {metrics.profit}
                              </span>
                            </div>
                          </div>

                          {/* SALDO FINAL - DESTAQUE */}
                          <div className={`rounded-xl p-4 border-2 shadow-lg ${finalBalance >= account.initialBalance ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500' : 'bg-gradient-to-br from-red-600/20 to-rose-600/20 border-red-500'}`}>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-300 uppercase font-bold mb-1 flex items-center gap-1">
                                  <BarChart3 size={14} />
                                  💰 Saldo Final
                                </p>
                                <p className={`font-bold text-lg whitespace-nowrap overflow-hidden text-ellipsis ${finalBalance >= account.initialBalance ? 'text-green-300' : 'text-red-300'}`}>
                                  R$ {finalBalance.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className={`text-xs font-semibold whitespace-nowrap ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {roi >= 0 ? '↗' : '↘'} {roi >= 0 ? '+' : ''}{roi}%
                                </p>
                                <p className="text-xs text-slate-400">ROI</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
                          <div className="text-center">
                            <p className="text-xs text-slate-400 mb-1">Taxa Acerto</p>
                            <p className="text-lg font-bold text-yellow-400">{metrics.hitRate}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-400 mb-1">Odd Média</p>
                            <p className="text-lg font-bold text-blue-400">{metrics.averageOdd}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              </div>
            </div>

              {/* Botão Próximo */}
              <button
                onClick={() => scrollCarousel('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white p-2.5 rounded-full transition shadow-lg hover:shadow-xl hidden md:flex items-center justify-center"
                title="Próximo"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 my-8 rounded"></div>

        {/* Apostas */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">📋 Suas Apostas</h2>
            <button
              onClick={() => setShowNewBetForm(!showNewBetForm)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus size={20} /> Nova Aposta
            </button>
          </div>

          {/* Novo Formulário de Aposta */}
          {showNewBetForm && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 mb-6 border border-slate-700 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus size={20} className="text-blue-400" />
                Registrar Nova Aposta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase font-semibold">Casa de Apostas</label>
                  {cashAccounts.length === 0 ? (
                    <div className="w-full bg-slate-700/50 text-slate-400 px-4 py-3 rounded-lg border border-slate-600 flex items-center justify-center text-sm">
                      Crie uma conta primeiro
                    </div>
                  ) : (
                    <select
                      value={newBet.bettingHouse}
                      onChange={(e) => setNewBet({ ...newBet, bettingHouse: e.target.value })}
                      className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition"
                    >
                      <option value="">Selecione uma casa</option>
                      {cashAccounts.map((account) => (
                        <option key={account.id} value={account.bettingHouse}>
                          {account.bettingHouse}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase font-semibold">Valor Apostado (R$)</label>
                  <input
                    type="number"
                    placeholder="100.00"
                    value={newBet.betAmount}
                    onChange={(e) => setNewBet({ ...newBet, betAmount: e.target.value })}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase font-semibold">Odd</label>
                  <input
                    type="number"
                    placeholder="2.00"
                    value={newBet.odd}
                    onChange={(e) => setNewBet({ ...newBet, odd: e.target.value })}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase font-semibold">Status</label>
                  <select
                    value={newBet.betStatus}
                    onChange={(e) => setNewBet({ ...newBet, betStatus: e.target.value as BetStatus })}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition"
                  >
                    {Object.values(BetStatus).map(status => (
                      <option key={status} value={status}>
                        {status === BetStatus.PENDING ? 'Pendente' : status === BetStatus.WON ? 'Ganhou' : status === BetStatus.LOST ? 'Perdeu' : 'Cancelada'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs text-slate-400 mb-2 uppercase font-semibold">Notas (Opcional)</label>
                <input
                  type="text"
                  placeholder="Observações sobre a aposta..."
                  value={newBet.notes}
                  onChange={(e) => setNewBet({ ...newBet, notes: e.target.value })}
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition placeholder:text-slate-500"
                />
              </div>
              {newBet.betAmount && newBet.odd && (
                <div className="bg-slate-700/50 border border-slate-600 p-4 rounded-xl mb-4">
                  <span className="text-slate-400">💰 Retorno Potencial: </span>
                  <span className="text-green-400 font-bold text-xl">R$ {(parseFloat(newBet.betAmount) * parseFloat(newBet.odd)).toFixed(2)}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleAddBet}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-5 py-2.5 rounded-lg transition shadow-lg"
                >
                  <Save size={18} /> Salvar Aposta
                </button>
                <button
                  onClick={() => setShowNewBetForm(false)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg transition border border-slate-600"
                >
                  <X size={18} /> Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de Apostas */}
          {bets.length === 0 ? (
            <div className="text-center text-slate-400 py-12 bg-slate-700 rounded-lg">
              Nenhuma aposta registrada. Comece a registrar suas apostas!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Casa</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Valor</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Odd</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Retorno</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Data</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {bets.map(bet => (
                    <tr key={bet.id} className="border-b border-slate-600 hover:bg-slate-700 transition">
                      {editingBetId === bet.id ? (
                        <>
                          <td className="py-3 px-4">
                            <select
                              value={editBetData.bettingHouse}
                              onChange={(e) => setEditBetData({ ...editBetData, bettingHouse: e.target.value })}
                              className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm w-32"
                            >
                              {cashAccounts.map((account) => (
                                <option key={account.id} value={account.bettingHouse}>
                                  {account.bettingHouse}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={editBetData.betAmount}
                              onChange={(e) => setEditBetData({ ...editBetData, betAmount: parseFloat(e.target.value) })}
                              className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm w-24"
                              step="0.01"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={editBetData.odd}
                              onChange={(e) => setEditBetData({ ...editBetData, odd: parseFloat(e.target.value) })}
                              className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm w-24"
                              step="0.01"
                            />
                          </td>
                          <td className="py-3 px-4 text-green-400 font-semibold">
                            R$ {(editBetData.betAmount! * editBetData.odd!).toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={editBetData.betStatus}
                              onChange={(e) => setEditBetData({ ...editBetData, betStatus: e.target.value as BetStatus })}
                              className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm"
                            >
                              {Object.values(BetStatus).map(status => (
                                <option key={status} value={status}>
                                  {status === BetStatus.PENDING ? 'Pendente' : status === BetStatus.WON ? 'Ganhou' : status === BetStatus.LOST ? 'Perdeu' : 'Cancelada'}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{new Date(editBetData.betDate!).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateBet(bet.id)}
                                className="p-1 bg-green-600 hover:bg-green-700 text-white rounded transition"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                onClick={() => setEditingBetId(null)}
                                className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-white font-semibold">{bet.bettingHouse}</td>
                          <td className="py-3 px-4 text-white">R$ {bet.betAmount.toFixed(2)}</td>
                          <td className="py-3 px-4 text-white">{bet.odd.toFixed(2)}</td>
                          <td className={`py-3 px-4 font-semibold ${bet.betStatus === BetStatus.WON ? 'text-green-400' : bet.betStatus === BetStatus.LOST ? 'text-red-400' : 'text-slate-400'}`}>
                            R$ {bet.potentialReturn.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              bet.betStatus === BetStatus.PENDING ? 'bg-yellow-600 text-yellow-100' :
                              bet.betStatus === BetStatus.WON ? 'bg-green-600 text-green-100' :
                              bet.betStatus === BetStatus.LOST ? 'bg-red-600 text-red-100' :
                              'bg-slate-600 text-slate-100'
                            }`}>
                              {bet.betStatus === BetStatus.PENDING ? 'Pendente' : bet.betStatus === BetStatus.WON ? 'Ganhou' : bet.betStatus === BetStatus.LOST ? 'Perdeu' : 'Cancelada'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{new Date(bet.betDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingBetId(bet.id);
                                  setEditBetData({
                                    bettingHouse: bet.bettingHouse,
                                    betAmount: bet.betAmount,
                                    odd: bet.odd,
                                    betStatus: bet.betStatus,
                                    betDate: bet.betDate,
                                    notes: bet.notes
                                  });
                                }}
                                className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteBet(bet.id)}
                                className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
