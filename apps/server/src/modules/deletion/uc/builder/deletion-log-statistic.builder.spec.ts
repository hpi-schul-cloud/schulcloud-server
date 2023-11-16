import { DeletionDomainModel } from '../../domain/types';
import { DeletionLogStatisticBuilder } from './index';

describe(DeletionLogStatisticBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should build generic deletionLogStatistic with all attributes', () => {
		// Arrange
		const domain = DeletionDomainModel.PSEUDONYMS;
		const modifiedCount = 0;
		const deletedCount = 2;

		const result = DeletionLogStatisticBuilder.build(domain, modifiedCount, deletedCount);

		// Assert
		expect(result.domain).toEqual(domain);
		expect(result.modifiedCount).toEqual(modifiedCount);
		expect(result.deletedCount).toEqual(deletedCount);
	});
});
