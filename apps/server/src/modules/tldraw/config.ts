import { Configuration } from '@hpi-schul-cloud/commons';

export interface TldrawConfig {
	TLDRAW_DB_URL: string;
	NEST_LOG_LEVEL: string;
	INCOMING_REQUEST_TIMEOUT: number;
	TLDRAW_DB_COMPRESS_THRESHOLD: string;
	CONNECTION_STRING: string;
	FEATURE_TLDRAW_ENABLED: boolean;
	TLDRAW_PING_TIMEOUT: number;
	TLDRAW_GC_ENABLED: number;
	REDIS_URI: string;
	TLDRAW_ASSETS_ENABLED: boolean;
	TLDRAW_ASSETS_MAX_SIZE: number;
	ASSETS_ALLOWED_MIME_TYPES_LIST: string;
	API_HOST: number;
	TLDRAW_MAX_DOCUMENT_SIZE: number;
}

export const TLDRAW_DB_URL: string = Configuration.get('TLDRAW_DB_URL') as string;
export const TLDRAW_SOCKET_PORT = Configuration.get('TLDRAW__SOCKET_PORT') as number;

const tldrawConfig = {
	TLDRAW_DB_URL,
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	TLDRAW_DB_COMPRESS_THRESHOLD: Configuration.get('TLDRAW__DB_COMPRESS_THRESHOLD') as number,
	FEATURE_TLDRAW_ENABLED: Configuration.get('FEATURE_TLDRAW_ENABLED') as boolean,
	CONNECTION_STRING: Configuration.get('TLDRAW_DB_URL') as string,
	TLDRAW_PING_TIMEOUT: Configuration.get('TLDRAW__PING_TIMEOUT') as number,
	TLDRAW_GC_ENABLED: Configuration.get('TLDRAW__GC_ENABLED') as boolean,
	REDIS_URI: Configuration.has('REDIS_URI') ? (Configuration.get('REDIS_URI') as string) : null,
	TLDRAW_ASSETS_ENABLED: Configuration.get('TLDRAW__ASSETS_ENABLED') as boolean,
	TLDRAW_ASSETS_MAX_SIZE: Configuration.get('TLDRAW__ASSETS_MAX_SIZE') as number,
	ASSETS_ALLOWED_MIME_TYPES_LIST: Configuration.get('TLDRAW__ASSETS_ALLOWED_MIME_TYPES_LIST') as string,
	API_HOST: Configuration.get('API_HOST') as string,
	TLDRAW_MAX_DOCUMENT_SIZE: Configuration.get('TLDRAW__MAX_DOCUMENT_SIZE') as number,
};

export const config = () => tldrawConfig;
