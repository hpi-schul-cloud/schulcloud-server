import { ObjectId } from 'bson';
import { OperationType } from '../types';
import { DomainOperationReportBuilder } from './domain-operation-report.builder';

describe(DomainOperationReportBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const operation = OperationType.DELETE;
		const refs = [new ObjectId().toHexString(), new ObjectId().toHexString()];
		const count = 2;

		return { count, operation, refs };
	};

	it('should build generic domainOperationReport with all attributes', () => {
		const { count, operation, refs } = setup();

		const result = DomainOperationReportBuilder.build(operation, count, refs);

		expect(result.operation).toEqual(operation);
		expect(result.count).toEqual(count);
		expect(result.refs).toEqual(refs);
	});
});
