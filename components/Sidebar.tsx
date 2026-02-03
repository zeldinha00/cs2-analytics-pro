import React from 'react';
import { LayoutDashboard, Gamepad2, UploadCloud, LogOut, Users, RotateCcw, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  userRole: UserRole;
  userName: string;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onNavigate, 
  isMobileOpen, 
  setIsMobileOpen, 
  userRole, 
  userName,
  onLogout,
  isCollapsed,
  onToggleCollapse
}) => {
  
  // Base items visible to everyone
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'matches', label: 'Partidas', icon: <Gamepad2 size={20} /> },
    { id: 'comparison', label: 'Comparação', icon: <BarChart3 size={20} /> },
  ];

  // Admin only items
  const adminItems = [
    { id: 'import', label: 'Importar Demo', icon: <UploadCloud size={20} /> },
    { id: 'adjust', label: 'Ajustar Scores', icon: <RotateCcw size={20} /> },
    { id: 'users', label: 'Usuários', icon: <Users size={20} /> },
  ];

  const navItems = userRole === 'ADMIN' ? [...baseItems, ...adminItems] : baseItems;
  const sections = userRole === 'ADMIN'
    ? [
        { title: 'Visão Geral', items: baseItems },
        { title: 'Administração', items: adminItems }
      ]
    : [
        { title: 'Visão Geral', items: baseItems }
      ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-screen ${isCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
          border-r border-slate-800/80 shadow-[0_0_30px_rgba(0,0,0,0.35)]
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className={`h-16 flex items-center border-b border-slate-800/80 ${isCollapsed ? 'px-3' : 'px-6'}`}>
            <button
              onClick={onToggleCollapse}
              className="flex items-center gap-3 focus:outline-none"
              title={isCollapsed ? 'Expandir menu' : 'Encolher menu'}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white shadow-[0_8px_20px_rgba(59,130,246,0.25)]">
                CS
              </div>
              {!isCollapsed && (
                <div>
                  <div className="font-bold text-white tracking-tight leading-none">CS2 ANALYTICS</div>
                  <div className="text-[11px] text-slate-400">Command Center</div>
                </div>
              )}
            </button>
            <div className="ml-auto">
              <button
                onClick={onToggleCollapse}
                className="w-8 h-8 rounded-lg border border-slate-700/70 text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors flex items-center justify-center"
                title={isCollapsed ? 'Expandir menu' : 'Encolher menu'}
                aria-label={isCollapsed ? 'Expandir menu' : 'Encolher menu'}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>
          </div>

          {/* Navigation */}
           <nav className={`flex-1 py-6 space-y-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
            {sections.map((section) => (
              <div key={section.title} className="space-y-2">
                {!isCollapsed && (
                  <div className="px-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                      {section.title}
                    </span>
                  </div>
                )}
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`
                      group relative w-full flex items-center gap-3 ${isCollapsed ? 'px-2' : 'px-3'} py-3 rounded-xl transition-all duration-200 font-medium
                      border border-transparent
                      ${currentPage === item.id 
                        ? 'bg-blue-600/10 text-blue-300 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={`
                      w-9 h-9 rounded-lg flex items-center justify-center
                      ${currentPage === item.id ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800/70 text-slate-400'}
                    `}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                    {currentPage === item.id && !isCollapsed && (
                      <span className="w-1.5 h-6 rounded-full bg-blue-400" />
                    )}
                    {isCollapsed && (
                      <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900/95 border border-slate-700 px-3 py-1 text-xs text-slate-100 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                        {item.label}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* User Profile / Footer */}
          <div className={`border-t border-slate-800/80 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            {!isCollapsed && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 mb-3">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Usuário</div>
                <div className="text-sm text-white font-semibold">{userName || 'Usuário'}</div>
              </div>
            )}
            <button 
              onClick={onLogout}
              className={`group relative flex items-center gap-3 text-slate-400 hover:text-red-400 w-full rounded-lg hover:bg-slate-800/60 transition-colors ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3'}`}
              title={isCollapsed ? 'Sair' : undefined}
            >
              <LogOut size={20} />
              {!isCollapsed && <span>Sair</span>}
              {isCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900/95 border border-slate-700 px-3 py-1 text-xs text-slate-100 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                  Sair
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
