import { Configuration } from '@hpi-schul-cloud/commons';

export interface TldrawConfig {
	NEST_LOG_LEVEL: string;
	INCOMING_REQUEST_TIMEOUT: number;
	TLDRAW_DB_COLLECTION_NAME: string;
	TLDRAW_DB_FLUSH_SIZE: string;
	TLDRAW_DB_MULTIPLE_COLLECTIONS: boolean;
	CONNECTION_STRING: string;
	FEATURE_TLDRAW_ENABLED: boolean;
	TLDRAW_PING_TIMEOUT: number;
	TLDRAW_GC_ENABLED: number;
	API_HOST: number;
}

const tldrawConnectionString: string = Configuration.get('TLDRAW_DB_URL') as string;

const tldrawConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	TLDRAW_DB_COLLECTION_NAME: Configuration.get('TLDRAW__DB_COLLECTION_NAME') as string,
	TLDRAW_DB_FLUSH_SIZE: Configuration.get('TLDRAW__DB_FLUSH_SIZE') as number,
	TLDRAW_DB_MULTIPLE_COLLECTIONS: Configuration.get('TLDRAW__DB_MULTIPLE_COLLECTIONS') as boolean,
	FEATURE_TLDRAW_ENABLED: Configuration.get('FEATURE_TLDRAW_ENABLED') as boolean,
	CONNECTION_STRING: tldrawConnectionString,
	TLDRAW_PING_TIMEOUT: Configuration.get('TLDRAW__PING_TIMEOUT') as number,
	TLDRAW_GC_ENABLED: Configuration.get('TLDRAW__GC_ENABLED') as boolean,
	API_HOST: Configuration.get('API_HOST') as string,
};

export const SOCKET_PORT = Configuration.get('TLDRAW__SOCKET_PORT') as number;
export const config = () => tldrawConfig;
