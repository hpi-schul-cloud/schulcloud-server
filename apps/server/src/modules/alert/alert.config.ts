import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { SchulcloudTheme } from '@shared/domain/types';
import { IsEnum, IsNumber, IsUrl } from 'class-validator';

export const ALERT_PUBLIC_API_CONFIG = 'ALERT_PUBLIC_API_CONFIG_TOKEN';
export const ALERT_CONFIG = 'ALERT_CONFIG_TOKEN';

@Configuration()
export class AlertPublicApiConfig {
	@ConfigProperty('ALERT_STATUS_URL')
	@IsUrl({ require_tld: false })
	public alertStatusUrl!: string;
}

@Configuration()
export class AlertConfig extends AlertPublicApiConfig {
	@ConfigProperty('ALERT_CACHE_INTERVAL_MIN')
	@IsNumber()
	@StringToNumber()
	public alertCacheIntervalMin = 1;

	@ConfigProperty('SC_THEME')
	@IsEnum(SchulcloudTheme)
	public scTheme!: SchulcloudTheme;
}
