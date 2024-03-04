import { ObjectId } from '@mikro-orm/mongodb';
import { DomainName, OperationType } from '@shared/domain/types';
import { deletionLogFactory } from './testing/factory/deletion-log.factory';
import { DeletionLog } from './deletion-log.do';
import { DomainOperationReportProps } from '../entity';

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
					domainOperationReport: [
						new DomainOperationReportProps({
							operation: OperationType.DELETE,
							count: 1,
							refs: [new ObjectId().toHexString()],
						}),
					],
					domainDeletionReport: new DeletionLog({
						id: new ObjectId().toHexString(),
						domain: DomainName.REGISTRATIONPIN,
						domainOperationReport: [
							new DomainOperationReportProps({
								operation: OperationType.DELETE,
								count: 2,
								refs: [new ObjectId().toHexString(), new ObjectId().toHexString()],
							}),
						],
						deletionRequestId,
						createdAt: new Date(),
						updatedAt: new Date(),
					}),
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
					domainOperationReport: deletionLogDo.domainOperationReport,
					domainDeletionReport: deletionLogDo.domainDeletionReport,
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
