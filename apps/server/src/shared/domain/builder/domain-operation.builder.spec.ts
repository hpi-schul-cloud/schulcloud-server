import { DomainName, OperationType } from '@shared/domain/types';
import { ObjectId } from '@mikro-orm/mongodb';
import { DomainOperationBuilder } from '.';

describe(DomainOperationBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const domain = DomainName.PSEUDONYMS;
		const operation = OperationType.DELETE;
		const refs = [new ObjectId().toHexString(), new ObjectId().toHexString()];
		const count = 2;

		return { domain, count, operation, refs };
	};

	it('should build generic domainOperation with all attributes', () => {
		const { domain, count, operation, refs } = setup();

		const result = DomainOperationBuilder.build(domain, operation, count, refs);

		expect(result.domain).toEqual(domain);
		expect(result.operation).toEqual(operation);
		expect(result.count).toEqual(count);
		expect(result.refs).toEqual(refs);
	});
});
