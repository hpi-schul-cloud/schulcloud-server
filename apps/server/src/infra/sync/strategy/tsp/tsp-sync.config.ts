import { SyncConfig } from '../../sync.config';

export interface TspSyncConfig extends SyncConfig {
	TSP_SYNC_SCHOOL_LIMIT: number;
	TSP_SYNC_SCHOOL_DAYS_TO_FETCH: number;
	TSP_SYNC_DATA_LIMIT: number;
	TSP_SYNC_DATA_DAYS_TO_FETCH: number;
	TSP_SYNC_MIGRATION_LIMIT: number;
}
