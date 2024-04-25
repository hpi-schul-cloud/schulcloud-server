import { SchulcloudTheme } from '@shared/domain/types';

export interface AlertConfig {
	ALERT_CACHE_INTERVAL_MIN: number;
	SC_THEME: SchulcloudTheme;
	ALERT_STATUS_URL: string | null;
}
