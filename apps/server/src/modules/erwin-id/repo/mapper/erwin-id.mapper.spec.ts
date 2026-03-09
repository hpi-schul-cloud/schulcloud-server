import { ErwinId } from '../../domain/do';
import { ErwinIdReferencedEntityType } from '../../types';
import { ErwinIdEntity } from '../entity';
import { ErwinIdMapper } from './erwin-id.mapper';

describe(ErwinIdMapper.name, () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('mapToDO', () => {
		describe('When an erwinId entity is mapped to a domain object', () => {
			const setup = () => {
				const entity = {
					id: 'erwin-id-entity-id',
					erwinId: 'ERWIN123',
					type: ErwinIdReferencedEntityType.USER,
					erwinIdReferencedEntityId: 'referenced-entity-id',
				} as ErwinIdEntity;

				const expectedDomainObject = new ErwinId({
					id: entity.id,
					erwinId: entity.erwinId,
					type: entity.type,
					erwinIdReferencedEntityId: entity.erwinIdReferencedEntityId,
				});

				return { entity, expectedDomainObject };
			};

			it('should properly map all properties from entity to domain object', () => {
				const { entity, expectedDomainObject } = setup();

				const domainObject = ErwinIdMapper.mapToDO(entity);

				expect(domainObject).toEqual(expectedDomainObject);
			});
		});
	});

	describe('mapToEntity', () => {
		describe('When an erwinId domain object is mapped to an entity', () => {
			const setup = () => {
				const domainObject = new ErwinId({
					id: 'erwin-id-domain-id',
					erwinId: 'ERWIN456',
					type: ErwinIdReferencedEntityType.USER,
					erwinIdReferencedEntityId: 'referenced-entity-id-2',
				});

				const expectedEntity = new ErwinIdEntity({
					id: domainObject.id,
					erwinId: domainObject.erwinId,
					type: domainObject.type,
					erwinIdReferencedEntityId: domainObject.erwinIdReferencedEntityId,
				});

				return { domainObject, expectedEntity };
			};

			it('should properly map all properties from domain object to entity', () => {
				const { domainObject, expectedEntity } = setup();

				const entity = ErwinIdMapper.mapToEntity(domainObject);

				expect(entity).toBeInstanceOf(ErwinIdEntity);
				expect(entity).toEqual(expectedEntity);
			});
		});
	});

	describe('mapToDOs', () => {
		describe('When an empty erwinId entities array is mapped to domain objects', () => {
			it('should return an empty domain objects array for an empty entities array', () => {
				const domainObjects = ErwinIdMapper.mapToDOs([]);

				expect(domainObjects).toEqual([]);
			});
		});

		describe('When multiple erwinId entities are mapped to domain objects', () => {
			const setup = () => {
				const entities: ErwinIdEntity[] = [
					{
						id: 'erwin-id-entity-id-1',
						erwinId: 'ERWIN1',
						type: ErwinIdReferencedEntityType.USER,
						erwinIdReferencedEntityId: 'ref-entity-1',
					} as ErwinIdEntity,
					{
						id: 'erwin-id-entity-id-2',
						erwinId: 'ERWIN2',
						type: ErwinIdReferencedEntityType.USER,
						erwinIdReferencedEntityId: 'ref-entity-2',
					} as ErwinIdEntity,
				];

				const expectedDomainObjects = entities.map(
					(entity) =>
						new ErwinId({
							id: entity.id,
							erwinId: entity.erwinId,
							type: entity.type,
							erwinIdReferencedEntityId: entity.erwinIdReferencedEntityId,
						})
				);

				return { entities, expectedDomainObjects };
			};

			it('should properly map all entities to domain objects', () => {
				const { entities, expectedDomainObjects } = setup();

				const domainObjects = ErwinIdMapper.mapToDOs(entities);

				expect(domainObjects).toEqual(expectedDomainObjects);
			});
		});
	});

	describe('mapToEntities', () => {
		describe('When an empty erwinId domain objects array is mapped to entities', () => {
			it('should return an empty entities array for an empty erwinId domain objects array', () => {
				const entities = ErwinIdMapper.mapToEntities([]);

				expect(entities).toEqual([]);
			});
		});

		describe('When multiple erwinId domain objects are mapped to entities', () => {
			const setup = () => {
				const domainObjects = [
					new ErwinId({
						id: 'erwin-id-domain-id-1',
						erwinId: 'ERWIN1',
						type: ErwinIdReferencedEntityType.USER,
						erwinIdReferencedEntityId: 'ref-entity-1',
					}),
					new ErwinId({
						id: 'erwin-id-domain-id-2',
						erwinId: 'ERWIN2',
						type: ErwinIdReferencedEntityType.USER,
						erwinIdReferencedEntityId: 'ref-entity-2',
					}),
				];

				const expectedEntities = domainObjects.map(
					(domainObject) =>
						new ErwinIdEntity({
							id: domainObject.id,
							erwinId: domainObject.erwinId,
							type: domainObject.type,
							erwinIdReferencedEntityId: domainObject.erwinIdReferencedEntityId,
						})
				);

				return { domainObjects, expectedEntities };
			};

			it('should properly map all erwinId domain objects to entities', () => {
				const { domainObjects, expectedEntities } = setup();

				const entities = ErwinIdMapper.mapToEntities(domainObjects);

				expect(entities).toHaveLength(expectedEntities.length);
				expect(entities).toEqual(expectedEntities);
			});
		});
	});
});
