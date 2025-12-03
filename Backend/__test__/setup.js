// Configurar variables de entorno para tests
process.env.JWT_SECRET = 'test_secret_key';
process.env.NODE_ENV = 'test';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASSWORD = 'test_password';
process.env.FRONTEND_URL = 'http://localhost:4000';

// Mock de console para tests más limpios
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Limpiar todos los mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});
