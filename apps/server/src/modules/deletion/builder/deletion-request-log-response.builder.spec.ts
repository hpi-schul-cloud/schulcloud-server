import { DeletionDomainModel } from '../domain/types';
import { DeletionLogStatisticBuilder, DeletionRequestLogResponseBuilder, DeletionTargetRefBuilder } from '.';

describe(DeletionRequestLogResponseBuilder, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should build generic deletionRequestLog with all attributes', () => {
		// Arrange
		const targetRefDomain = DeletionDomainModel.PSEUDONYMS;
		const targetRefId = '653e4833cc39e5907a1e18d2';
		const targetRef = DeletionTargetRefBuilder.build(targetRefDomain, targetRefId);
		const deletionPlannedAt = new Date();
		const modifiedCount = 0;
		const deletedCount = 2;
		const statistics = [DeletionLogStatisticBuilder.build(targetRefDomain, modifiedCount, deletedCount)];

		const result = DeletionRequestLogResponseBuilder.build(targetRef, deletionPlannedAt, statistics);

		// Assert
		expect(result.targetRef).toEqual(targetRef);
		expect(result.deletionPlannedAt).toEqual(deletionPlannedAt);
		expect(result.statistics).toEqual(statistics);
	});
});
