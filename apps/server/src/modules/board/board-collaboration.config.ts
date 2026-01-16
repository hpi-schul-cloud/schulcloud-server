import { Configuration } from '@hpi-schul-cloud/commons';
import { TldrawClientConfig } from '@infra/tldraw-client';

export interface BoardCollaborationConfig extends TldrawClientConfig {
	NEST_LOG_LEVEL: string;
}

const boardCollaborationConfig: BoardCollaborationConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	TLDRAW_ADMIN_API_CLIENT_BASE_URL: Configuration.get('TLDRAW_ADMIN_API_CLIENT__BASE_URL') as string,
	TLDRAW_ADMIN_API_CLIENT_API_KEY: Configuration.get('TLDRAW_ADMIN_API_CLIENT__API_KEY') as string,
};

export const config = () => boardCollaborationConfig;
