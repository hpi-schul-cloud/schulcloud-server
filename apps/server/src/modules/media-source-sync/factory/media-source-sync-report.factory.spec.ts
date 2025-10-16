import { MediaSourceSyncReport } from '../interface';
import { mediaSourceSyncOperationReportFactory } from '../testing';
import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../types';
import { MediaSourceSyncReportFactory } from './media-source-sync-report.factory';

describe(MediaSourceSyncReportFactory.name, () => {
	describe('buildFromOperations', () => {
		describe('when all operations have count more than 0', () => {
			const setup = () => {
				const createSuccessCount = 10;
				const updateSuccessCount = 5;
				const createFailedCount = 8;
				const updateFailedCount = 7;
				const undeliveredCount = 3;
				const partialCount = 7;

				const operations = [
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.CREATE,
						status: MediaSourceSyncStatus.SUCCESS,
						count: createSuccessCount,
					}),
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.UPDATE,
						status: MediaSourceSyncStatus.SUCCESS,
						count: updateSuccessCount,
					}),
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.CREATE,
						status: MediaSourceSyncStatus.FAILED,
						count: createFailedCount,
					}),
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.UPDATE,
						status: MediaSourceSyncStatus.FAILED,
						count: updateFailedCount,
					}),
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.ANY,
						status: MediaSourceSyncStatus.UNDELIVERED,
						count: undeliveredCount,
					}),
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.ANY,
						status: MediaSourceSyncStatus.PARTIAL,
						count: partialCount,
					}),
				];

				const successCount = createSuccessCount + updateSuccessCount;
				const failedCount = createFailedCount + updateFailedCount;

				const totalCount = successCount + failedCount + undeliveredCount + partialCount;

				const expectedSyncReport: Partial<MediaSourceSyncReport> = {
					totalCount,
					successCount,
					undeliveredCount,
					failedCount,
					partialCount,
				};

				return { operations, expectedSyncReport };
			};

			it('should return the correct sync report', () => {
				const { operations, expectedSyncReport } = setup();

				const report: MediaSourceSyncReport = MediaSourceSyncReportFactory.buildFromOperations(operations);
				report.operations = report.operations.sort();

				expect(report).toMatchObject(expectedSyncReport);
				expect(report.operations).toEqual(expect.arrayContaining(operations));
			});
		});

		describe('when there are operations with count 0', () => {
			const setup = () => {
				const createSuccessCount = 10;
				const updateSuccessCount = 0;
				const createFailedCount = 0;
				const updateFailedCount = 5;
				const undeliveredCount = 0;
				const partialCount = 0;

				const operations = [
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.CREATE,
						status: MediaSourceSyncStatus.SUCCESS,
						count: createSuccessCount,
					}),
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.UPDATE,
						status: MediaSourceSyncStatus.SUCCESS,
						count: updateSuccessCount,
					}),
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.CREATE,
						status: MediaSourceSyncStatus.FAILED,
						count: createFailedCount,
					}),
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.UPDATE,
						status: MediaSourceSyncStatus.FAILED,
						count: updateFailedCount,
					}),
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.ANY,
						status: MediaSourceSyncStatus.UNDELIVERED,
						count: undeliveredCount,
					}),
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.ANY,
						status: MediaSourceSyncStatus.PARTIAL,
						count: partialCount,
					}),
				];

				const successCount = createSuccessCount + updateSuccessCount;
				const failedCount = createFailedCount + updateFailedCount;

				const totalCount = successCount + failedCount + undeliveredCount + partialCount;

				const expectedSyncReport: Partial<MediaSourceSyncReport> = {
					totalCount,
					successCount,
					undeliveredCount,
					failedCount,
				};

				const expectedOperations = [
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.UPDATE,
						status: MediaSourceSyncStatus.FAILED,
						count: updateFailedCount,
					}),
					mediaSourceSyncOperationReportFactory.build({
						operation: MediaSourceSyncOperation.CREATE,
						status: MediaSourceSyncStatus.SUCCESS,
						count: createSuccessCount,
					}),
				];

				return { operations, expectedSyncReport, expectedOperations };
			};

			it('should return the correct sync report without any 0 count operation report', () => {
				const { operations, expectedSyncReport, expectedOperations } = setup();

				const report: MediaSourceSyncReport = MediaSourceSyncReportFactory.buildFromOperations(operations);

				expect(report).toMatchObject(expectedSyncReport);
				expect(report.operations).toEqual(expect.arrayContaining(expectedOperations));
			});
		});
	});
});
