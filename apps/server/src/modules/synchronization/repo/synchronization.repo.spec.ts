import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test } from '@nestjs/testing';
import { type TestingModule } from '@nestjs/testing/testing-module';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { type Synchronization } from '../domain';
import { synchronizationFactory } from '../domain/testing';
import { SynchronizationStatusModel } from '../domain/types';
import { SynchronizationEntity } from './entity';
import { synchronizationEntityFactory } from './entity/testing';
import { SynchronizationMapper } from './mapper';
import { SynchronizationRepo } from './synchronization.repo';

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
					failureCause: domainObject.failureCause,
					status: domainObject.status,
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
				await em.persist(entity).flush();

				const expectedSynchronization = {
					id: entity.id,
					count: entity.count,
					failureCause: entity.failureCause,
					status: entity.status,
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

				expect(result).toEqual(expect.objectContaining(expectedSynchronization));
			});
		});
	});

	describe('update', () => {
		it.each([
			[false, false],
			[false, true],
			[true, false],
			[true, true],
		])(
			'should persist scalar changes with an unloaded reference=%s and clearing all fields=%s',
			async (unloaded, clearAll) => {
				const entity = synchronizationEntityFactory.build({
					systemId: new ObjectId().toHexString(),
					count: 7,
					failureCause: 'previous failure',
					status: SynchronizationStatusModel.REGISTERED,
				});
				await em.persist(entity).flush();
				const { _id, id, systemId, createdAt } = entity;
				if (unloaded) {
					em.clear();
				}
				const count = clearAll ? undefined : 0;
				const status = clearAll ? undefined : SynchronizationStatusModel.SUCCESS;
				const update = synchronizationFactory.build({
					id,
					count,
					failureCause: undefined,
					status,
				});

				await repo.update(update);

				const stored = await em.getCollection(SynchronizationEntity).findOne({ _id });
				expect(stored).toMatchObject({
					_id,
					systemId,
					createdAt,
				});
				expect(stored).not.toHaveProperty('failureCause');
				if (clearAll) {
					expect(stored).not.toHaveProperty('count');
					expect(stored).not.toHaveProperty('status');
				} else {
					expect(stored).toMatchObject({ count, status });
				}
				em.clear();
				const reloaded = await repo.findById(id);
				expect(reloaded).toMatchObject({
					id,
					systemId,
					createdAt,
				});
				expect(reloaded.count).toBe(count);
				expect(reloaded.status).toBe(status);
				expect(reloaded.failureCause).toBeUndefined();
			}
		);

		it('should reject updating a missing synchronization without inserting a document', async () => {
			const update = synchronizationFactory.build({ id: new ObjectId().toHexString() });

			await expect(repo.update(update)).rejects.toThrow(NotFoundError);

			expect(await em.getCollection(SynchronizationEntity).findOne({ _id: new ObjectId(update.id) })).toBeNull();
		});

		describe('when update a synchronization', () => {
			const setup = async () => {
				const entity: SynchronizationEntity = synchronizationEntityFactory.build();
				await em.persist(entity).flush();

				// Arrange expected DeletionRequestEntity after changing status
				entity.status = SynchronizationStatusModel.SUCCESS;
				const synchronizationToUpdate = SynchronizationMapper.mapToDO(entity);

				return { entity, synchronizationToUpdate };
			};
			it('should update a new deletionLog', async () => {
				const { entity, synchronizationToUpdate } = await setup();

				await repo.update(synchronizationToUpdate);

				const result = await repo.findById(entity.id);

				expect(result.status).toEqual(entity.status);
			});
		});
	});
});
