import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { SynchronizationConfig } from '@modules/synchronization';

export interface IdpConsoleConfig extends SynchronizationConfig {
	apiUrl: string;
	tokenEndpoint: string;
	clientId: string;
	clientSecret: string;
	personenInfoTimeoutInMs: number;
}

const config: IdpConsoleConfig = {
	SYNCHRONIZATION_CHUNK: Configuration.get('SYNCHRONIZATION_CHUNK') as number,
	apiUrl: Configuration.get('SCHULCONNEX_CLIENT__API_URL') as string,
	tokenEndpoint: Configuration.get('SCHULCONNEX_CLIENT__TOKEN_ENDPOINT') as string,
	clientId: Configuration.get('SCHULCONNEX_CLIENT__CLIENT_ID') as string,
	clientSecret: Configuration.get('SCHULCONNEX_CLIENT__CLIENT_SECRET') as string,
	personenInfoTimeoutInMs: Configuration.get('SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS') as number,
};

export const idpConsoleConfig = () => config;
