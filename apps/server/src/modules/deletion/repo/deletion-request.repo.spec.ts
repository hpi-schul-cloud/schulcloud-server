import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { DeletionRequestMapper } from './mapper';
import { DeletionRequestRepo } from './deletion-request.repo';
import { DeletionRequestEntity } from '../entity';
import { DeletionRequest } from '../domain/deletion-request.do';
import { deletionRequestEntityFactory } from '../entity/testing/factory/deletion-request.entity.factory';
import { deletionRequestFactory } from '../domain/testing/factory/deletion-request.factory';
import { DeletionStatusModel } from '../domain/types/deletion-status-model.enum';

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

	describe('findAllItemsByDeletionDate', () => {
		describe('when there is no deletionRequest for execution', () => {
			it('should return empty array', async () => {
				const result = await repo.findAllItemsByDeletionDate();

				expect(result).toEqual([]);
			});
		});

		describe('when there are deletionRequests for execution', () => {
			const setup = async () => {
				const dateInFuture = new Date();
				dateInFuture.setDate(dateInFuture.getDate() + 30);
				const deletionRequestEntity1: DeletionRequestEntity = deletionRequestEntityFactory.build({
					deleteAfter: new Date(2023, 9, 1),
				});
				const deletionRequestEntity2: DeletionRequestEntity = deletionRequestEntityFactory.build({
					deleteAfter: new Date(2023, 9, 1),
				});
				const deletionRequestEntity3: DeletionRequestEntity = deletionRequestEntityFactory.build({
					deleteAfter: dateInFuture,
				});

				await em.persistAndFlush([deletionRequestEntity1, deletionRequestEntity2, deletionRequestEntity3]);
				em.clear();

				const expectedArray = [
					{
						id: deletionRequestEntity1.id,
						targetRefDomain: deletionRequestEntity1.targetRefDomain,
						deleteAfter: deletionRequestEntity1.deleteAfter,
						targetRefId: deletionRequestEntity1.targetRefId,
						status: deletionRequestEntity1.status,
						createdAt: deletionRequestEntity1.createdAt,
						updatedAt: deletionRequestEntity1.updatedAt,
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

				return { deletionRequestEntity3, expectedArray };
			};

			it('should find deletionRequests with deleteAfter smaller then today', async () => {
				const { deletionRequestEntity3, expectedArray } = await setup();

				const results = await repo.findAllItemsByDeletionDate();

				expect(results.length).toEqual(2);

				// Verify explicit fields.
				expect(results).toEqual(
					expect.arrayContaining([expect.objectContaining(expectedArray[0]), expect.objectContaining(expectedArray[1])])
				);

				const result: DeletionRequest = await repo.findById(deletionRequestEntity3.id);

				expect(result.id).toEqual(deletionRequestEntity3.id);
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
				entity.status = DeletionStatusModel.SUCCESS;
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

				expect(result.status).toEqual(DeletionStatusModel.SUCCESS);
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

		describe('when no deletionRequestEntity exists', () => {
			const setup = () => {
				const deletionRequestId = new ObjectId().toHexString();

				return { deletionRequestId };
			};

			it('should return false', async () => {
				const { deletionRequestId } = setup();

				const result: boolean = await repo.deleteById(deletionRequestId);

				expect(result).toEqual(false);
			});
		});
	});
});
