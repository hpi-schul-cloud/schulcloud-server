import { ObjectId } from '@mikro-orm/mongodb';
import { deletionLogFactory } from './testing/factory/deletion-log.factory';
import { DeletionLog } from './deletion-log.do';
import { DomainOperationReportBuilder, DomainDeletionReportBuilder } from '../builder';
import { DomainName, OperationType } from '../types';

describe(DeletionLog.name, () => {
	describe('constructor', () => {
		describe('When constructor is called', () => {
			it('should create a deletionRequest by passing required properties', () => {
				const domainObject: DeletionLog = deletionLogFactory.build();

				expect(domainObject instanceof DeletionLog).toEqual(true);
			});
		});

		describe('when passed a valid id', () => {
			const setup = () => {
				const domainObject: DeletionLog = deletionLogFactory.buildWithId();

				return { domainObject };
			};

			it('should set the id', () => {
				const { domainObject } = setup();

				const deletionLogDomainObject: DeletionLog = new DeletionLog(domainObject);

				expect(deletionLogDomainObject.id).toEqual(domainObject.id);
			});
		});
	});

	describe('getters', () => {
		describe('When getters are used', () => {
			const setup = () => {
				const deletionRequestId = new ObjectId().toHexString();
				const props = {
					id: new ObjectId().toHexString(),
					domain: DomainName.USER,
					operations: [DomainOperationReportBuilder.build(OperationType.DELETE, 1, [new ObjectId().toHexString()])],
					subdomainOperations: [
						DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
							DomainOperationReportBuilder.build(OperationType.DELETE, 2, [
								new ObjectId().toHexString(),
								new ObjectId().toHexString(),
							]),
						]),
					],
					deletionRequestId,
					performedAt: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				const deletionLogDo = new DeletionLog(props);

				return { props, deletionLogDo };
			};
			it('getters should return proper values', () => {
				const { props, deletionLogDo } = setup();

				const gettersValues = {
					id: deletionLogDo.id,
					domain: deletionLogDo.domain,
					operations: deletionLogDo.operations,
					subdomainOperations: deletionLogDo.subdomainOperations,
					deletionRequestId: deletionLogDo.deletionRequestId,
					performedAt: deletionLogDo.performedAt,
					createdAt: deletionLogDo.createdAt,
					updatedAt: deletionLogDo.updatedAt,
				};

				expect(gettersValues).toEqual(props);
			});
		});
	});
});
