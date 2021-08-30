import { SpawnOptions } from './span-options.interface';

export interface SpawnCommand {
	command: string;
	args?: string[];
	options?: SpawnOptions;
}
