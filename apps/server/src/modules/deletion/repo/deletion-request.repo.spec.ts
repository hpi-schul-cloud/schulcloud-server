import { EntityManager } from '@mikro-orm/mongodb';
import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ObjectId } from 'bson';
import { DeletionRequest } from '../domain/do';
import { deletionRequestFactory } from '../domain/testing';
import { StatusModel } from '../domain/types';
import { DeletionRequestRepo } from './deletion-request.repo';
import { DeletionRequestEntity } from './entity';
import { deletionRequestEntityFactory } from './entity/testing';
import { DeletionRequestMapper } from './mapper';

describe(DeletionRequestRepo.name, () => {
	let module: TestingModule;
	let repo: DeletionRequestRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [DeletionRequestEntity],
				}),
			],
			providers: [DeletionRequestRepo, DeletionRequestMapper],
		}).compile();

		repo = module.get(DeletionRequestRepo);
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
			expect(repo.entityName).toBe(DeletionRequestEntity);
		});
	});

	describe('create deletionRequest', () => {
		describe('when deletionRequest is new', () => {
			it('should create a new deletionRequest', async () => {
				const domainObject: DeletionRequest = deletionRequestFactory.build();
				const deletionRequestId = domainObject.id;
				await repo.create(domainObject);

				const result = await repo.findById(deletionRequestId);

				expect(result).toEqual(domainObject);
			});
		});
	});

	describe('findById', () => {
		describe('when searching by Id', () => {
			const setup = async () => {
				const userId = new ObjectId().toHexString();

				const entity: DeletionRequestEntity = deletionRequestEntityFactory.build({ targetRefId: userId });
				await em.persist(entity).flush();

				const expectedDeletionRequest = {
					id: entity.id,
					targetRefDomain: entity.targetRefDomain,
					deleteAfter: entity.deleteAfter,
					targetRefId: entity.targetRefId,
					status: entity.status,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				};

				return {
					entity,
					expectedDeletionRequest,
				};
			};

			it('should find the deletionRequest', async () => {
				const { entity, expectedDeletionRequest } = await setup();

				const result: DeletionRequest = await repo.findById(entity.id);

				// Verify explicit fields.
				expect(result).toEqual(expect.objectContaining(expectedDeletionRequest));
			});
		});
	});

	describe('findAllItems', () => {
		describe('when there is no deletionRequest for execution', () => {
			const setup = () => {
				const limit = 1000;

				return {
					limit,
				};
			};
			it('should return empty array', async () => {
				const { limit } = setup();
				const result = await repo.findAllItems(limit);

				expect(result).toEqual([]);
			});
		});

		describe('when there are deletionRequests for execution', () => {
			const setup = async () => {
				const limit = 1000;

				const dateInFuture = new Date();
				dateInFuture.setDate(dateInFuture.getDate() + 30);

				const deletionRequestEntity1: DeletionRequestEntity = deletionRequestEntityFactory.build({
					createdAt: new Date(2023, 7, 1),
					updatedAt: new Date(2023, 8, 2),
					deleteAfter: new Date(2023, 8, 1),
					status: StatusModel.SUCCESS,
				});
				const deletionRequestEntity2: DeletionRequestEntity = deletionRequestEntityFactory.build({
					createdAt: new Date(2023, 7, 1),
					updatedAt: new Date(2023, 8, 2),
					deleteAfter: new Date(2023, 8, 1),
					status: StatusModel.FAILED,
				});
				const deletionRequestEntity3: DeletionRequestEntity = deletionRequestEntityFactory.build({
					createdAt: new Date(2023, 8, 1),
					updatedAt: new Date(2023, 8, 1),
					deleteAfter: new Date(2023, 9, 1),
					status: StatusModel.REGISTERED,
				});
				const deletionRequestEntity4: DeletionRequestEntity = deletionRequestEntityFactory.build({
					createdAt: new Date(2023, 9, 1),
					updatedAt: new Date(2023, 9, 1),
					deleteAfter: new Date(2023, 10, 1),
					status: StatusModel.REGISTERED,
				});
				const deletionRequestEntity5: DeletionRequestEntity = deletionRequestEntityFactory.build({
					deleteAfter: dateInFuture,
					status: StatusModel.REGISTERED,
				});

				await em
					.persist([
						deletionRequestEntity1,
						deletionRequestEntity2,
						deletionRequestEntity3,
						deletionRequestEntity4,
						deletionRequestEntity5,
					])
					.flush();
				em.clear();

				const expectedArray = [
					{
						id: deletionRequestEntity4.id,
						targetRefDomain: deletionRequestEntity4.targetRefDomain,
						deleteAfter: deletionRequestEntity4.deleteAfter,
						targetRefId: deletionRequestEntity4.targetRefId,
						status: deletionRequestEntity4.status,
						createdAt: deletionRequestEntity4.createdAt,
						updatedAt: deletionRequestEntity4.updatedAt,
					},
					{
						id: deletionRequestEntity3.id,
						targetRefDomain: deletionRequestEntity3.targetRefDomain,
						deleteAfter: deletionRequestEntity3.deleteAfter,
						targetRefId: deletionRequestEntity3.targetRefId,
						status: deletionRequestEntity3.status,
						createdAt: deletionRequestEntity3.createdAt,
						updatedAt: deletionRequestEntity3.updatedAt,
					},
				];

				return { deletionRequestEntity1, deletionRequestEntity5, expectedArray, limit };
			};

			it('should find deletionRequests with deleteAfter smaller then today and status with value registered', async () => {
				const { deletionRequestEntity1, deletionRequestEntity5, expectedArray, limit } = await setup();

				const results = await repo.findAllItems(limit);

				expect(results.length).toEqual(2);

				// Verify explicit fields.
				expect(results).toEqual(
					expect.arrayContaining([expect.objectContaining(expectedArray[0]), expect.objectContaining(expectedArray[1])])
				);

				const result1: DeletionRequest = await repo.findById(deletionRequestEntity1.id);

				expect(result1.id).toEqual(deletionRequestEntity1.id);

				const result5: DeletionRequest = await repo.findById(deletionRequestEntity5.id);

				expect(result5.id).toEqual(deletionRequestEntity5.id);
			});

			it('should find deletionRequests to execute with limit = 2', async () => {
				const { expectedArray } = await setup();

				const results = await repo.findAllItems(2);

				expect(results.length).toEqual(2);

				// Verify explicit fields.
				expect(results).toEqual(
					expect.arrayContaining([expect.objectContaining(expectedArray[0]), expect.objectContaining(expectedArray[1])])
				);
			});
		});
	});

	describe('findAllFailedItems', () => {
		const setup = async () => {
			const limit = 10;
			const olderThan = new Date(2023, 11, 1);
			const newerThan = new Date(2023, 8, 1);

			const deletionRequestEntity1: DeletionRequestEntity = deletionRequestEntityFactory.build({
				createdAt: new Date(2023, 7, 1),
				updatedAt: new Date(2023, 8, 2),
				deleteAfter: new Date(2023, 8, 1),
				status: StatusModel.PENDING,
			});
			const deletionRequestEntity2: DeletionRequestEntity = deletionRequestEntityFactory.build({
				createdAt: new Date(2023, 7, 1),
				updatedAt: new Date(2023, 8, 2),
				deleteAfter: new Date(2023, 8, 1),
				status: StatusModel.FAILED,
			});
			const deletionRequestEntity3: DeletionRequestEntity = deletionRequestEntityFactory.build({
				createdAt: new Date(2023, 8, 1),
				updatedAt: new Date(2023, 7, 1),
				deleteAfter: new Date(2023, 9, 1),
				status: StatusModel.FAILED,
			});
			const deletionRequestEntity4: DeletionRequestEntity = deletionRequestEntityFactory.build({
				createdAt: new Date(2023, 8, 1),
				updatedAt: new Date(2023, 8, 1),
				deleteAfter: new Date(2023, 9, 1),
				status: StatusModel.REGISTERED,
			});

			await em
				.persist([deletionRequestEntity1, deletionRequestEntity2, deletionRequestEntity3, deletionRequestEntity4])
				.flush();
			em.clear();

			return { limit, olderThan, newerThan, deletionRequestEntity1, deletionRequestEntity2 };
		};

		it('should throw an error if olderThan is less than newerThan', async () => {
			const { limit } = await setup();

			const olderThan = new Date(2023, 10, 1);
			const newerThan = new Date(2023, 11, 1);

			await expect(repo.findAllFailedItems(limit, olderThan, newerThan)).rejects.toThrow();
		});

		it('should return failed deletion requests within the specified date range', async () => {
			const { limit, olderThan, newerThan, deletionRequestEntity1, deletionRequestEntity2 } = await setup();

			const results = await repo.findAllFailedItems(limit, olderThan, newerThan);

			expect(results.length).toBe(2);
			expect(results[0].id).toBe(deletionRequestEntity1.id);
			expect(results[1].id).toBe(deletionRequestEntity2.id);
		});
	});

	describe('update', () => {
		describe('when updating deletionRequest', () => {
			const setup = async () => {
				const userId = new ObjectId().toHexString();

				const entity: DeletionRequestEntity = deletionRequestEntityFactory.build({ targetRefId: userId });
				await em.persist(entity).flush();

				// Arrange expected DeletionRequestEntity after changing status
				entity.status = StatusModel.SUCCESS;
				const deletionRequestToUpdate = DeletionRequestMapper.mapToDO(entity);

				return {
					entity,
					deletionRequestToUpdate,
				};
			};

			it('should update the deletionRequest', async () => {
				const { entity, deletionRequestToUpdate } = await setup();

				await repo.update(deletionRequestToUpdate);

				const result: DeletionRequest = await repo.findById(entity.id);

				expect(result.status).toEqual(entity.status);
			});
		});
	});

	describe('markDeletionRequestAsFailed', () => {
		describe('when mark deletionRequest as failed', () => {
			const setup = async () => {
				const userId = new ObjectId().toHexString();

				const entity: DeletionRequestEntity = deletionRequestEntityFactory.build({ targetRefId: userId });
				await em.persist(entity).flush();

				return { entity };
			};

			it('should update the deletionRequest', async () => {
				const { entity } = await setup();

				const result = await repo.markDeletionRequestAsFailed(entity.id);

				expect(result).toBe(true);
			});

			it('should update the deletionRequest', async () => {
				const { entity } = await setup();

				await repo.markDeletionRequestAsFailed(entity.id);

				const result: DeletionRequest = await repo.findById(entity.id);

				expect(result.status).toEqual(StatusModel.FAILED);
			});
		});
	});

	describe('markDeletionRequestAsExecuted', () => {
		describe('when mark deletionRequest as executed', () => {
			const setup = async () => {
				const userId = new ObjectId().toHexString();

				const entity: DeletionRequestEntity = deletionRequestEntityFactory.build({ targetRefId: userId });
				await em.persist(entity).flush();

				return { entity };
			};

			it('should update the deletionRequest', async () => {
				const { entity } = await setup();

				const result = await repo.markDeletionRequestAsExecuted(entity.id);

				expect(result).toBe(true);
			});

			it('should update the deletionRequest', async () => {
				const { entity } = await setup();

				await repo.markDeletionRequestAsExecuted(entity.id);

				const result: DeletionRequest = await repo.findById(entity.id);

				expect(result.status).toEqual(StatusModel.SUCCESS);
			});
		});
	});

	describe('markDeletionRequestAsPending', () => {
		describe('when mark deletionRequest as pending', () => {
			const setup = async () => {
				const userId = new ObjectId().toHexString();

				const entity: DeletionRequestEntity = deletionRequestEntityFactory.build({ targetRefId: userId });
				await em.persist(entity).flush();

				return { entity };
			};

			it('should update the deletionRequest', async () => {
				const { entity } = await setup();

				const result = await repo.markDeletionRequestAsPending(entity.id);

				expect(result).toBe(true);
			});

			it('should update the deletionRequest', async () => {
				const { entity } = await setup();

				await repo.markDeletionRequestAsPending(entity.id);

				const result: DeletionRequest = await repo.findById(entity.id);

				expect(result.status).toEqual(StatusModel.PENDING);
			});
		});
	});

	describe('deleteById', () => {
		describe('when deleting deletionRequest exists', () => {
			const setup = async () => {
				const userId = new ObjectId().toHexString();
				const entity: DeletionRequestEntity = deletionRequestEntityFactory.build({ targetRefId: userId });
				const deletionRequestId = entity.id;
				await em.persist(entity).flush();
				em.clear();

				return { deletionRequestId };
			};

			it('should delete the deletionRequest with deletionRequestId', async () => {
				const { deletionRequestId } = await setup();

				await repo.deleteById(deletionRequestId);

				expect(await em.findOne(DeletionRequestEntity, { id: deletionRequestId })).toBeNull();
			});

			it('should return true', async () => {
				const { deletionRequestId } = await setup();

				const result: boolean = await repo.deleteById(deletionRequestId);

				expect(result).toEqual(true);
			});
		});
	});

	describe('findByIds', () => {
		describe('when searching for multiple IDs', () => {
			const setup = async () => {
				const userId1 = new ObjectId().toHexString();
				const userId2 = new ObjectId().toHexString();
				const userId3 = new ObjectId().toHexString();

				const entity1: DeletionRequestEntity = deletionRequestEntityFactory.build({ targetRefId: userId1 });
				const entity2: DeletionRequestEntity = deletionRequestEntityFactory.build({ targetRefId: userId2 });

				await em.persist([entity1, entity2]).flush();
				em.clear();

				return {
					ids: [entity1.id, entity2.id, userId3], // userId3 does not exist
					expectedResults: [
						{
							id: entity1.id,
							targetRefDomain: entity1.targetRefDomain,
							deleteAfter: entity1.deleteAfter,
							targetRefId: entity1.targetRefId,
							status: entity1.status,
							createdAt: entity1.createdAt,
							updatedAt: entity1.updatedAt,
						},
						{
							id: entity2.id,
							targetRefDomain: entity2.targetRefDomain,
							deleteAfter: entity2.deleteAfter,
							targetRefId: entity2.targetRefId,
							status: entity2.status,
							createdAt: entity2.createdAt,
							updatedAt: entity2.updatedAt,
						},
						null, // for userId3 which does not exist
					],
				};
			};

			it('should return the correct deletionRequests and null for missing IDs', async () => {
				const { ids, expectedResults } = await setup();

				const results = await repo.findByIds(ids);

				expect(results).toEqual([
					expect.objectContaining(expectedResults[0]),
					expect.objectContaining(expectedResults[1]),
					null,
				]);
			});
		});
	});

	describe('findRegisteredByTargetRefId', () => {
		describe('when searching for deletionRequest by targetRefId', () => {
			const setup = async () => {
				const userId = new ObjectId().toHexString();

				const entity: DeletionRequestEntity = deletionRequestEntityFactory.build({
					targetRefId: userId,
					status: StatusModel.REGISTERED,
				});
				await em.persist(entity).flush();

				return { userId, entity };
			};

			it('should return the deletionRequest with status registered', async () => {
				const { userId, entity } = await setup();

				const result: DeletionRequest[] = await repo.findRegisteredByTargetRefId([userId]);

				expect(result[0].id).toEqual(entity.id);
				expect(result[0].status).toEqual(StatusModel.REGISTERED);
			});
		});
	});

	describe('findFailedByTargetRefId', () => {
		describe('when searching for deletionRequest by targetRefId', () => {
			const setup = async () => {
				const userId = new ObjectId().toHexString();

				const entity: DeletionRequestEntity = deletionRequestEntityFactory.build({
					targetRefId: userId,
					status: StatusModel.FAILED,
				});
				await em.persist(entity).flush();

				return { userId, entity };
			};

			it('should return the deletionRequest with status registered', async () => {
				const { userId, entity } = await setup();

				const result: DeletionRequest[] = await repo.findFailedByTargetRefId([userId]);

				expect(result[0].id).toEqual(entity.id);
				expect(result[0].status).toEqual(StatusModel.FAILED);
			});
		});
	});

	describe('findPendingByTargetRefId', () => {
		describe('when searching for deletionRequest by targetRefId', () => {
			const setup = async () => {
				const userId = new ObjectId().toHexString();

				const entity: DeletionRequestEntity = deletionRequestEntityFactory.build({
					targetRefId: userId,
					status: StatusModel.PENDING,
				});
				await em.persist(entity).flush();

				return { userId, entity };
			};

			it('should return the deletionRequest with status registered', async () => {
				const { userId, entity } = await setup();

				const result: DeletionRequest[] = await repo.findPendingByTargetRefId([userId]);

				expect(result[0].id).toEqual(entity.id);
				expect(result[0].status).toEqual(StatusModel.PENDING);
			});
		});
	});

	describe('findSuccessfulByTargetRefId', () => {
		describe('when searching for deletionRequest by targetRefId', () => {
			const setup = async () => {
				const userId = new ObjectId().toHexString();

				const entity: DeletionRequestEntity = deletionRequestEntityFactory.build({
					targetRefId: userId,
					status: StatusModel.SUCCESS,
				});
				await em.persist(entity).flush();

				return { userId, entity };
			};

			it('should return the deletionRequest with status registered', async () => {
				const { userId, entity } = await setup();

				const result: DeletionRequest[] = await repo.findSuccessfulByTargetRefId([userId]);

				expect(result[0].id).toEqual(entity.id);
				expect(result[0].status).toEqual(StatusModel.SUCCESS);
			});
		});
	});
});
