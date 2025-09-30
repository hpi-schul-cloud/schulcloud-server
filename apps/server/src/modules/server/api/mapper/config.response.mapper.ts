import { ApplicationSettingsConfig } from '../../application-settings.config';
import { ConfigResponse } from '../dto';

export class ConfigResponseMapper {
	public static mapToResponse(config: ApplicationSettingsConfig): ConfigResponse {
		const configResponse = new ConfigResponse(config);

		return configResponse;
	}
}
