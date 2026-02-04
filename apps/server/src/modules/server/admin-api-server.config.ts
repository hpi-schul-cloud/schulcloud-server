import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const ADMIN_API_SERVER_CONFIG_TOKEN = 'ADMIN_API_SERVER_CONFIG_TOKEN';

@Configuration()
export class AdminApiServerConfig {
	@ConfigProperty('ADMIN_API__PORT')
	@StringToNumber()
	@IsNumber()
	public port = 4030;
}
