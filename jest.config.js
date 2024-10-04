module.exports = {
    clearMocks: true,
  
    collectCoverage: true,
  
    coverageDirectory: 'coverage',
  
    testEnvironment: 'node',
  
    moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  
    resetMocks: true,
  
    roots: ['<rootDir>/src'],
  
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
  
    moduleNameMapper: {
      '^@src/(.*)$': '<rootDir>/src/$1',
    },
  
    testMatch: [
      '**/__tests__/**/*.[jt]s?(x)',
      '**/?(*.)+(spec|test).[tj]s?(x)',
    ],
  
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  };
  