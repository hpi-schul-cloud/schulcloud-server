import { ObjectId } from '@mikro-orm/mongodb';
import { deletionLogEntityFactory } from '../../entity/testing/factory/deletion-log.entity.factory';
import { DeletionLogMapper } from './deletion-log.mapper';
import { DeletionLog } from '../../domain/deletion-log.do';
import { deletionLogFactory } from '../../domain/testing/factory/deletion-log.factory';
import { DeletionLogEntity } from '../../entity';

describe(DeletionLogMapper.name, () => {
	describe('mapToDO', () => {
		describe('When entity is mapped for domainObject', () => {
			const setup = () => {
				const entity = deletionLogEntityFactory.build();

				const expectedDomainObject = new DeletionLog({
					id: entity.id,
					domain: entity.domain,
					operation: entity.operation,
					deletionRequestId: entity.deletionRequestId?.toHexString(),
					performedAt: entity.performedAt,
					modifiedCount: entity.modifiedCount,
					deletedCount: entity.deletedCount,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				});

				return { entity, expectedDomainObject };
			};
			it('should properly map the entity to the domain object', () => {
				const { entity, expectedDomainObject } = setup();

				const domainObject = DeletionLogMapper.mapToDO(entity);

				expect(domainObject).toEqual(expectedDomainObject);
			});
		});
	});

	describe('mapToDOs', () => {
		describe('When empty entities array is mapped for an empty domainObjects array', () => {
			it('should return empty domain objects array for an empty entities array', () => {
				const domainObjects = DeletionLogMapper.mapToDOs([]);

				expect(domainObjects).toEqual([]);
			});
		});

		describe('When entities array is mapped for domainObjects array', () => {
			const setup = () => {
				const entities = [deletionLogEntityFactory.build()];

				const expectedDomainObjects = entities.map(
					(entity) =>
						new DeletionLog({
							id: entity.id,
							domain: entity.domain,
							operation: entity.operation,
							deletionRequestId: entity.deletionRequestId?.toHexString(),
							performedAt: entity.performedAt,
							modifiedCount: entity.modifiedCount,
							deletedCount: entity.deletedCount,
							createdAt: entity.createdAt,
							updatedAt: entity.updatedAt,
						})
				);

				return { entities, expectedDomainObjects };
			};
			it('should properly map the entities to the domain objects', () => {
				const { entities, expectedDomainObjects } = setup();

				const domainObjects = DeletionLogMapper.mapToDOs(entities);

				expect(domainObjects).toEqual(expectedDomainObjects);
			});
		});
	});

	describe('mapToEntity', () => {
		describe('When domainObject is mapped for entity', () => {
			beforeAll(() => {
				jest.useFakeTimers();
				jest.setSystemTime(new Date());
			});

			afterAll(() => {
				jest.useRealTimers();
			});

			const setup = () => {
				const domainObject = deletionLogFactory.build();

				const expectedEntities = new DeletionLogEntity({
					id: domainObject.id,
					domain: domainObject.domain,
					operation: domainObject.operation,
					deletionRequestId: new ObjectId(domainObject.deletionRequestId),
					performedAt: domainObject.performedAt,
					modifiedCount: domainObject.modifiedCount,
					deletedCount: domainObject.deletedCount,
					createdAt: domainObject.createdAt,
					updatedAt: domainObject.updatedAt,
				});

				return { domainObject, expectedEntities };
			};

			it('should properly map the domainObject to the entity', () => {
				const { domainObject, expectedEntities } = setup();

				const entities = DeletionLogMapper.mapToEntity(domainObject);

				expect(entities).toEqual(expectedEntities);
			});
		});
	});

	describe('mapToEntities', () => {
		describe('When empty domainObjects array is mapped for an entities array', () => {
			it('should return empty entities array for an empty domain objects array', () => {
				const entities = DeletionLogMapper.mapToEntities([]);

				expect(entities).toEqual([]);
			});
		});

		describe('When domainObjects array is mapped for entities array', () => {
			beforeAll(() => {
				jest.useFakeTimers();
				jest.setSystemTime(new Date());
			});

			afterAll(() => {
				jest.useRealTimers();
			});

			const setup = () => {
				const domainObjects = [deletionLogFactory.build()];

				const expectedEntities = domainObjects.map(
					(domainObject) =>
						new DeletionLogEntity({
							id: domainObject.id,
							domain: domainObject.domain,
							operation: domainObject.operation,
							deletionRequestId: new ObjectId(domainObject.deletionRequestId),
							performedAt: domainObject.performedAt,
							modifiedCount: domainObject.modifiedCount,
							deletedCount: domainObject.deletedCount,
							createdAt: domainObject.createdAt,
							updatedAt: domainObject.updatedAt,
						})
				);

				return { domainObjects, expectedEntities };
			};

			it('should properly map the domainObjects to the entities', () => {
				const { domainObjects, expectedEntities } = setup();

				const entities = DeletionLogMapper.mapToEntities(domainObjects);

				expect(entities).toEqual(expectedEntities);
			});
		});
	});
});
