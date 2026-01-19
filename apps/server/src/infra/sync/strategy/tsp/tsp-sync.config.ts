import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsNumber } from 'class-validator';

export const TSP_SYNC_CONFIG_TOKEN = 'TSP_SYNC_CONFIG_TOKEN';

@Configuration()
export class TspSyncConfig {
	@ConfigProperty('TSP_SYNC_SCHOOL_LIMIT')
	@IsNumber()
	public schoolLimit = 10;

	@ConfigProperty('TSP_SYNC_SCHOOL_DAYS_TO_FETCH')
	@IsNumber()
	public schoolDaysToFetch = 1;

	@ConfigProperty('TSP_SYNC_DATA_LIMIT')
	@IsNumber()
	public dataLimit = 150;

	@ConfigProperty('TSP_SYNC_DATA_DAYS_TO_FETCH')
	@IsNumber()
	public dataDaysToFetch = 1;
}
