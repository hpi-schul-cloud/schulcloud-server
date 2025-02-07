import { Factory } from 'fishery';
import { MediaSourceSyncReport } from '../interface';
import { mediaSourceSyncOperationReportFactory } from './media-source-sync-operation-report.factory';

export const mediaSourceSyncReportFactory = Factory.define<MediaSourceSyncReport>(() => {
	const syncReportProps: MediaSourceSyncReport = {
		totalCount: 10,
		successCount: 10,
		failedCount: 0,
		undeliveredCount: 0,
		operations: mediaSourceSyncOperationReportFactory.buildList(1),
	};

	return syncReportProps;
});
