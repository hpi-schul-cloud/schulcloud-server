import { config } from '../config/alert-config';

export const alertTestConfig = () => {
	const conf = config();
	conf.INSTANCE = 'DEFAULT';
	conf.ALERT_STATUS_URL = 'test';
	return conf;
};
