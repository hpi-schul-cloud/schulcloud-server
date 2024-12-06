import { Configuration } from '@hpi-schul-cloud/commons';
import { JwtAuthGuardConfig } from '@infra/auth-guard';
import { Algorithm } from 'jsonwebtoken';
import { getTldrawClientConfig } from '../tldraw-client';

export interface BoardCollaborationConfig extends JwtAuthGuardConfig {
	NEST_LOG_LEVEL: string;
}

const boardCollaborationConfig: BoardCollaborationConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	// Node's process.env escapes newlines. We need to reverse it for the keys to work.
	// See: https://stackoverflow.com/questions/30400341/environment-variables-containing-newlines-in-node
	JWT_PUBLIC_KEY: (Configuration.get('JWT_PUBLIC_KEY') as string).replace(/\\n/g, '\n'),
	JWT_SIGNING_ALGORITHM: Configuration.get('JWT_SIGNING_ALGORITHM') as Algorithm,
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
	...getTldrawClientConfig(),
};

export const config = () => boardCollaborationConfig;
