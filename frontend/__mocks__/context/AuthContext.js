// Auto-mock for AuthContext
'use strict';

module.exports = {
  AuthProvider: function MockAuthProvider({ children }) {
    return children;
  },
  useAuth: function mockUseAuth() {
    return {
      user: { id: 1, level: 'A1', username: 'testuser' },
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      loading: false,
    };
  },
};
