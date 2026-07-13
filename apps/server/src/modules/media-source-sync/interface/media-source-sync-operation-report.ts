import { type MediaSourceSyncOperation, type MediaSourceSyncStatus } from '../types';

export interface MediaSourceSyncOperationReport {
	operation: MediaSourceSyncOperation;
	status: MediaSourceSyncStatus;
	count: number;
}
