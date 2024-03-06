import { DomainName, OperationType } from '@shared/domain/types';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionLogStatisticBuilder } from '.';

describe(DeletionLogStatisticBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});
	const setup = () => {
		const domain = DomainName.PSEUDONYMS;
		const operation = OperationType.DELETE;
		const count = 2;
		const refs = [new ObjectId().toHexString(), new ObjectId().toHexString()];

		return { domain, operation, count, refs };
	};

	it('should build generic deletionLogStatistic with all attributes', () => {
		const { domain, operation, count, refs } = setup();

		const result = DeletionLogStatisticBuilder.build(domain, operation, count, refs);

		expect(result.domain).toEqual(domain);
		expect(result.operation).toEqual(operation);
		expect(result.count).toEqual(count);
		expect(result.refs).toEqual(refs);
	});
});
