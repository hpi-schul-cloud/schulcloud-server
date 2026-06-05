import { TimeoutConfig } from '@core/interceptor/timeout-interceptor-config.interface';
import { Configuration } from '@infra/configuration';
import { IsNumber } from 'class-validator';

export const NOTIFICATION_TIMEOUT_CONFIG_TOKEN = 'NOTIFICATION_TIMEOUT_CONFIG_TOKEN';

@Configuration()
export class NotificationTimeoutConfig extends TimeoutConfig {
	@IsNumber()
	public SSE_TIMEOUT = 1000 * 60 * 60 * 24;
}
