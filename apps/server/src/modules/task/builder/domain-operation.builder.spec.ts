import { DomainModel } from '@shared/domain/types';
import { DomainOperationBuilder } from './domain-operation.builder';

describe(DomainOperationBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should build generic domainOperation with all attributes', () => {
		// Arrange
		const domain = DomainModel.PSEUDONYMS;
		const modifiedCount = 0;
		const deletedCount = 2;

		const result = DomainOperationBuilder.build(domain, modifiedCount, deletedCount);

		// Assert
		expect(result.domain).toEqual(domain);
		expect(result.modifiedCount).toEqual(modifiedCount);
		expect(result.deletedCount).toEqual(deletedCount);
	});
});
