import { Configuration } from '@hpi-schul-cloud/commons';
import { NodeEnvType } from '@src/modules/server';
import { TLDRAW_DB_URL } from '@src/config';

export interface TldrawConfig {
	NEST_LOG_LEVEL: string;
	INCOMING_REQUEST_TIMEOUT: number;
	NODE_ENV: string;
	TLDRAW_DB_COLLECTION_NAME: string;
	TLDRAW_DB_FLUSH_SIZE: string;
	TLDRAW_DB_MULTIPLE_COLLECTIONS: boolean;
	CONNECTION_STRING: string;
	FEATURE_TLDRAW_ENABLED: boolean;
}

const tldrawConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	NODE_ENV: Configuration.get('NODE_ENV') as NodeEnvType,
	TLDRAW_DB_COLLECTION_NAME: Configuration.get('TLDRAW__DB_COLLECTION_NAME') as string,
	TLDRAW_DB_FLUSH_SIZE: Configuration.get('TLDRAW__DB_FLUSH_SIZE') as number,
	TLDRAW_DB_MULTIPLE_COLLECTIONS: Configuration.get('TLDRAW__DB_MULTIPLE_COLLECTIONS') as boolean,
	FEATURE_TLDRAW_ENABLED: Configuration.get('FEATURE_TLDRAW_ENABLED') as boolean,
	CONNECTION_STRING: TLDRAW_DB_URL,
};

export const SOCKET_PORT = Configuration.get('NODE_ENV') === NodeEnvType.TEST ? 3346 : 3345;
export const config = () => tldrawConfig;
