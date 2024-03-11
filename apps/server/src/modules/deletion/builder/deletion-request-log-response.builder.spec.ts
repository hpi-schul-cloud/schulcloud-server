import { ObjectId } from 'bson';
import {
	DeletionLogStatisticBuilder,
	DeletionRequestLogResponseBuilder,
	DeletionTargetRefBuilder,
	DomainOperationReportBuilder,
} from '.';
import { DeletionStatusModel } from '../domain/types';
import { DomainName, OperationType } from '../types';

describe(DeletionRequestLogResponseBuilder, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});
	const setup = () => {
		const targetRefDomain = DomainName.PSEUDONYMS;
		const targetRefId = '653e4833cc39e5907a1e18d2';
		const targetRef = DeletionTargetRefBuilder.build(targetRefDomain, targetRefId);
		const deletionPlannedAt = new Date();
		const status = DeletionStatusModel.SUCCESS;
		const operations = [
			DomainOperationReportBuilder.build(OperationType.DELETE, 2, [
				new ObjectId().toHexString(),
				new ObjectId().toHexString(),
			]),
		];
		const statistics = [DeletionLogStatisticBuilder.build(targetRefDomain, operations)];

		return { deletionPlannedAt, statistics, status, targetRef };
	};

	it('should build generic deletionRequestLog with all attributes', () => {
		const { deletionPlannedAt, statistics, status, targetRef } = setup();

		const result = DeletionRequestLogResponseBuilder.build(targetRef, deletionPlannedAt, status, statistics);

		expect(result.targetRef).toEqual(targetRef);
		expect(result.deletionPlannedAt).toEqual(deletionPlannedAt);
		expect(result.status).toEqual(status);
		expect(result.statistics).toEqual(statistics);
	});
});
