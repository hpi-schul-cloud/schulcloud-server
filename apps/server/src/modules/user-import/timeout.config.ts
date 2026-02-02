import { TimeoutConfig } from '@core/interceptor/timeout-interceptor-config';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const TASK_TIMEOUT_CONFIG_TOKEN = 'TASK_TIMEOUT_CONFIG_TOKEN';
export const IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS_KEY = 'importUserSaveAllMatchesRequestTimeoutMs';
export const SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS_KEY = 'schulconnexClientPersonenInfoTimeoutInMs';
@Configuration()
export class TaskTimeoutConfig extends TimeoutConfig {
	@ConfigProperty('IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS')
	@IsNumber()
	@StringToNumber()
	public [IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS_KEY]!: number;

	@ConfigProperty('SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS')
	@IsNumber()
	@StringToNumber()
	public [SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS_KEY]!: number;

	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_API')
	@IsNumber()
	@StringToNumber()
	public incomingRequestTimeout = 8000;
}
