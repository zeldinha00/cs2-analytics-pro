import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
const DEBUG = import.meta.env.VITE_DEBUG_LOGS === 'true';
const debugLog = (...args: unknown[]) => {
  if (DEBUG) console.log(...args);
};
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Comparison = lazy(() => import('./pages/Comparison'));
const Matches = lazy(() => import('./pages/Matches'));
const ImportDemo = lazy(() => import('./pages/ImportDemo'));
const AdjustScores = lazy(() => import('./pages/AdjustScores'));
const MatchDetail = lazy(() => import('./pages/MatchDetail'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Login = lazy(() => import('./pages/Login'));
import { AuthService } from './services/auth';
import supabaseService from './services/supabaseService';
import supabase from './services/supabase';
import { Match, User } from './types';

const App: React.FC = () => {
  // Auth State - Inicialização "Lazy" (Lê do localStorage imediatamente ao abrir o app)
  // Isso garante que se o usuário já estiver logado, ele não vê a tela de login nem por um segundo.
  const [user, setUser] = useState<User | null>(() => {
    return AuthService.getCurrentUser();
  });

  // App State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  // Load matches from Supabase on mount
  const [matchesVersion, setMatchesVersion] = useState(0);
  useEffect(() => {
    const loadMatches = async () => {
      try {
        debugLog('📁 Carregando todos os matches do Supabase...');
        const supabaseMatches = await supabaseService.getAllMatches();
        debugLog(`✅ ${supabaseMatches.length} matches carregados`);
        setMatches(supabaseMatches);
      } catch (error) {
        console.error('❌ Erro ao carregar matches:', error);
        setMatches([]);
      } finally {
        setIsLoadingMatches(false);
      }
    };

    loadMatches();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    setCurrentPage('dashboard');
  };

  const handleImportMatch = (newMatch: Match) => {
    setMatches(prev => [newMatch, ...prev]);
  };

  const reloadMatches = useCallback(async () => {
    try {
      debugLog('🔄 Recarregando todos os matches...');
      const freshMatches = await supabaseService.getAllMatches();
      debugLog(`✅ Recarregamento concluído: ${freshMatches.length} matches`);
      setMatches(freshMatches);
      setMatchesVersion(v => v + 1);
    } catch (error) {
      console.error('❌ Erro ao recarregar matches:', error);
    }
  }, []);

  const renderContent = () => {
    if (selectedMatchId) {
      const match = matches.find(m => m.id === selectedMatchId);
      if (match) {
        return (
          <Suspense fallback={<div className="text-slate-400">Carregando...</div>}>
            <MatchDetail match={match} onBack={() => setSelectedMatchId(null)} />
          </Suspense>
        );
      }
      setSelectedMatchId(null);
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <Suspense fallback={<div className="text-slate-400">Carregando...</div>}>
            <Dashboard matches={matches} />
          </Suspense>
        );
      case 'matches':
        return (
          <Suspense fallback={<div className="text-slate-400">Carregando...</div>}>
            <Matches key={`matches-${matchesVersion}`} matches={matches} onViewDetails={(id) => setSelectedMatchId(id)} />
          </Suspense>
        );
      case 'comparison':
        return (
          <Suspense fallback={<div className="text-slate-400">Carregando...</div>}>
            <Comparison matches={matches} />
          </Suspense>
        );
      case 'import':
        return user?.role === 'ADMIN' ? (
          <Suspense fallback={<div className="text-slate-400">Carregando...</div>}>
            <ImportDemo onImportMatch={handleImportMatch} />
          </Suspense>
        ) : <div className="text-red-500 font-bold p-8 text-center">Acesso Negado</div>;
      case 'adjust':
        return user?.role === 'ADMIN' ? (
          <Suspense fallback={<div className="text-slate-400">Carregando...</div>}>
            <AdjustScores 
              key={`adjust-${matchesVersion}`}
              matches={matches} 
              onUpdate={async (matchId: string, updates: any) => {
                try {
                  console.log('🔄 Atualizando match:', matchId, updates);
                  // Se matchId for vazio, apenas fazer reload (usado após delete)
                  if (matchId) {
                    await supabaseService.updateMatch(matchId, updates);
                  }

                  // Aguardar um pouco para garantir que o banco de dados atualizou
                  await new Promise(resolve => setTimeout(resolve, 1500));

                  // Recarregar matches após atualização
                  await reloadMatches();
                } catch (error) {
                  console.error('❌ Erro ao atualizar:', error);
                  throw error;
                }
              }} 
            />
          </Suspense>
        ) : <div className="text-red-500 font-bold p-8 text-center">Acesso Negado</div>;
      case 'users':
        return user?.role === 'ADMIN' ? (
          <Suspense fallback={<div className="text-slate-400">Carregando...</div>}>
            <UserManagement />
          </Suspense>
        ) : <div className="text-red-500 font-bold p-8 text-center">Acesso Negado</div>;
      case 'settings':
        return user?.role === 'ADMIN' ? (
          <div className="flex items-center justify-center h-96 text-slate-500">
            <p>Painel de configurações (Apenas Admin)</p>
          </div>
        ) : <div className="text-red-500 font-bold p-8 text-center">Acesso Negado</div>;
      default:
        return <Dashboard matches={matches} />;
    }
  };

  // Se não houver usuário no estado (e como já checamos o localStorage na inicialização),
  // mostramos a tela de Login.
  if (!user) {
    return (
      <Suspense fallback={<div className="text-slate-400">Carregando...</div>}>
        <Login onLogin={handleLogin} />
      </Suspense>
    );
  }

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-cs-dark text-slate-200 font-sans">
      {/* Sidebar */}
      <Sidebar 
        currentPage={selectedMatchId ? 'matches' : currentPage} 
        onNavigate={(page) => {
          const adminOnlyPages = ['import', 'adjust', 'users', 'settings'];
          if (adminOnlyPages.includes(page) && user?.role !== 'ADMIN') {
            console.warn('Acesso negado para página:', page);
            setAccessDenied('Acesso negado: área restrita a administradores.');
            setCurrentPage('dashboard');
            setTimeout(() => setAccessDenied(null), 3000);
          } else {
            setCurrentPage(page);
          }
          setSelectedMatchId(null);
        }} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        userRole={user.role}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* Main Content Area */}
      <main className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-cs-card border-b border-slate-700 flex items-center px-4 sticky top-0 z-30 shadow-md">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-300 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <img src="./logos/logo.png" alt="Logo" className="ml-4 h-8 object-contain" onError={() => console.log('Logo não encontrada')} />
        </div>

        {/* Content Padding */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {accessDenied && (
            <div className="mb-4 p-4 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400">
              {accessDenied}
            </div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
