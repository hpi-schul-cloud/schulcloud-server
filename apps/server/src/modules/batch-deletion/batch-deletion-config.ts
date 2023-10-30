import { Configuration } from '@hpi-schul-cloud/commons';

const batchDeletionConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	DELETION_INPUT_FILE_PATH: Configuration.get('DELETION_INPUT_FILE_PATH') as string,
};

export const config = () => batchDeletionConfig;
