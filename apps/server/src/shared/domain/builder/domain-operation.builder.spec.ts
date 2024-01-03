import { DomainModel } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { DomainOperationBuilder } from '.';

describe(DomainOperationBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should build generic domainOperation with all attributes', () => {
		// Arrange
		const domain = DomainModel.PSEUDONYMS;
		const modifiedCount = 0;
		const modifiedRef = [];
		const deletedRef = [new ObjectId().toHexString(), new ObjectId().toHexString()];
		const deletedCount = 2;

		const result = DomainOperationBuilder.build(domain, modifiedCount, deletedCount, modifiedRef, deletedRef);

		// Assert
		expect(result.domain).toEqual(domain);
		expect(result.modifiedCount).toEqual(modifiedCount);
		expect(result.deletedCount).toEqual(deletedCount);
	});
});
