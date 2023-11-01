import { setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionLogEntity } from './deletion-log.entity';
import { DeletionOperationModel } from '../domain/types/deletion-operation-model.enum';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';

describe(DeletionLogEntity.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('When constructor is called', () => {
			const setup = () => {
				const props = {
					id: new ObjectId().toHexString(),
					domain: DeletionDomainModel.USER,
					operation: DeletionOperationModel.DELETE,
					modifiedCount: 0,
					deletedCount: 1,
					deletionRequestId: new ObjectId(),
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				return { props };
			};
			it('should throw an error by empty constructor', () => {
				// @ts-expect-error: Test case
				const test = () => new DeletionLogEntity();
				expect(test).toThrow();
			});

			it('should create a deletionLog by passing required properties', () => {
				const { props } = setup();
				const entity: DeletionLogEntity = new DeletionLogEntity(props);

				expect(entity instanceof DeletionLogEntity).toEqual(true);
			});

			it(`should return a valid object with fields values set from the provided complete props object`, () => {
				const { props } = setup();
				const entity: DeletionLogEntity = new DeletionLogEntity(props);

				const entityProps = {
					id: entity.id,
					domain: entity.domain,
					operation: entity.operation,
					modifiedCount: entity.modifiedCount,
					deletedCount: entity.deletedCount,
					deletionRequestId: entity.deletionRequestId,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				};

				expect(entityProps).toEqual(props);
			});
		});
	});
});
