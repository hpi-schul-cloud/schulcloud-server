import { Configuration } from '@hpi-schul-cloud/commons';
import { ConsoleWriterConfig } from '@infra/console';

export interface IdpConsoleConfig extends ConsoleWriterConfig {
	SYNCHRONIZATION_CHUNK: number;
	LOGIN_BLOCK_TIME: number; // @TODO temporary until removed from other configs
}

const config: IdpConsoleConfig = {
	SYNCHRONIZATION_CHUNK: Configuration.get('SYNCHRONIZATION_CHUNK') as number,
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
};

export const idpConsoleConfigConfig = () => config;
