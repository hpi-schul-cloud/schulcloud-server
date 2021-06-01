import type { Config } from '@jest/types';
import jestConfig from '../../../jest.config';

// {
//   "moduleFileExtensions": ["js", "json", "ts"],
//   "rootDir": ".",
//   "testEnvironment": "node",
//   "testRegex": ".e2e-spec.ts$",
//   "transform": {
//     "^.+\\.(t|j)s$": "ts-jest"
//   }
// }

const e2eConfig: Config.InitialOptions = {
	...jestConfig,
	rootDir: '../../../',
	testRegex: '.e2e-spec.ts$',
};

export default e2eConfig;
