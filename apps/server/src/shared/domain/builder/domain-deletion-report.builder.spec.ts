import { ObjectId } from 'bson';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '.';
import { DomainName, OperationType } from '../types';

describe(DomainDeletionReportBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const domain = DomainName.ACCOUNT;
		const operation = OperationType.DELETE;
		const refs = [new ObjectId().toHexString(), new ObjectId().toHexString()];
		const count = 2;

		const operationReport = DomainOperationReportBuilder.build(operation, count, refs);

		return { domain, operationReport };
	};

	it('should build generic domainDeletionReport with all attributes', () => {
		const { domain, operationReport } = setup();

		const result = DomainDeletionReportBuilder.build(domain, [operationReport]);

		expect(result.domain).toEqual(domain);
		expect(result.operations).toEqual([operationReport]);
	});
});
