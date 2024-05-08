import { Configuration } from '@hpi-schul-cloud/commons';

const deletionConfig = {
	ADMIN_API__MODIFICATION_THRESHOLD_MS: Configuration.get('ADMIN_API__MODIFICATION_THRESHOLD_MS') as number,
	ADMIN_API__MAX_CONCURRENT_DELETION_REQUESTS: Configuration.get(
		'ADMIN_API__MAX_CONCURRENT_DELETION_REQUESTS'
	) as number,
	ADMIN_API__DELETION_DELAY_MILLISECONDS: Configuration.get('ADMIN_API__DELETION_DELAY_MILLISECONDS') as number,
};

const config = () => deletionConfig;

export const deletionTestConfig = () => {
	const conf = config();
	conf.ADMIN_API__MODIFICATION_THRESHOLD_MS = 1000;
	conf.ADMIN_API__MAX_CONCURRENT_DELETION_REQUESTS = 2;
	conf.ADMIN_API__DELETION_DELAY_MILLISECONDS = 100;
	return conf;
};
