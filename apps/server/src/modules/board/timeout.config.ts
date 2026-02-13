import { TimeoutConfig } from '@core/interceptor';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const BOARD_TIMEOUT_CONFIG_TOKEN = 'BOARD_TIMEOUT_CONFIG_TOKEN';
export const BOARD_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY = 'boardIncomingRequestTimeoutCopyApi';

@Configuration()
export class BoardTimeoutConfig extends TimeoutConfig {
	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_COPY_API')
	@IsNumber()
	@StringToNumber()
	public [BOARD_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY] = 60000;
}
