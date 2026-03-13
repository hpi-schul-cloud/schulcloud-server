import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const IDP_CONSOLE_CONFIG_TOKEN = 'IDP_CONSOLE_CONFIG_TOKEN';

@Configuration()
export class IdpConsoleConfig {
	@ConfigProperty('SYNCHRONIZATION_CHUNK')
	@StringToNumber()
	@IsNumber()
	public synchronizationChunk = 10000;
}
