import { EntityManager } from '@mikro-orm/mongodb';
import { ObjectId } from 'bson';
import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { cleanupCollections } from '@shared/testing';
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
				await em.persistAndFlush(entity);

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

	describe('findAllItemsToExecution', () => {
		describe('when there is no deletionRequest for execution', () => {
			const setup = () => {
				const threshold = 1000;

				return {
					threshold,
				};
			};
			it('should return empty array', async () => {
				const { threshold } = setup();
				const result = await repo.findAllItemsToExecution(threshold);

				expect(result).toEqual([]);
			});
		});

		describe('when there are deletionRequests for execution', () => {
			const setup = async () => {
				const threshold = 1000;
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
				});
				const deletionRequestEntity4: DeletionRequestEntity = deletionRequestEntityFactory.build({
					createdAt: new Date(2023, 9, 1),
					updatedAt: new Date(2023, 9, 1),
					deleteAfter: new Date(2023, 10, 1),
				});
				const deletionRequestEntity5: DeletionRequestEntity = deletionRequestEntityFactory.build({
					deleteAfter: dateInFuture,
				});

				await em.persistAndFlush([
					deletionRequestEntity1,
					deletionRequestEntity2,
					deletionRequestEntity3,
					deletionRequestEntity4,
					deletionRequestEntity5,
				]);
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
					{
						id: deletionRequestEntity2.id,
						targetRefDomain: deletionRequestEntity2.targetRefDomain,
						deleteAfter: deletionRequestEntity2.deleteAfter,
						targetRefId: deletionRequestEntity2.targetRefId,
						status: deletionRequestEntity2.status,
						createdAt: deletionRequestEntity2.createdAt,
						updatedAt: deletionRequestEntity2.updatedAt,
					},
				];

				return { deletionRequestEntity1, deletionRequestEntity5, expectedArray, threshold };
			};

			it('should find deletionRequests with deleteAfter smaller then today and status with value registered or failed', async () => {
				const { deletionRequestEntity1, deletionRequestEntity5, expectedArray, threshold } = await setup();

				const results = await repo.findAllItemsToExecution(threshold);

				expect(results.length).toEqual(3);

				// Verify explicit fields.
				expect(results).toEqual(
					expect.arrayContaining([
						expect.objectContaining(expectedArray[0]),
						expect.objectContaining(expectedArray[1]),
						expect.objectContaining(expectedArray[2]),
					])
				);

				const result1: DeletionRequest = await repo.findById(deletionRequestEntity1.id);

				expect(result1.id).toEqual(deletionRequestEntity1.id);

				const result5: DeletionRequest = await repo.findById(deletionRequestEntity5.id);

				expect(result5.id).toEqual(deletionRequestEntity5.id);
			});

			it('should find deletionRequests to execute with limit = 2', async () => {
				const { expectedArray, threshold } = await setup();

				const results = await repo.findAllItemsToExecution(threshold, 2);

				expect(results.length).toEqual(2);

				// Verify explicit fields.
				expect(results).toEqual(
					expect.arrayContaining([expect.objectContaining(expectedArray[0]), expect.objectContaining(expectedArray[1])])
				);
			});
		});
	});

	describe('update', () => {
		describe('when updating deletionRequest', () => {
			const setup = async () => {
				const userId = new ObjectId().toHexString();

				const entity: DeletionRequestEntity = deletionRequestEntityFactory.build({ targetRefId: userId });
				await em.persistAndFlush(entity);

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
				await em.persistAndFlush(entity);

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
				await em.persistAndFlush(entity);

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
				await em.persistAndFlush(entity);

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
				await em.persistAndFlush(entity);
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
});
