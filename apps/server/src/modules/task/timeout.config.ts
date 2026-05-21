import { TimeoutConfig } from '@core/interceptor/timeout-interceptor-config.interface';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const TASK_TIMEOUT_CONFIG_TOKEN = 'TASK_TIMEOUT_CONFIG_TOKEN';
export const TASK_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY = 'taskIncomingRequestTimeoutCopyApi';

@Configuration()
export class TaskTimeoutConfig extends TimeoutConfig {
	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_COPY_API')
	@IsNumber()
	@StringToNumber()
	public [TASK_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY] = 60000;
}
