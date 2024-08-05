// jest.config.ts
import type { Config } from '@jest/types';

// Sync object
let config: Config.InitialOptions = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: '.',
	preset: 'ts-jest',
	testRegex: '\\.spec\\.ts$',
	// ignore legacy mocha tests
	testPathIgnorePatterns: ['^src', '^test', '\\.load\\.spec\\.ts$'],
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: ['apps/**/*.(t|j)s'],
	coverageDirectory: './coverage',
	coveragePathIgnorePatterns: ['.module.ts$', 'index.ts$', 'spec.ts$'],
	testEnvironment: 'node',
	// detectOpenHandles: true,
	// detectLeaks: true,
	roots: ['<rootDir>/apps/'],
	globalSetup: '<rootDir>/apps/server/test/globalSetup.ts',
	globalTeardown: '<rootDir>/apps/server/test/globalTeardown.ts',
	moduleNameMapper: {
		// add ts-config path's here as regex
		'^@shared/(.*)$': '<rootDir>/apps/server/src/shared/$1',
		'^@src/(.*)$': '<rootDir>/apps/server/src/$1',
		'^@modules/(.*)$': '<rootDir>/apps/server/src/modules/$1',
		'^@infra/(.*)$': '<rootDir>/apps/server/src/infra/$1',
	},
	maxWorkers: 2, // limited for not taking all workers within of a single github action
	workerIdleMemoryLimit: '1.5GB', // without this, jest can lead to big memory leaks and out of memory errors
};

if (!process.env.RUN_WITHOUT_JEST_COVERAGE) {
	config = {
		...config,
		coverageThreshold: {
			global: {
				branches: 95,
				functions: 95,
				lines: 95,
				statements: -3,
			},
			// add custom paths: './apps/server/path...': { branches: X, functions: ... }
		},
		testTimeout: 5000,
	};
}

export default config;
