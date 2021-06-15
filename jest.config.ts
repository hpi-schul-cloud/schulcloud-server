// jest.config.ts
import type { Config } from '@jest/types';

const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig.json');

// Sync object
const config: Config.InitialOptions = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: '.',
	/* we have tests in src/...*.spec.ts and test/...*.e2e-spec.ts either we test all files via `npm run nest:test` or override the regex in npm scripts to separate the execution via `npm run nest:test:spec` or `npm run nest:test:e2e` */
	testRegex: '\\.(e2e-)?spec\\.ts$',
	// ignore legacy mocha tests
	testPathIgnorePatterns: ['^src', '^test'],
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: ['apps/**/*.(t|j)s'],
	coverageDirectory: './coverage',
	coveragePathIgnorePatterns: ['.module.ts$', 'index.ts$', 'spec.ts$'],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: -10,
		},
		// add custom paths: './apps/server/path...': { branches: X, functions: ... }
	},
	testEnvironment: 'node',
	// detectOpenHandles: true,
	// detectLeaks: true,
	roots: ['<rootDir>/apps/'],
	moduleNameMapper: {
		// add ts-config path's here as regex
		'^@shared/(.*)$': '<rootDir>/apps/server/src/shared/$1',
		'^@src/(.*)$': '<rootDir>/apps/server/src/$1',
	},
};
export default config;
