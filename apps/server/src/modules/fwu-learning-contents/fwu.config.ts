import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const FWU_PUBLIC_API_CONFIG_TOKEN = 'FWU_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class FwuPublicApiConfig {
	@ConfigProperty('FEATURE_FWU_CONTENT_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public fwuContentEnabled = false;
}
