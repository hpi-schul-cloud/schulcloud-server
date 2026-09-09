import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const NOTIFICATION_PUBLIC_API_CONFIG_TOKEN = 'NOTIFICATION_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class NotificationPublicApiConfig {
	@ConfigProperty('FEATURE_NOTIFICATIONS_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureNotificationsEnabled = false;
}
