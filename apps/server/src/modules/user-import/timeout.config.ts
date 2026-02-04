import { TimeoutConfig } from '@core/interceptor/timeout-interceptor-config.interface';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const USER_IMPORT_TIMEOUT_CONFIG_TOKEN = 'USER_IMPORT_TIMEOUT_CONFIG_TOKEN';
export const IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS_KEY = 'importUserSaveAllMatchesRequestTimeoutMs';
export const SCHULCONNEX_CLIENT_PERSONEN_INFO_TIMEOUT_IN_MS_KEY = 'schulconnexClientPersonenInfoTimeoutInMs';
@Configuration()
export class UserImportTimeoutConfig extends TimeoutConfig {
	@ConfigProperty('IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS')
	@IsNumber()
	@StringToNumber()
	public [IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS_KEY] = 60000;

	@ConfigProperty('SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS')
	@IsNumber()
	@StringToNumber()
	public [SCHULCONNEX_CLIENT_PERSONEN_INFO_TIMEOUT_IN_MS_KEY] = 120000;
}
