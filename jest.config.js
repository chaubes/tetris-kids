export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['jest-canvas-mock'],
  moduleFileExtensions: ['js', 'json'],
  testMatch: [
    '**/src/tests/**/*.test.js',
    '**/src/**/*.test.js',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/main.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
  },
  transform: {},
};