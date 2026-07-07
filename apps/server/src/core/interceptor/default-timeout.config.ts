import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';
import { TimeoutConfig } from './timeout-interceptor-config.interface';

export const DEFAULT_TIMEOUT_CONFIG_TOKEN = 'DEFAULT_TIMEOUT_CONFIG_TOKEN';

@Configuration()
export class DefaultTimeoutConfig extends TimeoutConfig {
	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_API')
	@IsNumber()
	@StringToNumber()
	public incomingRequestTimeout = 8000;
}
