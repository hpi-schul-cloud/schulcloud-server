import { Configuration } from '@hpi-schul-cloud/commons';

export interface TldrawConfig {
	NEST_LOG_LEVEL: string;
	INCOMING_REQUEST_TIMEOUT: number;
	TLDRAW_DB_FLUSH_SIZE: string;
	CONNECTION_STRING: string;
	FEATURE_TLDRAW_ENABLED: boolean;
	TLDRAW_PING_TIMEOUT: number;
	TLDRAW_GC_ENABLED: number;
	REDIS_URI: string;
	API_HOST: number;
	TLDRAW_MAX_DOCUMENT_SIZE: number;
}

const tldrawConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	TLDRAW_DB_FLUSH_SIZE: Configuration.get('TLDRAW__DB_FLUSH_SIZE') as number,
	FEATURE_TLDRAW_ENABLED: Configuration.get('FEATURE_TLDRAW_ENABLED') as boolean,
	CONNECTION_STRING: Configuration.get('TLDRAW_DB_URL') as string,
	TLDRAW_PING_TIMEOUT: Configuration.get('TLDRAW__PING_TIMEOUT') as number,
	TLDRAW_GC_ENABLED: Configuration.get('TLDRAW__GC_ENABLED') as boolean,
	REDIS_URI: Configuration.has('REDIS_URI') ? (Configuration.get('REDIS_URI') as string) : null,
	API_HOST: Configuration.get('API_HOST') as string,
	TLDRAW_MAX_DOCUMENT_SIZE: Configuration.get('TLDRAW__MAX_DOCUMENT_SIZE') as number,
};

export const SOCKET_PORT = Configuration.get('TLDRAW__SOCKET_PORT') as number;
export const config = () => tldrawConfig;
