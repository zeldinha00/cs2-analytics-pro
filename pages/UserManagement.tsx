import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { AuthService } from '../services/auth';
import { UserPlus, Trash2, Shield, User as UserIcon } from 'lucide-react';
import supabase from '../services/supabase';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [supabaseOnline, setSupabaseOnline] = useState<boolean | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('USER');
  
  // Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('USER');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
    checkSupabase();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, created_at')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map(u => ({
          id: u.id,
          username: u.username,
          role: u.role as UserRole,
          createdAt: u.created_at
        }));
        setUsers(mapped);
        return;
      }
    } catch (err) {
      // fallback local
    }

    setUsers(AuthService.getAllUsers());
  };

  const checkSupabase = async () => {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      setSupabaseOnline(!error);
    } catch (err) {
      setSupabaseOnline(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await AuthService.createUser(newUsername, newPassword, newRole);
      
      // Sucesso - limpar form
      setNewUsername('');
      setNewPassword('');
      setShowAddForm(false);
      await loadUsers();
      await checkSupabase(); // Recheck Supabase status after creation
      
      // Mostrar mensagem de sucesso temporária
      setError('');
    } catch (err: any) {
      // Se for erro de Supabase mas usuário foi criado localmente, mostrar warning
      if (err.message.includes('Cadastro desativado')) {
        setError('⚠️ ' + err.message.replace(/\n/g, ' '));
        // Ainda assim recarregar a lista pois foi salvo localmente
        setNewUsername('');
        setNewPassword('');
        await loadUsers();
        // Auto-dismiss após 8 segundos
        setTimeout(() => setError(''), 8000);
      } else {
        setError(err.message || 'Falha ao criar usuário');
        console.error('Erro ao criar usuário:', err);
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este usuário?')) {
      try {
        // Tentar deletar no Supabase primeiro
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('Falha ao deletar no Supabase, tentando local:', error.message);
        }

        // Fallback local
        AuthService.deleteUser(id);
        await loadUsers();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const startEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditRole(user.role);
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditUsername('');
    setEditRole('USER');
  };

  const saveEditUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: editUsername.trim(),
          role: editRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.warn('Falha ao atualizar no Supabase:', error.message);
      }

      await loadUsers();
      cancelEditUser();
    } catch (err: any) {
      alert(err.message || 'Falha ao atualizar usuário');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h1>
          <p className="text-slate-400 text-sm">Gerencie credenciais de acesso ao sistema.</p>
        </div>
        {supabaseOnline !== null && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
            supabaseOnline ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            Supabase: {supabaseOnline ? 'Online' : 'Offline'}
          </div>
        )}
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <UserPlus size={18} />
          Criar Novo Usuário
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 animate-fade-in">
          <h3 className="text-white font-semibold mb-4">Criar Nova Credencial</h3>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Usuário</label>
              <input 
                type="text" 
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="w-full bg-slate-900/70 border border-slate-700 text-white px-3 py-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Senha</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-slate-900/70 border border-slate-700 text-white px-3 py-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Função</label>
              <select 
                value={newRole}
                onChange={e => setNewRole(e.target.value as UserRole)}
                className="w-full bg-slate-900/70 border border-slate-700 text-white px-3 py-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
              >
                <option value="USER">Usuário (Leitura)</option>
                <option value="ADMIN">Admin (Total)</option>
              </select>
            </div>
            <div>
              <button type="submit" className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium transition-colors">
                Salvar
              </button>
            </div>
          </form>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>
      )}

      {/* Users List */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
              <th className="py-3 px-6">Usuário</th>
              <th className="py-3 px-6">Função</th>
              <th className="py-3 px-6">Criado em</th>
              <th className="py-3 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                      <UserIcon size={16} />
                    </div>
                    {editingUserId === user.id ? (
                      <input
                        type="text"
                        value={editUsername}
                        onChange={e => setEditUsername(e.target.value)}
                        className="bg-slate-800 border border-slate-600 text-white px-2 py-1 rounded"
                      />
                    ) : (
                      <span className="font-medium text-white">{user.username}</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  {editingUserId === user.id ? (
                    <select
                      value={editRole}
                      onChange={e => setEditRole(e.target.value as UserRole)}
                      className="bg-slate-800 border border-slate-600 text-white px-2 py-1 rounded text-sm"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {user.role === 'ADMIN' ? <Shield size={10} /> : <UserIcon size={10} />}
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-slate-400 text-sm">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-4 px-6 text-right">
                  {user.username !== 'admin' && (
                    <div className="flex items-center justify-end gap-2">
                      {editingUserId === user.id ? (
                        <>
                          <button
                            onClick={() => saveEditUser(user.id)}
                            className="text-green-400 hover:text-green-300 transition-colors text-sm"
                            title="Salvar"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={cancelEditUser}
                            className="text-slate-400 hover:text-slate-200 transition-colors text-sm"
                            title="Cancelar"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditUser(user)}
                            className="text-slate-500 hover:text-blue-400 transition-colors text-sm"
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                            title="Deletar Usuário"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
