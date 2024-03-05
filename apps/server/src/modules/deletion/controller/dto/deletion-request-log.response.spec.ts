import { ObjectId } from 'bson';
import { DomainName, OperationType } from '@shared/domain/types';
import { DomainOperationReportBuilder } from '@shared/domain/builder';
import { DeletionLogStatisticBuilder, DeletionTargetRefBuilder } from '../../builder';
import { DeletionRequestLogResponse } from './index';
import { DeletionStatusModel } from '../../domain/types';

describe(DeletionRequestLogResponse.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const targetRefDomain = DomainName.PSEUDONYMS;
				const targetRefId = new ObjectId().toHexString();
				const targetRef = DeletionTargetRefBuilder.build(targetRefDomain, targetRefId);
				const status = DeletionStatusModel.SUCCESS;
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
