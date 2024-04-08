import { Configuration } from '@hpi-schul-cloud/commons';

const deletionConfig = {
	ADMIN_API__MODIFICATION_THRESHOLD: Configuration.get('ADMIN_API__MODIFICATION_THRESHOLD') as number,
};

const config = () => deletionConfig;

export const deletionTestConfig = () => {
	const conf = config();
	conf.ADMIN_API__MODIFICATION_THRESHOLD = 1000;
	return conf;
};
