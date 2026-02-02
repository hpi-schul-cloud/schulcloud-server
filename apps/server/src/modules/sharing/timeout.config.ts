import { TimeoutConfig } from '@core/interceptor/timeout-interceptor-config';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const SHARING_TIMEOUT_CONFIG_TOKEN = 'SHARING_TIMEOUT_CONFIG_TOKEN';
export const INCOMING_REQUEST_TIMEOUT_COPY_API_KEY = 'incomingRequestTimeoutCopyApi';

@Configuration()
export class SharingTimeoutConfig extends TimeoutConfig {
	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_COPY_API')
	@IsNumber()
	@StringToNumber()
	public [INCOMING_REQUEST_TIMEOUT_COPY_API_KEY]!: number;
}
