import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { cleanupCollections } from '@shared/testing';
import { DeletionLogMapper } from './mapper';
import { DeletionLogEntity } from '../entity';
import { DeletionLogRepo } from './deletion-log.repo';
import { deletionLogFactory } from '../domain/testing/factory/deletion-log.factory';
import { DeletionLog } from '../domain/deletion-log.do';
import { deletionLogEntityFactory } from '../entity/testing/factory/deletion-log.entity.factory';

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
					domainOperationReport: domainObject.domainOperationReport,
					domainDeletionReport: domainObject.domainDeletionReport
						? new DeletionLog({
								id: domainObject.domainDeletionReport.id,
								createdAt: domainObject.domainDeletionReport?.createdAt,
								deletionRequestId: domainObject.domainDeletionReport?.deletionRequestId,
								domain: domainObject.domainDeletionReport?.domain,
								domainOperationReport: domainObject.domainDeletionReport?.domainOperationReport,
								performedAt: domainObject.domainDeletionReport?.performedAt,
								updatedAt: domainObject.domainDeletionReport?.updatedAt,
						  })
						: undefined,
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
					domainOperationReport: entity.domainOperationReport,
					domainDeletionReport: entity.domainDeletionReport
						? new DeletionLog({
								id: entity.domainDeletionReport.id,
								createdAt: entity.domainDeletionReport?.createdAt,
								deletionRequestId: entity.domainDeletionReport?.deletionRequestId?.toHexString(),
								domain: entity.domainDeletionReport?.domain,
								domainOperationReport: entity.domainDeletionReport?.domainOperationReport,
								performedAt: entity.domainDeletionReport?.performedAt,
								updatedAt: entity.domainDeletionReport?.updatedAt,
						  })
						: undefined,
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
				// const deletionRequest1Id = new ObjectId();
				// const deletionRequest2Id = new ObjectId();
				const deletionLogEntity1: DeletionLogEntity = deletionLogEntityFactory.buildWithId();
				const deletionRequest1Id = deletionLogEntity1.deletionRequestId;
				// const deletionLogEntity2: DeletionLogEntity = deletionLogEntityFactory.build({
				// 	deletionRequestId: deletionRequest1Id,
				// });
				const deletionLogEntity3: DeletionLogEntity = deletionLogEntityFactory.buildWithId();

				await em.persistAndFlush([deletionLogEntity1, deletionLogEntity3]);
				em.clear();

				const expectedArray = [
					new DeletionLog({
						id: deletionLogEntity1.id,
						domain: deletionLogEntity1.domain,
						domainOperationReport: deletionLogEntity1.domainOperationReport,
						domainDeletionReport: deletionLogEntity1.domainDeletionReport
							? new DeletionLog({
									id: deletionLogEntity1.domainDeletionReport.id,
									createdAt: deletionLogEntity1.domainDeletionReport?.createdAt,
									deletionRequestId: deletionLogEntity1.domainDeletionReport?.deletionRequestId?.toHexString(),
									domain: deletionLogEntity1.domainDeletionReport?.domain,
									domainOperationReport: deletionLogEntity1.domainDeletionReport?.domainOperationReport,
									performedAt: deletionLogEntity1.domainDeletionReport?.performedAt,
									updatedAt: deletionLogEntity1.domainDeletionReport?.updatedAt,
							  })
							: undefined,
						deletionRequestId: deletionLogEntity1.deletionRequestId?.toHexString(),
						performedAt: deletionLogEntity1.performedAt,
						createdAt: deletionLogEntity1.createdAt,
						updatedAt: deletionLogEntity1.updatedAt,
					}),
					// {
					// 	id: deletionLogEntity2.id,
					// 	domain: deletionLogEntity2.domain,
					// 	domainOperationReport: deletionLogEntity2.domainOperationReport,
					// 	domainDeletionReport: deletionLogEntity2.domainDeletionReport
					// 		? new DeletionLog({
					// 				id: deletionLogEntity2.domainDeletionReport.id,
					// 				createdAt: deletionLogEntity2.domainDeletionReport?.createdAt,
					// 				deletionRequestId: deletionLogEntity2.domainDeletionReport?.deletionRequestId?.toHexString(),
					// 				domain: deletionLogEntity2.domainDeletionReport?.domain,
					// 				domainOperationReport: deletionLogEntity2.domainDeletionReport?.domainOperationReport,
					// 				performedAt: deletionLogEntity2.domainDeletionReport?.performedAt,
					// 				updatedAt: deletionLogEntity2.domainDeletionReport?.updatedAt,
					// 		  })
					// 		: undefined,
					// 	deletionRequestId: deletionLogEntity2.deletionRequestId?.toHexString(),
					// 	performedAt: deletionLogEntity2.performedAt,
					// 	createdAt: deletionLogEntity2.createdAt,
					// 	updatedAt: deletionLogEntity2.updatedAt,
					// },
				];

				return { deletionLogEntity3, deletionRequest1Id, expectedArray };
			};

			it('should find deletionRequests with deleteAfter smaller then today', async () => {
				const { deletionLogEntity3, deletionRequest1Id, expectedArray } = await setup();

				if (deletionRequest1Id) {
					const results = await repo.findAllByDeletionRequestId(deletionRequest1Id?.toHexString());

					expect(results.length).toEqual(1);

					// Verify explicit fields.
					// expect(results).toEqual(
					// 	expect.arrayContaining([expect.objectContaining(expectedArray[0]), expect.objectContaining(expectedArray[1])])
					// );
					expect(results[0]).toEqual(expect.objectContaining(expectedArray[0]));

					const result: DeletionLog = await repo.findById(deletionLogEntity3.id);

					expect(result.id).toEqual(deletionLogEntity3.id);
				}
			});
		});
	});
});
