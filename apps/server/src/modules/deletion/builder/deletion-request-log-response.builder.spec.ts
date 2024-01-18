import { DomainModel, OperationModel } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { DeletionLogStatisticBuilder, DeletionRequestLogResponseBuilder, DeletionTargetRefBuilder } from '.';
import { DeletionStatusModel } from '../domain/types';

describe(DeletionRequestLogResponseBuilder, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should build generic deletionRequestLog with all attributes', () => {
		// Arrange
		const targetRefDomain = DomainModel.PSEUDONYMS;
		const targetRefId = '653e4833cc39e5907a1e18d2';
		const targetRef = DeletionTargetRefBuilder.build(targetRefDomain, targetRefId);
		const deletionPlannedAt = new Date();
		const status = DeletionStatusModel.SUCCESS;
		const operation = OperationModel.DELETE;
		const count = 2;
		const refs = [new ObjectId().toHexString(), new ObjectId().toHexString()];
		const statistics = [DeletionLogStatisticBuilder.build(targetRefDomain, operation, count, refs)];

		const result = DeletionRequestLogResponseBuilder.build(targetRef, deletionPlannedAt, status, statistics);

		// Assert
		expect(result.targetRef).toEqual(targetRef);
		expect(result.deletionPlannedAt).toEqual(deletionPlannedAt);
		expect(result.status).toEqual(status);
		expect(result.statistics).toEqual(statistics);
	});
});
