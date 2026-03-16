import { ErwinIdentifier } from '../../domain/do';
import { erwinIdentifierFactoryWithUser } from '../../domain/testing';
import { ErwinIdentifierEntity } from '../entity';
import { erwinIdentifierEntityFactoryWithUser } from '../entity/testing';
import { ErwinIdentifierMapper } from './erwin-identifier.mapper';

describe(ErwinIdentifierMapper.name, () => {
	const fixedDate = new Date('2023-01-01T00:00:00.000Z');

	beforeAll(() => {
		jest.useFakeTimers();
		jest.setSystemTime(fixedDate);
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	describe('mapToDo', () => {
		describe('when an erwinIdentifier entity is mapped to a domain object', () => {
			const setup = () => {
				const entity = erwinIdentifierEntityFactoryWithUser.build();

				const expectedDomainObject = new ErwinIdentifier({
					id: entity.id,
					erwinId: entity.erwinId,
					type: entity.type,
					referencedEntityId: entity.referencedEntityId,
				});

				return { entity, expectedDomainObject };
			};

			it('should properly map all properties from entity to domain object', () => {
				const { entity, expectedDomainObject } = setup();

				const domainObject = ErwinIdentifierMapper.mapToDo(entity);

				expect(domainObject).toEqual(expectedDomainObject);
				expect(domainObject).toBeInstanceOf(ErwinIdentifier);
			});
		});
	});

	describe('mapToEntity', () => {
		describe('when an erwinIdentifier domain object is mapped to an entity', () => {
			const setup = () => {
				const domainObject = erwinIdentifierFactoryWithUser.build();

				const expectedEntity = new ErwinIdentifierEntity({
					id: domainObject.id,
					erwinId: domainObject.erwinId,
					type: domainObject.type,
					referencedEntityId: domainObject.referencedEntityId,
				});

				return { domainObject, expectedEntity };
			};

			it('should properly map all properties from domain object to entity', () => {
				const { domainObject, expectedEntity } = setup();

				const entity = ErwinIdentifierMapper.mapToEntity(domainObject);

				expect(entity).toBeInstanceOf(ErwinIdentifierEntity);
				expect(entity).toEqual(expectedEntity);
			});
		});
	});

	describe('mapToDos', () => {
		describe('when an empty erwinIdentifier entities array is mapped to domain objects', () => {
			it('should return an empty domain objects array for an empty entities array', () => {
				const domainObjects = ErwinIdentifierMapper.mapToDos([]);

				expect(domainObjects).toEqual([]);
			});
		});

		describe('When multiple erwinIdentifier entities are mapped to domain objects', () => {
			const setup = () => {
				const entity1: ErwinIdentifierEntity = erwinIdentifierEntityFactoryWithUser.build();
				const entity2: ErwinIdentifierEntity = erwinIdentifierEntityFactoryWithUser.build();
				const entities: ErwinIdentifierEntity[] = [entity1, entity2];

				const expectedDomainObjects = entities.map(
					(entity) =>
						new ErwinIdentifier({
							id: entity.id,
							erwinId: entity.erwinId,
							type: entity.type,
							referencedEntityId: entity.referencedEntityId,
						})
				);

				return { entities, expectedDomainObjects };
			};

			it('should properly map all entities to domain objects', () => {
				const { entities, expectedDomainObjects } = setup();

				const domainObjects = ErwinIdentifierMapper.mapToDos(entities);

				expect(domainObjects).toEqual(expectedDomainObjects);
				expect(domainObjects[0]).toBeInstanceOf(ErwinIdentifier);
				expect(domainObjects[1]).toBeInstanceOf(ErwinIdentifier);
			});
		});
	});

	describe('mapToEntities', () => {
		describe('when an empty erwinIdentifier domain objects array is mapped to entities', () => {
			it('should return an empty entities array for an empty erwinIdentifier domain objects array', () => {
				const entities = ErwinIdentifierMapper.mapToEntities([]);

				expect(entities).toEqual([]);
			});
		});

		describe('when multiple erwinIdentifier domain objects are mapped to entities', () => {
			const setup = () => {
				const domainObject1: ErwinIdentifier = erwinIdentifierFactoryWithUser.build();
				const domainObject2: ErwinIdentifier = erwinIdentifierFactoryWithUser.build();
				const domainObjects: ErwinIdentifier[] = [domainObject1, domainObject2];

				const expectedEntities = domainObjects.map(
					(domainObject) =>
						new ErwinIdentifierEntity({
							id: domainObject.id,
							erwinId: domainObject.erwinId,
							type: domainObject.type,
							referencedEntityId: domainObject.referencedEntityId,
						})
				);

				return { domainObjects, expectedEntities };
			};

			it('should properly map all erwinIdentifier domain objects to entities', () => {
				const { domainObjects, expectedEntities } = setup();

				const entities = ErwinIdentifierMapper.mapToEntities(domainObjects);

				expect(entities).toEqual(expectedEntities);
				expect(entities[0]).toBeInstanceOf(ErwinIdentifierEntity);
				expect(entities[1]).toBeInstanceOf(ErwinIdentifierEntity);
			});
		});
	});
});
