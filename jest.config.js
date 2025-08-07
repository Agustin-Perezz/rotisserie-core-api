module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.{ts,js}', '!**/*.spec.{ts,js}', '!main.ts'],
  coverageReporters: ['text', 'lcov', 'json'],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@data/(.*)$': '<rootDir>/../data/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@users/(.*)$': '<rootDir>/users/$1',
    '^@auth/(.*)$': '<rootDir>/auth/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@/(.*)$': '<rootDir>/../src/$1',
    '^@root/(.*)$': '<rootDir>/../$1',
  },
};
