import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { IsBoolean, IsNumber, ValidateIf } from 'class-validator';

export const SYNC_CONFIG_TOKEN = 'SYNC_CONFIG_TOKEN';

@Configuration()
export class SyncConfig {
	@ConfigProperty('FEATURE_TSP_SYNC_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public tspSyncEnabled = false;

	@ConfigProperty('TSP_SYNC_SCHOOL_LIMIT')
	@StringToNumber()
	@IsNumber()
	@ValidateIf((o: SyncConfig) => o.tspSyncEnabled)
	public schoolLimit = 10;

	@ConfigProperty('TSP_SYNC_SCHOOL_DAYS_TO_FETCH')
	@StringToNumber()
	@IsNumber()
	@ValidateIf((o: SyncConfig) => o.tspSyncEnabled)
	public schoolDaysToFetch = 1;

	@ConfigProperty('TSP_SYNC_DATA_LIMIT')
	@StringToNumber()
	@IsNumber()
	@ValidateIf((o: SyncConfig) => o.tspSyncEnabled)
	public dataLimit = 150;

	@ConfigProperty('TSP_SYNC_DATA_DAYS_TO_FETCH')
	@StringToNumber()
	@IsNumber()
	@ValidateIf((o: SyncConfig) => o.tspSyncEnabled)
	public dataDaysToFetch = 1;
}
