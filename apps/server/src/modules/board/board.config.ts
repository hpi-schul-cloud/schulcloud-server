import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const BOARD_CONFIG_TOKEN = 'BOARD_CONFIG_TOKEN';
export const BOARD_PUBLIC_API_CONFIG_TOKEN = 'BOARD_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class BoardPublicApiConfig {
	@ConfigProperty('FEATURE_MEDIA_SHELF_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureMediaShelfEnabled = false;

	@ConfigProperty('FEATURE_BOARD_READERS_CAN_EDIT_TOGGLE')
	@StringToBoolean()
	@IsBoolean()
	public featureBoardReadersCanEditToggle = true;
}

@Configuration()
export class BoardConfig extends BoardPublicApiConfig {
	@ConfigProperty('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureSchulconnexMediaLicenseEnabled = false;

	@ConfigProperty('FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureVidisMediaActivationsEnabled = false;

	@ConfigProperty('FEATURE_CTL_TOOLS_COPY_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureCtlToolsCopyEnabled = false;
}
