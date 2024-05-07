import { Configuration } from '@hpi-schul-cloud/commons';

const deletionConfig = {
	MODIFICATION_THRESHOLD_MS: Configuration.get('ADMIN_API__MODIFICATION_THRESHOLD_MS') as number,
	MAX_AMOUNT_OF_DELETIONREQUESTS_DO_CONCURENTLY: Configuration.get(
		'ADMIN_API__MAX_AMOUNT_OF_DELETIONREQUESTS_DO_CONCURENTLY'
	) as number,
	DELETION_DELAY_MILLISECONDS: Configuration.get('ADMIN_API__DELETION_DELAY_MILLISECONDS') as number,
};

const config = () => deletionConfig;

export const deletionTestConfig = () => {
	const conf = config();
	conf.MODIFICATION_THRESHOLD_MS = 1000;
	conf.MAX_AMOUNT_OF_DELETIONREQUESTS_DO_CONCURENTLY = 2;
	conf.DELETION_DELAY_MILLISECONDS = 100;
	return conf;
};
