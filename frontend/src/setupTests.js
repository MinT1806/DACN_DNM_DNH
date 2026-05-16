// Jest setup file
import '@testing-library/jest-dom';

// Mock localStorage
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock AuthContext — must be before any component imports that use useAuth
jest.mock('./context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({
    user: { id: 1, username: 'testuser', role: 'STUDENT', level: 'A1', email: 'test@test.com', fullName: 'Test User' },
    login: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }) => children,
    useNavigate: () => jest.fn(),
    useParams: () => ({}),
    Link: function MockLink({ to, children }) {
      return <a href={to}>{children}</a>;
    },
  };
});
