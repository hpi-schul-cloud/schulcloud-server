import { ObjectId } from 'bson';
import { DomainModel } from '@shared/domain/types';
import { DeletionLogStatisticBuilder, DeletionTargetRefBuilder } from '../../builder';
import { DeletionRequestLogResponse } from './index';

describe(DeletionRequestLogResponse.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const targetRefDomain = DomainModel.PSEUDONYMS;
				const targetRefId = new ObjectId().toHexString();
				const targetRef = DeletionTargetRefBuilder.build(targetRefDomain, targetRefId);
				const deletionPlannedAt = new Date();
				const modifiedCount = 0;
				const deletedCount = 2;
				const statistics = [DeletionLogStatisticBuilder.build(targetRefDomain, modifiedCount, deletedCount)];

				return { targetRef, deletionPlannedAt, statistics };
			};

			it('should set the id', () => {
				const { targetRef, deletionPlannedAt, statistics } = setup();

				const deletionRequestLog = new DeletionRequestLogResponse({ targetRef, deletionPlannedAt, statistics });

				expect(deletionRequestLog.targetRef).toEqual(targetRef);
				expect(deletionRequestLog.deletionPlannedAt).toEqual(deletionPlannedAt);
				expect(deletionRequestLog.statistics).toEqual(statistics);
			});
		});
	});
});
