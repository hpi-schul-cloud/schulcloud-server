import { Configuration } from '@hpi-schul-cloud/commons';

const deletionConfig = {
	ADMIN_API__MODIFICATION_THRESHOLD_MS: Configuration.get('ADMIN_API__MODIFICATION_THRESHOLD_MS') as number,
};

const config = () => deletionConfig;

export const deletionTestConfig = () => {
	const conf = config();
	conf.ADMIN_API__MODIFICATION_THRESHOLD_MS = 1000;
	return conf;
};
