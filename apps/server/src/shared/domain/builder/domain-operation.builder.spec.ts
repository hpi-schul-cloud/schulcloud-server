import { DomainModel } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { DomainOperationBuilder } from '.';

describe(DomainOperationBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const domain = DomainModel.PSEUDONYMS;
		const modifiedCount = 0;
		const modifiedRef = [];
		const deletedRef = [new ObjectId().toHexString(), new ObjectId().toHexString()];
		const deletedCount = 2;

		return { domain, modifiedCount, deletedCount, modifiedRef, deletedRef };
	};

	it('should build generic domainOperation with all attributes', () => {
		const { domain, modifiedCount, deletedCount, modifiedRef, deletedRef } = setup();

		const result = DomainOperationBuilder.build(domain, modifiedCount, deletedCount, modifiedRef, deletedRef);

		expect(result.domain).toEqual(domain);
		expect(result.modifiedCount).toEqual(modifiedCount);
		expect(result.deletedCount).toEqual(deletedCount);
	});
});
