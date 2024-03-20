import { EntityManager } from '@mikro-orm/mongodb';
import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { cleanupCollections } from '@shared/testing';
import { StatusModel } from '@shared/domain/types';
import { Synchronization } from '../domain';
import { synchronizationFactory } from '../domain/testing';
import { SynchronizationEntity } from '../entity';
import { synchronizationEntityFactory } from '../entity/testing';
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
				await em.persistAndFlush(entity);

				// Arrange expected DeletionRequestEntity after changing status
				entity.status = StatusModel.SUCCESS;
				const synchronizationToUpdate = SynchronizationMapper.mapToDO(entity);

				return {
					entity,
					synchronizationToUpdate,
				};
			};

			it('should find the synchronization', async () => {
				const { entity, synchronizationToUpdate } = await setup();

				await repo.update(synchronizationToUpdate);

				const result: Synchronization = await repo.findById(entity.id);

				expect(result.status).toEqual(entity.status);
			});
		});
	});

	describe('update', () => {
		describe('when update a synchronization', () => {
			const setup = async () => {
				const entity: SynchronizationEntity = synchronizationEntityFactory.build();
				await em.persistAndFlush(entity);

				// Arrange expected DeletionRequestEntity after changing status
				entity.status = StatusModel.SUCCESS;
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
