import { Configuration } from '@hpi-schul-cloud/commons';

export interface BoardCollaborationConfig {
	NEST_LOG_LEVEL: string;
}

const boardCollaborationConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
};

export const config = () => boardCollaborationConfig;
