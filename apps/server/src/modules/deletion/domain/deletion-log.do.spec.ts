import { ObjectId } from '@mikro-orm/mongodb';
import { DomainModel } from '@shared/domain/types';
import { deletionLogFactory } from './testing/factory/deletion-log.factory';
import { DeletionLog } from './deletion-log.do';
import { DeletionOperationModel } from './types';

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
				const props = {
					id: new ObjectId().toHexString(),
					domain: DomainModel.USER,
					operation: DeletionOperationModel.DELETE,
					modifiedCount: 0,
					deletedCount: 1,
					deletionRequestId: new ObjectId().toHexString(),
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
					operation: deletionLogDo.operation,
					modifiedCount: deletionLogDo.modifiedCount,
					deletedCount: deletionLogDo.deletedCount,
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
