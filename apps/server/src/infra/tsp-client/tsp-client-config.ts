import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber, IsString } from 'class-validator';

export const TSP_CLIENT_CONFIG_TOKEN = 'TSP_CLIENT_CONFIG_TOKEN';

@Configuration()
export class TspClientConfig {
	@ConfigProperty('TSP_API_CLIENT_BASE_URL')
	@IsString()
	public baseUrl!: string;

	@ConfigProperty('TSP_API_CLIENT_TOKEN_LIFETIME_MS')
	@StringToNumber()
	@IsNumber()
	public tokenLifetimeMs = 30000;
}
