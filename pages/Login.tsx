import React, { useState } from 'react';
import { AuthService } from '../services/auth';
import { User } from '../types';
import { ShieldCheck, Lock, User as UserIcon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await AuthService.login(username, password);
      setLoading(false);
      
      if (user) {
        onLogin(user);
      } else {
        setError('Usuário ou senha inválidos');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setLoading(false);
      setError('Erro ao conectar. Verifique suas credenciais.');
    }
  };

  return (
    <div className="min-h-screen bg-cs-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-yellow-600/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CS Analytics Pro</h1>
          <p className="text-slate-400 mt-2">Insira suas credenciais para acessar o sistema</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Usuário</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
                  placeholder="Digite seu usuário"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
                  placeholder="Digite sua senha"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`
                w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all duration-200
                shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2
                ${loading ? 'opacity-70 cursor-wait' : ''}
              `}
            >
              {loading ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
             <p className="text-xs text-slate-500">
               Sistema Protegido. Apenas Pessoal Autorizado.
             </p>
          </div>
        </div>
        
        <div className="text-center mt-8 text-slate-600 text-xs">
          <p>Admin Padrão: <strong>admin</strong> / <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
