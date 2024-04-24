import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { SchulcloudTheme } from '../server/types/schulcloud-theme.enum';

export interface AlertConfig {
	ALERT_CACHE_INTERVAL: number;
	SC_THEME: SchulcloudTheme;
	ALERT_STATUS_URL: string | null;
}

export const getAlertConfig = (): AlertConfig => {
	return {
		ALERT_STATUS_URL:
			Configuration.get('ALERT_STATUS_URL') === null
				? (Configuration.get('ALERT_STATUS_URL') as null)
				: (Configuration.get('ALERT_STATUS_URL') as string),
		SC_THEME: Configuration.get('SC_THEME') as SchulcloudTheme,
		ALERT_CACHE_INTERVAL: Configuration.get('ALERT_CACHE_INTERVAL') as number,
	};
};
