import { MediaSourceSyncOperationReport } from '../interface';
import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../types';
import { MediaSourceSyncOperationReportFactory } from './media-source-sync-operation-report.factory';

describe(MediaSourceSyncOperationReportFactory.name, () => {
	describe('build', () => {
		describe('when the operation, status and count is passed', () => {
			it('should return the correct sync operation report', () => {
				const operation = MediaSourceSyncOperation.ANY;
				const status = MediaSourceSyncStatus.SUCCESS;
				const count = 50;

				const report = MediaSourceSyncOperationReportFactory.build(operation, status, count);

				expect(report).toMatchObject<MediaSourceSyncOperationReport>({
					operation,
					status,
					count,
				});
			});
		});

		describe('when no count is passed', () => {
			it('should return the correct sync operation report with 0 count', () => {
				const operation = MediaSourceSyncOperation.ANY;
				const status = MediaSourceSyncStatus.SUCCESS;

				const report = MediaSourceSyncOperationReportFactory.build(operation, status);

				expect(report).toMatchObject<MediaSourceSyncOperationReport>({
					operation,
					status,
					count: 0,
				});
			});
		});
	});

	describe('buildWithSuccessStatus', () => {
		describe('when the operation and count is passed', () => {
			it('should return the correct sync operation report', () => {
				const operation = MediaSourceSyncOperation.ANY;
				const count = 45;

				const report = MediaSourceSyncOperationReportFactory.buildWithSuccessStatus(operation, count);

				expect(report).toMatchObject<MediaSourceSyncOperationReport>({
					operation,
					status: MediaSourceSyncStatus.SUCCESS,
					count,
				});
			});
		});

		describe('when no count is passed', () => {
			it('should return the correct sync operation report with 0 count', () => {
				const operation = MediaSourceSyncOperation.ANY;

				const report = MediaSourceSyncOperationReportFactory.buildWithSuccessStatus(operation);

				expect(report).toMatchObject<MediaSourceSyncOperationReport>({
					operation,
					status: MediaSourceSyncStatus.SUCCESS,
					count: 0,
				});
			});
		});
	});

	describe('buildWithFailedStatus', () => {
		describe('when the operation and count is passed', () => {
			it('should return the correct sync operation report', () => {
				const operation = MediaSourceSyncOperation.CREATE;
				const count = 35;

				const report = MediaSourceSyncOperationReportFactory.buildWithFailedStatus(operation, count);

				expect(report).toMatchObject<MediaSourceSyncOperationReport>({
					operation,
					status: MediaSourceSyncStatus.FAILED,
					count,
				});
			});
		});

		describe('when no count is passed', () => {
			it('should return the correct sync operation report with 0 count', () => {
				const operation = MediaSourceSyncOperation.CREATE;

				const report = MediaSourceSyncOperationReportFactory.buildWithFailedStatus(operation);

				expect(report).toMatchObject<MediaSourceSyncOperationReport>({
					operation,
					status: MediaSourceSyncStatus.FAILED,
					count: 0,
				});
			});
		});
	});

	describe('buildUndeliveredReport', () => {
		describe('when the count is passed', () => {
			it('should return the correct sync operation report', () => {
				const count = 15;

				const report = MediaSourceSyncOperationReportFactory.buildUndeliveredReport(count);

				expect(report).toMatchObject<MediaSourceSyncOperationReport>({
					operation: MediaSourceSyncOperation.ANY,
					status: MediaSourceSyncStatus.UNDELIVERED,
					count,
				});
			});
		});

		describe('when no count is passed', () => {
			it('should return the correct sync operation report with 0 count', () => {
				const report = MediaSourceSyncOperationReportFactory.buildUndeliveredReport();

				expect(report).toMatchObject<MediaSourceSyncOperationReport>({
					operation: MediaSourceSyncOperation.ANY,
					status: MediaSourceSyncStatus.UNDELIVERED,
					count: 0,
				});
			});
		});

		describe('buildWithPartialStatus', () => {
			describe('when the operation and count is passed', () => {
				it('should return the correct sync operation report', () => {
					const operation = MediaSourceSyncOperation.UPDATE;
					const count = 35;

					const report = MediaSourceSyncOperationReportFactory.buildWithPartialStatus(operation, count);

					expect(report).toMatchObject<MediaSourceSyncOperationReport>({
						operation,
						status: MediaSourceSyncStatus.PARTIAL,
						count,
					});
				});
			});

			describe('when no count is passed', () => {
				it('should return the correct sync operation report with 0 count', () => {
					const operation = MediaSourceSyncOperation.CREATE;

					const report = MediaSourceSyncOperationReportFactory.buildWithPartialStatus(operation);

					expect(report).toMatchObject<MediaSourceSyncOperationReport>({
						operation,
						status: MediaSourceSyncStatus.PARTIAL,
						count: 0,
					});
				});
			});
		});
	});
});
