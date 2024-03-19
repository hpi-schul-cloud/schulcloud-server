import { Synchronization } from '../../domain';
import { synchronizationFactory } from '../../domain/testing';
import { SynchronizationEntity } from '../../entity';
import { synchronizationEntityFactory } from '../../entity/testing';
import { SynchronizationMapper } from './synchronization.mapper';

describe(SynchronizationMapper.name, () => {
	describe('mapToDO', () => {
		describe('When entity is mapped for domainObject', () => {
			const setup = () => {
				const entity = synchronizationEntityFactory.build();

				const expectedDomainObject = new Synchronization({
					id: entity.id,
					count: entity.count,
					failureCause: entity?.failureCause,
					status: entity?.status,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				});

				return { entity, expectedDomainObject };
			};
			it('should properly map the entity to the domain object', () => {
				const { entity, expectedDomainObject } = setup();

				const domainObject = SynchronizationMapper.mapToDO(entity);

				expect(domainObject).toEqual(expectedDomainObject);
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
				const domainObject = synchronizationFactory.build();

				const expectedEntities = new SynchronizationEntity({
					id: domainObject.id,
					count: domainObject.count,
					failureCause: domainObject?.failureCause,
					status: domainObject?.status,
					createdAt: domainObject.createdAt,
					updatedAt: domainObject.updatedAt,
				});

				return { domainObject, expectedEntities };
			};

			it('should properly map the domainObject to the entity', () => {
				const { domainObject, expectedEntities } = setup();

				const entities = SynchronizationMapper.mapToEntity(domainObject);

				expect(entities).toEqual(expectedEntities);
			});
		});
	});
});
