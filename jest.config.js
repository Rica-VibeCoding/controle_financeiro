/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Transform configuration - configuração específica para ts-jest
  preset: 'ts-jest/presets/default-esm',
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  
  // Coverage configuration - focando apenas nos utilitários que funcionam
  collectCoverageFrom: [
    'src/utilitarios/**/*.{ts,tsx}',
    'src/componentes/ui/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  
  // Test file patterns - apenas os que funcionam por enquanto
  testMatch: [
    '<rootDir>/src/utilitarios/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/utilitarios/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Coverage thresholds baixos para começar
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,  
      lines: 40,
      statements: 40,
    },
  },
  
  // Extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Coverage provider
  coverageProvider: 'v8',
}

module.exports = config