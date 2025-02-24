import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../types';

export interface MediaSourceSyncOperationReport {
	operation: MediaSourceSyncOperation;
	status: MediaSourceSyncStatus;
	count: number;
}
