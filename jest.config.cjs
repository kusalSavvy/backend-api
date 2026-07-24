/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',

  testEnvironment: 'node',

  moduleFileExtensions: ['ts', 'js', 'json'],

  testMatch: ['<rootDir>/src/**/*.spec.ts'],

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/generated/**',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
  ],

  coverageDirectory: '<rootDir>/coverage',

  clearMocks: true,
  restoreMocks: true,
};