import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export abstract class TimeoutConfig {
	[key: string]: number;
}

export const TIMEOUT_INTERCEPTOR_CONFIG_TOKEN = 'TIMEOUT_INTERCEPTOR_CONFIG_TOKEN';

@Configuration()
export class TimeoutInterceptorConfig extends TimeoutConfig {
	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_API')
	@IsNumber()
	@StringToNumber()
	public incomingRequestTimeout = 8000;
}
