import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const SYNC_CONFIG_TOKEN = 'SYNC_CONFIG_TOKEN';

@Configuration()
export class SyncConfig {
	@ConfigProperty('FEATURE_TSP_SYNC_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public tspSyncEnabled = false;
}
