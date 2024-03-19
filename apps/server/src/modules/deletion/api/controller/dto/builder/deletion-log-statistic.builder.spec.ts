import { ObjectId } from 'bson';
import { DomainName, OperationType } from '../../../../domain/types';
import { DomainOperationReportBuilder } from '../../../../domain/builder';
import { DeletionLogStatisticBuilder } from '.';

describe(DeletionLogStatisticBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});
	const setup = () => {
		const domain = DomainName.PSEUDONYMS;
		const operations = [
			DomainOperationReportBuilder.build(OperationType.DELETE, 2, [
				new ObjectId().toHexString(),
				new ObjectId().toHexString(),
			]),
		];

		return { domain, operations };
	};

	it('should build generic deletionLogStatistic with all attributes', () => {
		const { domain, operations } = setup();

		const result = DeletionLogStatisticBuilder.build(domain, operations);

		expect(result.domain).toEqual(domain);
		expect(result.operations).toEqual(operations);
	});
});
