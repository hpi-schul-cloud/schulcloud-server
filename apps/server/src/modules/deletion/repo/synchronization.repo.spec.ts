import { EntityManager } from '@mikro-orm/mongodb';
import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { cleanupCollections } from '@shared/testing';
import { SynchronizationMapper } from './mapper';
import { SynchronizationEntity } from '../entity';
import { SynchronizationRepo } from './synchronization.repo';
import { Synchronization } from '../domain';
import { synchronizationFactory } from '../domain/testing';
import { synchronizationEntityFactory } from '../entity/testing';

describe(SynchronizationRepo.name, () => {
	let module: TestingModule;
	let repo: SynchronizationRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [SynchronizationEntity],
				}),
			],
			providers: [SynchronizationRepo, SynchronizationMapper],
		}).compile();

		repo = module.get(SynchronizationRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(SynchronizationEntity);
		});
	});

	describe('create synchronization', () => {
		describe('when synchronization is new', () => {
			const setup = () => {
				const domainObject: Synchronization = synchronizationFactory.build();
				const synchronizationId = domainObject.id;

				const expectedDomainObject = {
					id: domainObject.id,
					count: domainObject.count,
					failure: domainObject.failure,
					createdAt: domainObject.createdAt,
					updatedAt: domainObject.updatedAt,
				};

				return { domainObject, synchronizationId, expectedDomainObject };
			};
			it('should create a new deletionLog', async () => {
				const { domainObject, synchronizationId, expectedDomainObject } = setup();
				await repo.create(domainObject);

				const result = await repo.findById(synchronizationId);

				expect(result).toEqual(expect.objectContaining(expectedDomainObject));
			});
		});
	});

	describe('findById', () => {
		describe('when searching by Id', () => {
			const setup = async () => {
				// Test synchronization entity
				const entity: SynchronizationEntity = synchronizationEntityFactory.build();
				await em.persistAndFlush(entity);

				const expectedSynchronization = {
					id: entity.id,
					count: entity.count,
					failure: entity.failure,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				};

				return {
					entity,
					expectedSynchronization,
				};
			};

			it('should find the synchronization', async () => {
				const { entity, expectedSynchronization } = await setup();

				const result: Synchronization = await repo.findById(entity.id);

				// Verify explicit fields.
				expect(result).toEqual(expect.objectContaining(expectedSynchronization));
			});
		});
	});
});
