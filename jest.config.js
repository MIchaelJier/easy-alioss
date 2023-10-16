module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/scripts/testSetup.js'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  projects: ['<rootDir>/packages/*'],
};
