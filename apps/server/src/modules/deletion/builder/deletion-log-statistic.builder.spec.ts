import { DomainModel, OperationModel } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { DeletionLogStatisticBuilder } from '.';

describe(DeletionLogStatisticBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should build generic deletionLogStatistic with all attributes', () => {
		// Arrange
		const domain = DomainModel.PSEUDONYMS;
		const operation = OperationModel.DELETE;
		const count = 2;
		const refs = [new ObjectId().toHexString(), new ObjectId().toHexString()];

		const result = DeletionLogStatisticBuilder.build(domain, operation, count, refs);

		// Assert
		expect(result.domain).toEqual(domain);
		expect(result.operation).toEqual(operation);
		expect(result.count).toEqual(count);
		expect(result.refs).toEqual(refs);
	});
});
