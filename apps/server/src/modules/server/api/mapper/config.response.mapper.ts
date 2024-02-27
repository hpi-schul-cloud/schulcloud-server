import { ServerConfig } from '../../server.config';
import { ConfigResponse } from '../dto';

export class ConfigResponseMapper {
	public static mapToResponse(config: ServerConfig): ConfigResponse {
		const configResponse = new ConfigResponse(config);

		return configResponse;
	}
}
