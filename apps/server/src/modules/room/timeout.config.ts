import { TimeoutConfig } from '@core/interceptor/timeout-interceptor-config.interface';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const ROOM_TIMEOUT_CONFIG_TOKEN = 'ROOM_TIMEOUT_CONFIG_TOKEN';
export const ROOM_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY = 'roomIncomingRequestTimeoutCopyApi';

@Configuration()
export class RoomTimeoutConfig extends TimeoutConfig {
	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_COPY_API')
	@IsNumber()
	@StringToNumber()
	public [ROOM_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY] = 60000;
}
