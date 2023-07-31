import { Configuration } from '@hpi-schul-cloud/commons';
import { NodeEnvType } from '@src/modules/server';

export interface TldrawConfig {
	NEST_LOG_LEVEL: string;
	INCOMING_REQUEST_TIMEOUT: number;
	NODE_ENV: string;
	TLDRAW_DB_COLLECTION_NAME: string;
	TLDRAW_DB_FLUSH_SIZE: string;
	TLDRAW_DB_MULTIPLE_COLLECTIONS: boolean;
	CONNECTION_STRING: string;
}

const tldrawConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	NODE_ENV: Configuration.get('NODE_ENV') as NodeEnvType,
	TLDRAW_DB_COLLECTION_NAME: Configuration.get('TLDRAW_DB_COLLECTION_NAME') as string,
	TLDRAW_DB_FLUSH_SIZE: Configuration.get('TLDRAW_DB_FLUSH_SIZE') as number,
	TLDRAW_DB_MULTIPLE_COLLECTIONS: Configuration.get('TLDRAW_DB_MULTIPLE_COLLECTIONS') as boolean,
	CONNECTION_STRING:
		Configuration.get('NODE_ENV') === NodeEnvType.TEST
			? 'mongodb://127.0.0.1:27017/tldraw-test'
			: 'mongodb://127.0.0.1:27017/tldraw',
};

export const config = () => tldrawConfig;
