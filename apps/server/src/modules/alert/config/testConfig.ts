import { config } from './alert-config';

export const alertTestConfig = () => {
	const conf = config();
	conf.INSTANCE = 'dbc';
	conf.ALERT_STATUS_URL = 'test';
	return conf;
};
