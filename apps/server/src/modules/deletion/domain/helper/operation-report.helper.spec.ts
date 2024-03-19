import { ObjectId } from 'bson';
import { DomainName, OperationType } from '../types';
import { OperationReportHelper } from '.';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '../builder';

describe(OperationReportHelper.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const userRegistrationPinId = new ObjectId().toHexString();
		const parentRegistrationPinId = new ObjectId().toHexString();

		const domainReport1 = DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
			DomainOperationReportBuilder.build(OperationType.DELETE, 1, [userRegistrationPinId]),
		]);
		const domainReport2 = DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
			DomainOperationReportBuilder.build(OperationType.DELETE, 1, [parentRegistrationPinId]),
		]);

		const expectedResult = DomainOperationReportBuilder.build(OperationType.DELETE, 2, [
			userRegistrationPinId,
			parentRegistrationPinId,
		]);

		return {
			domainReport1,
			domainReport2,
			expectedResult,
		};
	};

	it('should transform domainDeletionReports into one domainDeletionReport with proper values', () => {
		const { domainReport1, domainReport2, expectedResult } = setup();

		const result = OperationReportHelper.extractOperationReports([domainReport1, domainReport2]);

		expect(result).toEqual([expectedResult]);
	});
});
