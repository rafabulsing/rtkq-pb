// import type { Config } from 'jest'
const { createJsWithTsPreset } = require('ts-jest')

module.exports = {
  displayName: 'js-with-ts',
  ...createJsWithTsPreset({
    tsconfig: 'tsconfig.json',
  }),
  transformIgnorePatterns: ['!node_modules/(?!pocketbase)'],
} //satisfies Config