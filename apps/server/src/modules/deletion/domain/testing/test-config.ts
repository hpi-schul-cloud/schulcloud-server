import { Configuration } from '@hpi-schul-cloud/commons';

const deletionConfig = {
	ADMIN_API__DELETION_DELETE_AFTER_MINUTES: Configuration.get('ADMIN_API__DELETION_DELETE_AFTER_MINUTES') as number,
	ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS: Configuration.get(
		'ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS'
	) as number,
	ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS: Configuration.get(
		'ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS'
	) as number,
	ADMIN_API__DELETION_EXECUTION_BATCH_NUMBER: Configuration.get('ADMIN_API__DELETION_EXECUTION_BATCH_NUMBER') as number,
};

const config = () => deletionConfig;

export const deletionTestConfig = () => {
	const conf = config();
	conf.ADMIN_API__DELETION_DELETE_AFTER_MINUTES = 1;
	conf.ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS = 100;
	conf.ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS = 1000;
	conf.ADMIN_API__DELETION_EXECUTION_BATCH_NUMBER = 2;
	return conf;
};
