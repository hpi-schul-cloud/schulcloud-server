import { ObjectId } from 'bson';
import { DeletionDomainModel, DeletionStatusModel } from '../../domain/types';
import { DeletionLogStatisticBuilder, DeletionTargetRefBuilder } from '../../builder';
import { DeletionRequestLogResponse } from './index';

describe(DeletionRequestLogResponse.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const targetRefDomain = DeletionDomainModel.PSEUDONYMS;
				const targetRefId = new ObjectId().toHexString();
				const targetRef = DeletionTargetRefBuilder.build(targetRefDomain, targetRefId);
				const status = DeletionStatusModel.SUCCESS;
				const deletionPlannedAt = new Date();
				const modifiedCount = 0;
				const deletedCount = 2;
				const statistics = [DeletionLogStatisticBuilder.build(targetRefDomain, modifiedCount, deletedCount)];

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
