import { Configuration } from '@hpi-schul-cloud/commons/lib';

export interface AlertConfig {
	INSTANCE: string;
	ALERT_STATUS_URL: string;
}

const alertConfig = {
	INSTANCE: Configuration.get('SC_THEME') as string,
	ALERT_STATUS_URL: Configuration.get('ALERT_STATUS_URL') as string,
};

export const config = () => alertConfig;
