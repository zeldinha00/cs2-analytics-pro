import { User, UserRole } from '../types';
import supabase from './supabase';

const STORAGE_KEY = 'cs2_users';
const SESSION_KEY = 'cs2_session';

// Seed default admin if not exists (fallback local)
const seedAdmin = () => {
  const users = getUsers();
  if (users.length === 0) {
    const admin: User = {
      id: 'admin-1',
      username: 'admin',
      password: 'ZeldinhaDev', // Em um app real, isso seria um hash
      role: 'ADMIN',
      isVip: true, // Admin é VIP por padrão
      createdAt: new Date().toISOString()
    };
    saveUsers([admin]);
  }
};

const getUsers = (): User[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erro ao ler usuários:", error);
    return [];
  }
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

// Initialize
seedAdmin();

export const AuthService = {
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      // Tenta autenticar com Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@cs2analytics.app`,
        password: password
      });

      if (!error && data.user) {
        // Busca dados do usuário na tabela users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!userError && userData) {
          const user: User = {
            id: userData.id,
            username: userData.username,
            role: userData.role,
            isVip: userData.is_vip || false,
            createdAt: userData.created_at
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(user));
          console.log('✅ Supabase Auth - Usuário logado:', user);
          return user;
        }
      }
    } catch (err) {
      console.log('Supabase auth failed, falling back to local:', err);
    }

    // Fallback: tenta autenticar localmente
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const { password: _, ...safeUser } = user;
      console.log('✅ Local Auth - Usuário logado:', safeUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return safeUser as User;
    }
    console.log('❌ Login falhou - Usuário ou senha incorretos');
    return null;
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.log('Supabase logout failed:', err);
    }
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (!session) return null;
      return JSON.parse(session);
    } catch (error) {
      console.error("Sessão inválida, deslogando:", error);
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  // FUNÇÕES APENAS DE ADMIN
  createUser: async (username: string, password: string, role: UserRole): Promise<User> => {
    const users = getUsers();
    if (users.find(u => u.username === username)) {
      throw new Error('Nome de usuário já existe');
    }

    const newUser: User = {
      id: Date.now().toString(),
      username,
      role,
      isVip: false, // Novos usuários não são VIP por padrão
      createdAt: new Date().toISOString()
    };

    // Tenta criar no Supabase
    try {
      const { data, error } = await supabase.auth.signUp({
        email: `${username}@cs2analytics.app`,
        password: password
      });

      if (error) {
        console.error('❌ Supabase Auth signup error:', error);
        
        // Erro específico: Email signups desativado
        if (error.message.includes('Email signups are disabled')) {
          throw new Error(
            'Cadastro desativado no Supabase.\n' +
            'Ative em: Authentication → Providers → Email → Enable "Email"\n' +
            'Usuário salvo apenas localmente.'
          );
        }
        
        throw new Error(`Erro ao criar usuário no Supabase: ${error.message}`);
      }

      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            username,
            role,
            is_vip: false,
            created_at: new Date().toISOString()
          }]);
        
        if (insertError) {
          console.error('❌ Supabase table insert error:', insertError);
          throw new Error(`Erro ao salvar dados do usuário: ${insertError.message}`);
        }
        
        newUser.id = data.user.id;
        console.log('✅ Usuário criado no Supabase:', newUser.username);
      }
    } catch (err: any) {
      console.log('⚠️ Supabase user creation failed, using local fallback:', err.message);
      // Salva apenas localmente se Supabase falhar
      // Re-throw para mostrar mensagem específica ao usuário
      if (err.message.includes('Cadastro desativado')) {
        // Continua salvando localmente mas mostra warning
        console.warn('💾 Salvando apenas no localStorage');
      }
    }

    // Salva localmente também
    users.push({ ...newUser, password });
    saveUsers(users);
    
    return newUser;
  },

  getAllUsers: (): User[] => {
    const users = getUsers();
    return users.map(({ password, ...u }) => u as User);
  },

  getUserByUsername: (username: string): User | null => {
    const users = getUsers();
    const user = users.find(u => u.username === username);
    if (user) {
      const { password, ...u } = user;
      return u as User;
    }
    return null;
  },
  
  deleteUser: (id: string) => {
    let users = getUsers();
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.username === 'admin') {
      throw new Error("Não é possível deletar o administrador raiz");
    }
    
    users = users.filter(u => u.id !== id);
    saveUsers(users);
  },

  // Debug: Limpar localStorage e reinicializar
  resetAndReinitialize: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
    seedAdmin();
    console.log('✅ localStorage resetado e admin reinicializado');
  },

  // Debug: Ver dados no localStorage
  debugInfo: () => {
    const users = getUsers();
    const session = localStorage.getItem(SESSION_KEY);
    return {
      users,
      currentSession: session ? JSON.parse(session) : null,
      storageKey: STORAGE_KEY,
      sessionKey: SESSION_KEY
    };
  }
};
