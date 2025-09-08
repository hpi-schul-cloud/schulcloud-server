import { Factory } from 'fishery';
import { MediaSourceSyncOperationReport } from '../interface';
import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../types';

export const mediaSourceSyncOperationReportFactory = Factory.define<MediaSourceSyncOperationReport>(() => {
	const syncOperationReportProps: MediaSourceSyncOperationReport = {
		status: MediaSourceSyncStatus.SUCCESS,
		operation: MediaSourceSyncOperation.CREATE,
		count: 10,
	};

	return syncOperationReportProps;
});
