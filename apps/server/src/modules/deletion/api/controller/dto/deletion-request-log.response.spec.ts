import { DomainName, StatusModel, OperationType } from '@src/modules/deletion/domain/types';
import { ObjectId } from 'bson';
import { DomainOperationReportBuilder } from '../../../domain/builder';
import { DeletionTargetRefBuilder, DeletionLogStatisticBuilder } from './builder';
import { DeletionRequestLogResponse } from './deletion-request-log.response';

describe(DeletionRequestLogResponse.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const targetRefDomain = DomainName.PSEUDONYMS;
				const targetRefId = new ObjectId().toHexString();
				const targetRef = DeletionTargetRefBuilder.build(targetRefDomain, targetRefId);
				const status = StatusModel.SUCCESS;
				const deletionPlannedAt = new Date();
				const operations = [
					DomainOperationReportBuilder.build(OperationType.DELETE, 2, [
						new ObjectId().toHexString(),
						new ObjectId().toHexString(),
					]),
				];
				const statistics = [DeletionLogStatisticBuilder.build(targetRefDomain, operations)];

				return { targetRef, deletionPlannedAt, status, statistics };
			};

			it('should set the id', () => {
				const { targetRef, deletionPlannedAt, status, statistics } = setup();

				const deletionRequestLog = new DeletionRequestLogResponse({ targetRef, deletionPlannedAt, status, statistics });

				expect(deletionRequestLog.targetRef).toEqual(targetRef);
				expect(deletionRequestLog.deletionPlannedAt).toEqual(deletionPlannedAt);
				expect(deletionRequestLog.status).toEqual(status);
				expect(deletionRequestLog.statistics).toEqual(statistics);
			});
		});
	});
});
