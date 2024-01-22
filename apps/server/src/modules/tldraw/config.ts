import { Configuration } from '@hpi-schul-cloud/commons';

export interface TldrawConfig {
	TLDRAW_DB_URL: string;
	NEST_LOG_LEVEL: string;
	INCOMING_REQUEST_TIMEOUT: number;
	TLDRAW_DB_COLLECTION_NAME: string;
	TLDRAW_DB_FLUSH_SIZE: string;
	TLDRAW_DB_MULTIPLE_COLLECTIONS: boolean;
	FEATURE_TLDRAW_ENABLED: boolean;
	TLDRAW_PING_TIMEOUT: number;
	TLDRAW_GC_ENABLED: number;
	TLDRAW_ASSETS_ENABLED: boolean;
	TLDRAW_ASSETS_MAX_SIZE: number;
	TLDRAW_ASSETS_ALLOWED_EXTENSIONS_LIST: string;
	API_HOST: number;
}

export const TLDRAW_DB_URL: string = Configuration.get('TLDRAW_DB_URL') as string;
export const TLDRAW_SOCKET_PORT = Configuration.get('TLDRAW__SOCKET_PORT') as number;

const tldrawConfig = {
	TLDRAW_DB_URL,
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	TLDRAW_DB_COLLECTION_NAME: Configuration.get('TLDRAW__DB_COLLECTION_NAME') as string,
	TLDRAW_DB_FLUSH_SIZE: Configuration.get('TLDRAW__DB_FLUSH_SIZE') as number,
	TLDRAW_DB_MULTIPLE_COLLECTIONS: Configuration.get('TLDRAW__DB_MULTIPLE_COLLECTIONS') as boolean,
	FEATURE_TLDRAW_ENABLED: Configuration.get('FEATURE_TLDRAW_ENABLED') as boolean,
	TLDRAW_PING_TIMEOUT: Configuration.get('TLDRAW__PING_TIMEOUT') as number,
	TLDRAW_GC_ENABLED: Configuration.get('TLDRAW__GC_ENABLED') as boolean,
	TLDRAW_ASSETS_ENABLED: Configuration.get('TLDRAW__ASSETS_ENABLED') as boolean,
	TLDRAW_ASSETS_MAX_SIZE: Configuration.get('TLDRAW__ASSETS_MAX_SIZE') as number,
	TLDRAW_ASSETS_ALLOWED_EXTENSIONS_LIST: Configuration.get('TLDRAW__ASSETS_ALLOWED_EXTENSIONS_LIST') as string,
	API_HOST: Configuration.get('API_HOST') as string,
};

export const config = () => tldrawConfig;
