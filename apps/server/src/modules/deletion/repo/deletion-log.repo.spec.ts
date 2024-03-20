import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { cleanupCollections } from '@shared/testing';
import { DeletionLog } from '../domain/do';
import { deletionLogFactory } from '../domain/testing';
import { DeletionLogRepo } from './deletion-log.repo';
import { DeletionLogEntity } from './entity';
import { deletionLogEntityFactory } from './entity/testing';
import { DeletionLogMapper } from './mapper';

describe(DeletionLogRepo.name, () => {
	let module: TestingModule;
	let repo: DeletionLogRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [DeletionLogEntity],
				}),
			],
			providers: [DeletionLogRepo, DeletionLogMapper],
		}).compile();

		repo = module.get(DeletionLogRepo);
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
			expect(repo.entityName).toBe(DeletionLogEntity);
		});
	});

	describe('create deletionLog', () => {
		describe('when deletionLog is new', () => {
			const setup = () => {
				const domainObject: DeletionLog = deletionLogFactory.build();
				const deletionLogId = domainObject.id;

				const expectedDomainObject = {
					id: domainObject.id,
					domain: domainObject.domain,
					operations: domainObject.operations,
					subdomainOperations: domainObject.subdomainOperations,
					deletionRequestId: domainObject.deletionRequestId,
					performedAt: domainObject.performedAt,
					createdAt: domainObject.createdAt,
					updatedAt: domainObject.updatedAt,
				};

				return { domainObject, deletionLogId, expectedDomainObject };
			};

			it('should create a new deletionLog', async () => {
				const { domainObject, deletionLogId, expectedDomainObject } = setup();
				await repo.create(domainObject);

				const result = await repo.findById(deletionLogId);

				expect(result).toEqual(expect.objectContaining(expectedDomainObject));
			});
		});
	});

	describe('findById', () => {
		describe('when searching by Id', () => {
			const setup = async () => {
				// Test deletionLog entity
				const entity: DeletionLogEntity = deletionLogEntityFactory.buildWithId();
				await em.persistAndFlush(entity);

				const expectedDeletionLog = new DeletionLog({
					id: entity.id,
					domain: entity.domain,
					operations: entity.operations,
					subdomainOperations: entity.subdomainOperations,
					deletionRequestId: entity.deletionRequestId?.toHexString(),
					performedAt: entity.performedAt,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				});

				return {
					entity,
					expectedDeletionLog,
				};
			};

			it('should find the deletionRequest', async () => {
				const { entity, expectedDeletionLog } = await setup();

				const result: DeletionLog = await repo.findById(entity.id);

				// Verify explicit fields.
				expect(result).toEqual(expect.objectContaining(expectedDeletionLog));
			});
		});
	});

	describe('findAllByDeletionRequestId', () => {
		describe('when there is no deletionLog for deletionRequestId', () => {
			it('should return empty array', async () => {
				const deletionRequestId = new ObjectId().toHexString();
				const result = await repo.findAllByDeletionRequestId(deletionRequestId);

				expect(result).toEqual([]);
			});
		});

		describe('when searching by deletionRequestId', () => {
			const setup = async () => {
				const deletionRequest1Id = new ObjectId();
				const deletionRequest2Id = new ObjectId();
				const deletionLogEntity1: DeletionLogEntity = deletionLogEntityFactory.build({
					deletionRequestId: deletionRequest1Id,
				});
				const deletionLogEntity2: DeletionLogEntity = deletionLogEntityFactory.build({
					deletionRequestId: deletionRequest1Id,
				});
				const deletionLogEntity3: DeletionLogEntity = deletionLogEntityFactory.build({
					deletionRequestId: deletionRequest2Id,
				});

				await em.persistAndFlush([deletionLogEntity1, deletionLogEntity2, deletionLogEntity3]);
				em.clear();

				const expectedArray = [
					new DeletionLog({
						id: deletionLogEntity1.id,
						domain: deletionLogEntity1.domain,
						operations: deletionLogEntity1.operations,
						subdomainOperations: deletionLogEntity1.subdomainOperations,
						deletionRequestId: deletionLogEntity1.deletionRequestId?.toHexString(),
						performedAt: deletionLogEntity1.performedAt,
						createdAt: deletionLogEntity1.createdAt,
						updatedAt: deletionLogEntity1.updatedAt,
					}),
					new DeletionLog({
						id: deletionLogEntity2.id,
						domain: deletionLogEntity2.domain,
						operations: deletionLogEntity2.operations,
						subdomainOperations: deletionLogEntity2.subdomainOperations,
						deletionRequestId: deletionLogEntity2.deletionRequestId?.toHexString(),
						performedAt: deletionLogEntity2.performedAt,
						createdAt: deletionLogEntity2.createdAt,
						updatedAt: deletionLogEntity2.updatedAt,
					}),
				];

				return { deletionLogEntity3, deletionRequest1Id, expectedArray };
			};

			it('should find deletionRequests with deleteAfter smaller then today', async () => {
				const { deletionLogEntity3, deletionRequest1Id, expectedArray } = await setup();

				const results = await repo.findAllByDeletionRequestId(deletionRequest1Id?.toHexString());

				expect(results.length).toEqual(2);

				// Verify explicit fields.
				expect(results).toEqual(
					expect.arrayContaining([expect.objectContaining(expectedArray[0]), expect.objectContaining(expectedArray[1])])
				);

				const result: DeletionLog = await repo.findById(deletionLogEntity3.id);

				expect(result.id).toEqual(deletionLogEntity3.id);
			});
		});
	});
});
