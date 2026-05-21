import { TimeoutConfig } from '@core/interceptor/timeout-interceptor-config.interface';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const LEARNROOM_TIMEOUT_CONFIG_TOKEN = 'LEARNROOM_TIMEOUT_CONFIG_TOKEN';
export const LEARNROOM_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY = 'learnroomIncomingRequestTimeoutCopyApi';

@Configuration()
export class LearnroomTimeoutConfig extends TimeoutConfig {
	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_COPY_API')
	@IsNumber()
	@StringToNumber()
	public [LEARNROOM_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY] = 60000;
}
