import { config } from '../../config';

export const synchronizationTestConfig = () => {
	const conf = config();
	conf.SYNCHRONIZATION_CHUNK = 10000;
	return conf;
};