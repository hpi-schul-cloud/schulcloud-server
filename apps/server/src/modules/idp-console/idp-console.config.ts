import { Configuration } from '@hpi-schul-cloud/commons';
import { ConsoleWriterConfig } from '@infra/console';
import { SchulconnexClientConfig } from '@infra/schulconnex-client';

export interface IdpConsoleConfig extends ConsoleWriterConfig, SchulconnexClientConfig {
	SYNCHRONIZATION_CHUNK: number;
	LOGIN_BLOCK_TIME: number; // @TODO temporary until removed from other configs
}

const config: IdpConsoleConfig = {
	SYNCHRONIZATION_CHUNK: Configuration.get('SYNCHRONIZATION_CHUNK') as number,
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
	SCHULCONNEX_CLIENT__PERSON_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__PERSON_INFO_TIMEOUT_IN_MS'
	) as number,
	SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS'
	) as number,
	SCHULCONNEX_CLIENT__POLICIES_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__POLICIES_INFO_TIMEOUT_IN_MS'
	) as number,
};

export const idpConsoleConfigConfig = () => config;
