// Pure-logic tests run in a plain Node environment with babel-jest: we
// deliberately avoid the `react-native` preset here so that tests for
// utilities (getBitcoinInvoiceData, decodeLnurl, ...) don't try to bring
// in the RN runtime. When we add component tests we can introduce a
// separate Jest project with `preset: 'react-native'`.
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
  // ESM-only deps we pull in through the utils barrel must be transformed.
  transformIgnorePatterns: [
    'node_modules/(?!(?:' +
      'query-string' +
      '|decode-uri-component' +
      '|split-on-first' +
      '|filter-obj' +
      ')/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
};
