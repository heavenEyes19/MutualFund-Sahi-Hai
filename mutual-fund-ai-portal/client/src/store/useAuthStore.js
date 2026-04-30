import { create } from 'zustand';

/**
 * Global authentication store using Zustand
 * Manages user state, authentication status, and role-based access control
 */
const useAuthStore = create((set) => {
  // Initialize from localStorage if available
  const storedToken = localStorage.getItem('token');
  const storedRole = localStorage.getItem('role');
  const storedUser = localStorage.getItem('user');
  
  let initialUser = null;
  try {
    if (storedUser) {
      initialUser = JSON.parse(storedUser);
    }
  } catch (e) {
    console.error("Failed to parse stored user", e);
  }

  return {
    // State variables
    user: initialUser,
    isAuthenticated: !!storedToken,
    role: storedRole || null,
    isLoading: false,

    // Real login action
    login: (userData, token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('role', userData.role);
      localStorage.setItem('user', JSON.stringify(userData));
      
      set({
        user: userData,
        isAuthenticated: true,
        role: userData.role,
      });
    },

    // Mock login action for testing without backend
    mockLogin: (role = 'investor') => {
      const mockUsers = {
        investor: {
          id: '1',
          name: 'John Investor',
          email: 'investor@example.com',
          role: 'investor',
          avatar: '👤',
        },
        admin: {
          id: '3',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          avatar: '👨‍💻',
        },
      };

      const selectedUser = mockUsers[role] || mockUsers.investor;
      const token = "mock-jwt-token-123";
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', selectedUser.role);
      localStorage.setItem('user', JSON.stringify(selectedUser));

      set({
        user: selectedUser,
        isAuthenticated: true,
        role: selectedUser.role,
      });
    },

    // Logout action
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      
      set({
        user: null,
        isAuthenticated: false,
        role: null,
      });
    },

    // Set user (for actual login flow or profile update)
    setUser: (user) => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        if (user.role) localStorage.setItem('role', user.role);
      }
      set({
        user,
        isAuthenticated: !!user,
        role: user?.role || null,
      });
    },

    // Update loading state
    setIsLoading: (isLoading) => {
      set({ isLoading });
    },

    // Check if user has specific role
    hasRole: (requiredRole) => {
      const state = useAuthStore.getState();
      return state.role === requiredRole;
    },

    // Check if user has any of the specified roles
    hasAnyRole: (roles) => {
      const state = useAuthStore.getState();
      return Array.isArray(roles) && roles.includes(state.role);
    },
  };
});

export default useAuthStore;
