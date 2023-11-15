import { DeletionDomainModel } from '../../domain/types/deletion-domain-model.enum';
import { DeletionLogStatisticBuilder } from '../../uc/builder/deletion-log-statistic.builder';
import { DeletionTargetRefBuilder } from '../../uc/builder/deletion-target-ref.builder';
import { DeletionRequestLogResponse } from './deletion-request-log.response';

describe(DeletionRequestLogResponse.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const targetRefDomain = DeletionDomainModel.PSEUDONYMS;
				const targetRefId = '653e4833cc39e5907a1e18d2';
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
