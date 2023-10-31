import { Configuration } from '@hpi-schul-cloud/commons';

const batchDeletionConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	TARGET_REF_DOMAIN: Configuration.get('BATCH_DELETION__TARGET_REF_DOMAIN') as string,
	TARGET_REFS_FILE_PATH: Configuration.get('BATCH_DELETION__TARGET_REFS_FILE_PATH') as string,
	DELETE_IN_MINUTES: Configuration.get('BATCH_DELETION__DELETE_IN_MINUTES') as number,
};

export const config = () => batchDeletionConfig;
