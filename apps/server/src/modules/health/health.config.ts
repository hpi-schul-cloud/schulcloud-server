import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsUrl } from 'class-validator';

export const HEALTH_CONFIG_TOKEN = 'HEALTH_CONFIG_TOKEN';

@Configuration()
export class HealthConfig {
	@ConfigProperty('HOSTNAME')
	@IsUrl({ require_tld: false })
	public hostname!: string;

	@ConfigProperty('HEALTH_CHECKS_EXCLUDE_MONGODB')
	@StringToBoolean()
	@IsBoolean()
	public excludeMongoDB = false;
}
