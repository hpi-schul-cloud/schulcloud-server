import { Configuration } from '@hpi-schul-cloud/commons';
import { JwtAuthGuardConfig } from '@infra/auth-guard';
import { TldrawClientConfig } from '@infra/tldraw-client';
import { Algorithm } from 'jsonwebtoken';

export interface BoardCollaborationConfig extends JwtAuthGuardConfig, TldrawClientConfig {
	NEST_LOG_LEVEL: string;
}

const boardCollaborationConfig: BoardCollaborationConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	// Node's process.env escapes newlines. We need to reverse it for the keys to work.
	// See: https://stackoverflow.com/questions/30400341/environment-variables-containing-newlines-in-node
	JWT_PUBLIC_KEY: (Configuration.get('JWT_PUBLIC_KEY') as string).replace(/\\n/g, '\n'),
	JWT_SIGNING_ALGORITHM: Configuration.get('JWT_SIGNING_ALGORITHM') as Algorithm,
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
	TLDRAW_ADMIN_API_CLIENT_BASE_URL: Configuration.get('TLDRAW_ADMIN_API_CLIENT__BASE_URL') as string,
	TLDRAW_ADMIN_API_CLIENT_API_KEY: Configuration.get('TLDRAW_ADMIN_API_CLIENT__API_KEY') as string,
};

export const config = () => boardCollaborationConfig;
