import { TimeoutConfig } from '@core/interceptor/timeout-interceptor-config';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const TASK_TIMEOUT_CONFIG_TOKEN = 'TASK_TIMEOUT_CONFIG_TOKEN';
export const INCOMING_REQUEST_TIMEOUT_COPY_API_KEY = 'incomingRequestTimeoutCopyApi';

@Configuration()
export class TaskTimeoutConfig extends TimeoutConfig {
	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_COPY_API')
	@IsNumber()
	@StringToNumber()
	public [INCOMING_REQUEST_TIMEOUT_COPY_API_KEY]!: number;

	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_API')
	@IsNumber()
	@StringToNumber()
	public incomingRequestTimeout = 8000;
}
