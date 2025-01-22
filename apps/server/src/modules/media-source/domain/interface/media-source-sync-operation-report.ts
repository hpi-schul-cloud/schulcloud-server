import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../../enum';

export interface MediaSourceSyncOperationReport {
	operation: MediaSourceSyncOperation;
	status: MediaSourceSyncStatus;
	count: number;
}
