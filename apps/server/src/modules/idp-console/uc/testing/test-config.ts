import { Configuration } from '@hpi-schul-cloud/commons';

const synchronizationConfig = {
	SYNCHRONIZATION_CHUNK: Configuration.get('SYNCHRONIZATION_CHUNK') as number,
};

const config = () => synchronizationConfig;

export const synchronizationTestConfig = () => {
	const conf = config();
	conf.SYNCHRONIZATION_CHUNK = 1;
	return conf;
};
