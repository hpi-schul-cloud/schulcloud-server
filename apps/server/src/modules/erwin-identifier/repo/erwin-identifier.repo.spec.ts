import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ErwinIdentifier, ErwinIdentifierProps } from '../domain/do';
import { erwinIdentifierFactoryWithSchool } from '../domain/testing';
import { ErwinIdentifierEntity } from './entity';
import { erwinIdentifierEntityFactoryWithSchool } from './entity/testing';
import { ErwinIdentifierMikroOrmRepo } from './erwin-identifier.repo';

describe(ErwinIdentifierMikroOrmRepo.name, () => {
	let module: TestingModule;
	let repo: ErwinIdentifierMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [ErwinIdentifierEntity],
				}),
			],
			providers: [ErwinIdentifierMikroOrmRepo],
		}).compile();

		repo = module.get(ErwinIdentifierMikroOrmRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('defined', () => {
		it('should expose ErwinIdentifierEntity as entityName', () => {
			expect(repo.entityName).toBe(ErwinIdentifierEntity);
		});
	});

	describe('create', () => {
		describe('when an erwin identifier domain object is new', () => {
			const setup = () => {
				const domainObject: ErwinIdentifier = erwinIdentifierFactoryWithSchool.build();

				const expectedDoProps: ErwinIdentifierProps = {
					id: domainObject.id,
					erwinId: domainObject.erwinId,
					type: domainObject.type,
					referencedEntityId: domainObject.referencedEntityId,
				};

				return {
					domainObject,
					expectedDoProps,
				};
			};

			it('should create a new erwin identifier entity', async () => {
				const { domainObject, expectedDoProps } = setup();
				await repo.create(domainObject);

				const result = await repo.findById(domainObject.id);

				if (!result) {
					fail('Expected to find an erwin identifier with the given id, but none was found.');
				}

				const resultProps = result.getProps();

				expect(resultProps).toStrictEqual(expectedDoProps);
			});
		});
	});

	describe('findById', () => {
		describe('when an erwin identifier entity exists with the given id', () => {
			const setup = async () => {
				const entity: ErwinIdentifierEntity = erwinIdentifierEntityFactoryWithSchool.build();
				await em.persist(entity).flush();

				const expectedDoProps: ErwinIdentifierProps = {
					id: entity.id,
					erwinId: entity.erwinId,
					type: entity.type,
					referencedEntityId: entity.referencedEntityId,
				};

				return { entity, expectedDoProps };
			};

			it('should return the erwin identifier entity with the given id', async () => {
				const { entity, expectedDoProps } = await setup();

				const result = await repo.findById(entity.id);

				if (!result) {
					fail('Expected to find an erwin identifier with the given id, but none was found.');
				}

				const resultProps = result.getProps();

				expect(resultProps).toStrictEqual(expectedDoProps);
			});
		});

		describe('when no erwin identifier entity exists with the given id', () => {
			it('should return null', async () => {
				const nonExistingId = 'non-existing-id';

				const result = await repo.findById(nonExistingId);

				expect(result).toBeNull();
			});
		});
	});

	describe('findByErwinId', () => {
		describe('when an erwin identifier entity exists with the given erwin id', () => {
			const setup = async () => {
				const entity: ErwinIdentifierEntity = erwinIdentifierEntityFactoryWithSchool.build();
				await em.persist(entity).flush();

				const expectedDoProps: ErwinIdentifierProps = {
					id: entity.id,
					erwinId: entity.erwinId,
					type: entity.type,
					referencedEntityId: entity.referencedEntityId,
				};

				return { entity, expectedDoProps };
			};

			it('should return the erwin identifier with the given erwin id', async () => {
				const { entity, expectedDoProps } = await setup();

				const result = await repo.findByErwinId(entity.erwinId);
				const resultProps = result?.getProps();

				expect(resultProps).toStrictEqual(expectedDoProps);
			});
		});

		describe('when no erwin identifier entity exists with the given erwin id', () => {
			it('should return null', async () => {
				const nonExistingErwinId = 'non-existing-erwin-id';

				const result = await repo.findByErwinId(nonExistingErwinId);

				expect(result).toBeNull();
			});
		});
	});

	describe('findByReferencedEntityId', () => {
		describe('when an erwin identifier entity exists with the given referenced entity id', () => {
			const setup = async () => {
				const entity: ErwinIdentifierEntity = erwinIdentifierEntityFactoryWithSchool.build();
				await em.persist(entity).flush();

				const expectedDoProps: ErwinIdentifierProps = {
					id: entity.id,
					erwinId: entity.erwinId,
					type: entity.type,
					referencedEntityId: entity.referencedEntityId,
				};

				return { entity, expectedDoProps };
			};

			it('should return the erwin identifier with the given referenced entity id', async () => {
				const { entity, expectedDoProps } = await setup();

				const result = await repo.findByReferencedEntityId(entity.referencedEntityId);
				const resultProps = result?.getProps();

				expect(resultProps).toStrictEqual(expectedDoProps);
			});
		});

		describe('when no erwin identifier entity exists with the given referenced entity id', () => {
			it('should return null', async () => {
				const nonExistingReferencedEntityId = new ObjectId().toHexString();

				const result = await repo.findByReferencedEntityId(nonExistingReferencedEntityId);

				expect(result).toBeNull();
			});
		});
	});

	describe('deleteById', () => {
		describe('when an erwin identifier entity exists with the given id', () => {
			const setup = async () => {
				const entity: ErwinIdentifierEntity = erwinIdentifierEntityFactoryWithSchool.build();
				await em.persist(entity).flush();

				return { entity };
			};

			it('should delete the erwin identifier entity with the given id', async () => {
				const { entity } = await setup();

				await repo.deleteById(entity.id);

				const found = await em.findOne(ErwinIdentifierEntity, { id: entity.id });

				expect(found).toBeNull();
			});
		});

		describe('when no erwin identifier entity exists with the given id', () => {
			it('should throw', async () => {
				const nonExistingId = new ObjectId().toHexString();

				const result = repo.deleteById(nonExistingId);

				await expect(result).rejects.toThrow();
			});
		});
	});
});
