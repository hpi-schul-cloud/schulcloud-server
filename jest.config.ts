// jest.config.ts
import type { Config } from '@jest/types';

const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig.json');

// Sync object
const config: Config.InitialOptions = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: '.',
	testRegex: 'spec\\.ts$',
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: ['**/*.(t|j)s'],
	coverageDirectory: './coverage',
	testEnvironment: 'node',
	// detectOpenHandles: true,
	// detectLeaks: true,
	roots: ['<rootDir>/apps/'],
	moduleNameMapper: {
		// add ts-config path's here as regex
		'^@shared/(.*)$': '<rootDir>/apps/server/src/shared/$1',
	},
};
export default config;
