import { ErwinIdentifier } from '../../domain/do';
import { ReferencedEntityType } from '../../types';
import { ErwinIdentifierEntity } from '../entity';
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

	describe('mapToDO', () => {
		describe('when an erwinIdentifier entity is mapped to a domain object', () => {
			const setup = () => {
				const entity = {
					id: 'erwin-id-entity-id',
					erwinId: 'ERWIN123',
					type: ReferencedEntityType.USER,
					referencedEntityId: 'referenced-entity-id',
				} as ErwinIdentifierEntity;

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

				const domainObject = ErwinIdentifierMapper.mapToDO(entity);

				expect(domainObject).toEqual(expectedDomainObject);
				expect(domainObject).toBeInstanceOf(ErwinIdentifier);
			});
		});
	});

	describe('mapToEntity', () => {
		describe('when an erwinIdentifier domain object is mapped to an entity', () => {
			const setup = () => {
				const domainObject = new ErwinIdentifier({
					id: 'erwin-id-domain-id',
					erwinId: 'ERWIN456',
					type: ReferencedEntityType.USER,
					referencedEntityId: 'referenced-entity-id-2',
				});

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

	describe('mapToDOs', () => {
		describe('when an empty erwinIdentifier entities array is mapped to domain objects', () => {
			it('should return an empty domain objects array for an empty entities array', () => {
				const domainObjects = ErwinIdentifierMapper.mapToDOs([]);

				expect(domainObjects).toEqual([]);
			});
		});

		describe('When multiple erwinIdentifier entities are mapped to domain objects', () => {
			const setup = () => {
				const entities: ErwinIdentifierEntity[] = [
					{
						id: 'erwin-id-entity-id-1',
						erwinId: 'ERWIN1',
						type: ReferencedEntityType.USER,
						referencedEntityId: 'ref-entity-1',
					} as ErwinIdentifierEntity,
					{
						id: 'erwin-id-entity-id-2',
						erwinId: 'ERWIN2',
						type: ReferencedEntityType.USER,
						referencedEntityId: 'ref-entity-2',
					} as ErwinIdentifierEntity,
				];

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

				const domainObjects = ErwinIdentifierMapper.mapToDOs(entities);

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
				const domainObjects = [
					new ErwinIdentifier({
						id: 'erwin-id-domain-id-1',
						erwinId: 'ERWIN1',
						type: ReferencedEntityType.USER,
						referencedEntityId: 'ref-entity-1',
					}),
					new ErwinIdentifier({
						id: 'erwin-id-domain-id-2',
						erwinId: 'ERWIN2',
						type: ReferencedEntityType.USER,
						referencedEntityId: 'ref-entity-2',
					}),
				];

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
