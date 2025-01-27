import { Factory } from 'fishery';
import { MediaSourceSyncOperationReport } from '../domain';
import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../enum';

export const mediaSourceSyncOperationReportFactory = Factory.define<MediaSourceSyncOperationReport>(() => {
	const syncOperationReportProps: MediaSourceSyncOperationReport = {
		status: MediaSourceSyncStatus.SUCCESS,
		operation: MediaSourceSyncOperation.CREATE,
		count: 10,
	};

	return syncOperationReportProps;
});
